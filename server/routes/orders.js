import { Router } from 'express';
import { db } from '../db/store.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.js';
import { emitToUser } from '../sockets/index.js';

export default function orderRoutes(io) {
  const router = Router();

  // ─── GET /api/orders ─────────────────────────────────────────────────────────
  router.get('/', optionalAuth, (req, res) => {
    const activeEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();
    const role = req.user?.role || req.query.role || 'farmer';

    if (!activeEmail && role !== 'admin') {
      return res.json({ data: [], total: 0 });
    }

    let orders;
    if (role === 'admin') {
      orders = db.orders.all();
    } else if (role === 'buyer') {
      orders = db.orders.all(o => o && o.buyerEmail && o.buyerEmail.toLowerCase().trim() === activeEmail);
    } else {
      // Farmer: orders for their products or where they are owner
      const myProductIds = new Set(
        db.products.all(p => p && p.ownerEmail && p.ownerEmail.toLowerCase().trim() === activeEmail).map(p => String(p.id))
      );
      orders = db.orders.all(o =>
        o && (
          (o.ownerEmail && o.ownerEmail.toLowerCase().trim() === activeEmail) ||
          (o.productId && myProductIds.has(String(o.productId)))
        )
      );
    }

    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json({ data: orders, total: orders.length });
  });

  // ─── POST /api/orders ─────────────────────────────────────────────────────────
  router.post('/', optionalAuth, async (req, res) => {
    try {
      const { items, deliveryDetails = {} } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order items are required.' });
      }

      const activeEmail = (req.user?.email || req.body.buyerEmail || '').toLowerCase().trim();
      const user = req.user?.id ? db.users.byId(req.user.id) : (activeEmail ? db.users.one(u => u.email === activeEmail) : null);
      const buyerName = user?.name || req.user?.name || req.body.buyerName || 'Buyer';
      const now = new Date().toISOString().split('T')[0];

      const newOrders = items.map(item => ({
        id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
        productId: item.id,
        productName: item.name,
        farm: item.farm,
        img: item.img,
        buyerName: buyerName,
        buyerEmail: activeEmail,
        buyerAvatar: user?.avatar || null,
        ownerEmail: (item.ownerEmail || '').toLowerCase().trim(),
        qty: item.qty,
        unit: item.unit || 'kg',
        amount: parseFloat(item.price) * item.qty,
        status: 'pending',
        date: now,
        deliveryDate: deliveryDetails.deliveryDate || '',
        deliveryTime: deliveryDetails.deliveryTime || '',
        createdAt: new Date().toISOString(),
      }));

      await db.orders.insertMany(newOrders);

      // Notify each unique farmer
      const notificationsToInsert = newOrders.map(order => ({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        recipientEmail: order.ownerEmail,
        title: 'New Order Received',
        message: `Order for ${order.qty}x ${order.productName} from ${order.buyerName}.`,
        time: 'Just now',
        read: false,
        type: 'order',
        orderId: order.id,
        createdAt: new Date().toISOString(),
      }));

      await db.notifications.insertMany(notificationsToInsert);

      // Real-time push to farmers
      const uniqueFarmerEmails = [...new Set(newOrders.map(o => o.ownerEmail))];
      for (const farmerEmail of uniqueFarmerEmails) {
        if (!farmerEmail) continue;
        const farmerNotifs = notificationsToInsert.filter(n => n.recipientEmail === farmerEmail);
        for (const notif of farmerNotifs) {
          emitToUser(farmerEmail, 'new_notification', notif);
          emitToUser(farmerEmail, 'order_updated', { orderId: notif.orderId, status: 'pending' });
        }
      }

      res.status(201).json({ message: 'Order placed successfully.', data: newOrders });
    } catch (err) {
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Failed to place order.' });
    }
  });

  // ─── PATCH /api/orders/:id/status ────────────────────────────────────────────
  router.patch('/:id/status', optionalAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}.` });
      }

      const order = db.orders.byId(id) || db.orders.one(o => String(o.id) === String(id));
      if (!order) return res.status(404).json({ error: 'Order not found.' });

      const updated = await db.orders.updateById(order.id, { status });

      // Notify buyer
      if (order.buyerEmail) {
        const cleanBuyerEmail = order.buyerEmail.toLowerCase().trim();
        const buyerNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          recipientEmail: cleanBuyerEmail,
          title: 'Order Status Updated',
          message: `Your order for ${order.productName || 'a product'} is now ${status}.`,
          time: 'Just now',
          read: false,
          type: 'status',
          orderId: order.id,
          createdAt: new Date().toISOString(),
        };
        await db.notifications.insert(buyerNotif);
        emitToUser(cleanBuyerEmail, 'new_notification', buyerNotif);
        emitToUser(cleanBuyerEmail, 'order_updated', { orderId: order.id, status });
      }

      res.json({ message: 'Order status updated.', data: updated });
    } catch (err) {
      console.error('Update order status error:', err);
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  });

  // ─── GET /api/orders/stats — Admin summary ───────────────────────────────────

  router.get('/stats', requireAuth, requireRole('admin'), (req, res) => {
    const orders = db.orders.all();
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.amount || 0), 0),
    };
    res.json({ data: stats });
  });

  return router;
}
