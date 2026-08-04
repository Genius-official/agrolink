import { Router } from 'express';
import { db } from '../db/store.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', optionalAuth, (req, res) => {
  const activeEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();

  if (!activeEmail) {
    return res.json({ data: [], total: 0, unread: 0 });
  }

  const notifs = db.notifications.all(n =>
    n && n.recipientEmail && n.recipientEmail.toLowerCase().trim() === activeEmail
  );

  notifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ data: notifs, total: notifs.length, unread: notifs.filter(n => !n.read).length });
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
router.patch('/read-all', optionalAuth, async (req, res) => {
  const activeEmail = (req.user?.email || req.body.email || req.query.email || '').toLowerCase().trim();

  if (activeEmail) {
    await db.notifications.updateWhere(
      n => n && n.recipientEmail && n.recipientEmail.toLowerCase().trim() === activeEmail && !n.read,
      { read: true }
    );
  }

  res.json({ message: 'All notifications marked as read.' });
});

// ─── PATCH /api/notifications/:id ────────────────────────────────────────────
router.patch('/:id', optionalAuth, async (req, res) => {
  const notif = db.notifications.byId(req.params.id) || db.notifications.one(n => String(n.id) === String(req.params.id));
  if (!notif) return res.status(404).json({ error: 'Notification not found.' });

  const { read, message, type } = req.body;
  const patch = {};
  if (read !== undefined)   patch.read = read;
  if (message !== undefined) patch.message = message;
  if (type !== undefined)   patch.type = type;

  const updated = await db.notifications.updateById(notif.id, patch);
  res.json({ data: updated });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
router.delete('/:id', optionalAuth, async (req, res) => {
  const notif = db.notifications.byId(req.params.id) || db.notifications.one(n => String(n.id) === String(req.params.id));
  if (!notif) return res.status(404).json({ error: 'Notification not found.' });

  await db.notifications.removeById(notif.id);
  res.json({ message: 'Notification deleted.' });
});

export default router;
