import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { broadcast } from '../sockets/index.js';

const router = Router();

const BADGE_STYLES = {
  Vegetables: { badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32' },
  Fruits:     { badgeColor: '#FFF8E1', badgeTextColor: '#FFB300' },
  Grains:     { badgeColor: '#FFF3E0', badgeTextColor: '#E65100' },
  Fertilizers:{ badgeColor: '#F3E5F5', badgeTextColor: '#7B1FA2' },
  Machinery:  { badgeColor: '#E3F2FD', badgeTextColor: '#1565C0' },
  Provisions: { badgeColor: '#E1F5FE', badgeTextColor: '#01579B' },
};

function getBadgeStyle(category) {
  return BADGE_STYLES[category] || { badgeColor: '#E8F5E9', badgeTextColor: '#2E7D32' };
}

// ─── GET /api/products ─────────────────────────────────────────────────────────

router.get('/', optionalAuth, (req, res) => {
  const { category, search, ownerEmail, status } = req.query;

  let products = db.products.all(p => p !== null);

  // Filter by category
  if (category && category !== 'all') {
    products = products.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }

  // Filter by owner
  if (ownerEmail) {
    products = products.filter(p => p.ownerEmail === ownerEmail);
  }

  // Filter by status (default: show only 'active' to non-owners/non-admins)
  if (status) {
    products = products.filter(p => p.status === status);
  }

  // Search by name or description
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }

  res.json({ data: products, total: products.length });
});

// ─── GET /api/products/:id ─────────────────────────────────────────────────────

router.get('/:id', (req, res) => {
  const product = db.products.byId(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ data: product });
});

// ─── POST /api/products ────────────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  try {
    const { name, category, price, unit, stock, description, img } = req.body;

    if (!name || !category || !price || !unit) {
      return res.status(400).json({ error: 'Name, category, price, and unit are required.' });
    }

    const user = db.users.byId(req.user.id);
    const { badgeColor, badgeTextColor } = getBadgeStyle(category);

    const product = {
      id: Date.now(),
      name: name.trim(),
      category,
      farm: user?.name || 'My Farm',
      ownerEmail: req.user.email,
      sellerAvatar: user?.avatar || null,
      location: user?.location || 'Ghana',
      phone: user?.phone || '',
      price: parseFloat(price),
      unit,
      img: img || 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=600&q=80',
      badge: category.toUpperCase(),
      badgeColor,
      badgeTextColor,
      description: description || '',
      stock: stock ? `${stock} ${unit} available` : 'In stock',
      rating: 5.0,
      reviews: 0,
      viewCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await db.products.insert(product);
    broadcast('product_created', product);
    res.status(201).json({ message: 'Product listed.', data: product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// ─── PATCH /api/products/:id ───────────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req, res) => {
  const product = db.products.byId(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const isOwner = product.ownerEmail === req.user.email;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const allowedFields = ['name', 'category', 'price', 'unit', 'stock', 'description', 'img', 'status'];
  const patch = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) patch[field] = req.body[field];
  }

  if (patch.category) {
    const { badgeColor, badgeTextColor } = getBadgeStyle(patch.category);
    patch.badge = patch.category.toUpperCase();
    patch.badgeColor = badgeColor;
    patch.badgeTextColor = badgeTextColor;
  }

  const updated = await db.products.updateById(req.params.id, patch);
  broadcast('product_updated', updated);
  res.json({ message: 'Product updated.', data: updated });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req, res) => {
  const product = db.products.byId(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const isOwner = product.ownerEmail === req.user.email;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  await db.products.removeById(req.params.id);
  broadcast('product_deleted', { id: req.params.id });
  res.json({ message: 'Product deleted.' });
});

// ─── POST /api/products/:id/view ──────────────────────────────────────────────

router.post('/:id/view', async (req, res) => {
  const product = db.products.byId(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const updated = await db.products.updateById(req.params.id, {
    viewCount: (product.viewCount || 0) + 1,
  });
  res.json({ data: { viewCount: updated.viewCount } });
});

export default router;
