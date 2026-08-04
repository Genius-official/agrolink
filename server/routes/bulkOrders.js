import { Router } from 'express';
import { db } from '../db/store.js';
import { optionalAuth } from '../middleware/auth.js';
import { emitToUser } from '../sockets/index.js';

export default function bulkOrderRoutes(io) {
  const router = Router();

  // ─── GET /api/bulk-orders ────────────────────────────────────────────────────
  router.get('/', optionalAuth, (req, res) => {
    const email = (req.user?.email || req.query.email || '').toLowerCase().trim();
    const role = req.user?.role || req.query.role || 'farmer';

    if (!email && role !== 'admin') {
      return res.json({ data: [], total: 0 });
    }

    let orders;
    if (role === 'admin') {
      orders = db.bulkOrders.all();
    } else if (role === 'buyer') {
      orders = db.bulkOrders.all(o => o && o.buyerEmail && o.buyerEmail.toLowerCase().trim() === email);
    } else {
      orders = db.bulkOrders.all(o => o && o.ownerEmail && o.ownerEmail.toLowerCase().trim() === email);
    }

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ data: orders, total: orders.length });
  });

  // ─── POST /api/bulk-orders ───────────────────────────────────────────────────
  router.post('/', optionalAuth, async (req, res) => {
    try {
      const { productName, qty, unit, targetPrice, comments, ownerEmail, buyerEmail, buyerName } = req.body || {};
      if (!productName || !qty || !ownerEmail) {
        return res.status(400).json({ error: 'productName, qty, and ownerEmail are required.' });
      }

      const activeBuyerEmail = (req.user?.email || buyerEmail || '').toLowerCase().trim();
      const cleanOwnerEmail = String(ownerEmail).toLowerCase().trim();
      const user = req.user?.id ? db.users.byId(req.user.id) : (activeBuyerEmail ? db.users.one(u => u.email === activeBuyerEmail) : null);

      const bulkOrder = {
        id: `BLK-${Date.now()}`,
        buyerName: buyerName || user?.name || req.user?.name || 'Buyer',
        buyerEmail: activeBuyerEmail,
        productName,
        qty: parseInt(qty),
        unit: unit || 'kg',
        targetPrice: parseFloat(targetPrice) || 0,
        status: 'pending',
        comments: comments || '',
        ownerEmail: cleanOwnerEmail,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      await db.bulkOrders.insert(bulkOrder);

      // Notify farmer
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        recipientEmail: cleanOwnerEmail,
        title: 'New Bulk Order Request',
        message: `${bulkOrder.buyerName} requested ${qty} ${unit} of ${productName}.`,
        time: 'Just now',
        read: false,
        type: 'bulk_order',
        bulkOrderId: bulkOrder.id,
        createdAt: new Date().toISOString(),
      };
      await db.notifications.insert(notif);
      emitToUser(cleanOwnerEmail, 'new_notification', notif);

      res.status(201).json({ message: 'Bulk order submitted.', data: bulkOrder });
    } catch (err) {
      console.error('Create bulk order error:', err);
      res.status(500).json({ error: 'Failed to submit bulk order.' });
    }
  });

  // ─── PATCH /api/bulk-orders/:id ──────────────────────────────────────────────
  router.patch('/:id', optionalAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;

      const order = db.bulkOrders.byId(id) || db.bulkOrders.one(b => String(b.id) === String(id));
      if (!order) return res.status(404).json({ error: 'Bulk order not found.' });

      const patch = {};
      if (status)   patch.status = status;
      if (comments !== undefined) patch.comments = comments;

      const updated = await db.bulkOrders.updateById(order.id, patch);

      // Notify buyer of status change
      if (status && order.buyerEmail) {
        const cleanBuyerEmail = order.buyerEmail.toLowerCase().trim();
        const notif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          recipientEmail: cleanBuyerEmail,
          title: 'Bulk Order Update',
          message: `Your bulk order for ${order.productName} was ${status}.`,
          time: 'Just now',
          read: false,
          type: 'bulk_order',
          createdAt: new Date().toISOString(),
        };
        await db.notifications.insert(notif);
        emitToUser(cleanBuyerEmail, 'new_notification', notif);
      }

      res.json({ message: 'Bulk order updated.', data: updated });
    } catch (err) {
      console.error('Update bulk order error:', err);
      res.status(500).json({ error: 'Failed to update bulk order.' });
    }
  });

  return router;
}
