import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

// ─── GET /api/users — Admin only: list all users ───────────────────────────────

router.get('/', requireAuth, requireRole('admin'), (req, res) => {
  const users = db.users.all().map(sanitizeUser);
  res.json({ data: users, total: users.length });
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────────

router.get('/:id', requireAuth, (req, res) => {
  const user = db.users.byId(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Non-admin users can only view their own profile
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json({ data: sanitizeUser(user) });
});

// ─── PATCH /api/users/:id ─────────────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  // Only the user themselves or an admin can update
  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const user = db.users.byId(id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const allowedFields = [
    'name', 'avatar', 'bio', 'phone', 'location', 'farmName', 'farm_name',
    'plan', 'verified', 'organicCertified', 'promotions', 'harvests', 'staff',
    'lowStockThreshold', 'shopLogo', 'shopBanner', 'shopDesc', 'shopTheme',
    'whatsappNumber', 'shopHours', 'shopSocials'
  ];
  const patch = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) patch[field] = req.body[field];
  }

  // Handle password change
  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    patch.password = await bcrypt.hash(req.body.password, 10);
  }

  const updated = await db.users.updateById(id, patch);

  // Cascade: update name/avatar on owned products
  if (patch.name || patch.avatar) {
    const productPatch = {};
    if (patch.name) productPatch.farm = patch.name;
    if (patch.avatar) productPatch.sellerAvatar = patch.avatar;
    await db.products.updateWhere(p => p.ownerEmail === user.email, productPatch);
  }

  // Cascade: update name/avatar on sent messages
  if (patch.name || patch.avatar) {
    const msgPatch = {};
    if (patch.name) msgPatch.senderName = patch.name;
    if (patch.avatar) msgPatch.senderAvatar = patch.avatar;
    await db.messages.updateWhere(m => m.senderEmail === user.email, msgPatch);
  }

  res.json({ message: 'Profile updated.', data: sanitizeUser(updated) });
});

// ─── DELETE /api/users/:id — Admin only ───────────────────────────────────────

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const user = db.users.byId(id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  // Protect admin account from deletion
  if (user.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin account.' });
  }

  await db.users.removeById(id);
  res.json({ message: 'User deleted.' });
});

export default router;
