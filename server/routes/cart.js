import { Router } from 'express';
import { db } from '../db/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Cart is stored as: { id: userEmail, userEmail, items: [...] }

function getCart(email) {
  return db.carts.one(c => c.userEmail === email) || { userEmail: email, items: [] };
}

// ─── GET /api/cart ────────────────────────────────────────────────────────────

router.get('/', requireAuth, (req, res) => {
  const cart = getCart(req.user.email);
  res.json({ data: cart.items });
});

// ─── POST /api/cart/add ───────────────────────────────────────────────────────

router.post('/add', requireAuth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required.' });

  const product = db.products.byId(productId);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const cart = getCart(req.user.email);
  const existing = cart.items.find(i => String(i.id) === String(productId));

  if (existing) {
    existing.qty += 1;
  } else {
    cart.items.push({ ...product, qty: 1 });
  }

  // Upsert cart
  const existingCart = db.carts.one(c => c.userEmail === req.user.email);
  if (existingCart) {
    await db.carts.updateById(existingCart.id || req.user.email, { items: cart.items });
  } else {
    await db.carts.insert({ id: req.user.email, userEmail: req.user.email, items: cart.items });
  }

  res.json({ message: 'Item added to cart.', data: cart.items });
});

// ─── PATCH /api/cart/:productId ───────────────────────────────────────────────

router.patch('/:productId', requireAuth, async (req, res) => {
  const { delta } = req.body; // +1 or -1
  const cart = getCart(req.user.email);
  const item = cart.items.find(i => String(i.id) === String(req.params.productId));

  if (!item) return res.status(404).json({ error: 'Item not in cart.' });

  item.qty = Math.max(1, item.qty + (parseInt(delta) || 0));

  const existingCart = db.carts.one(c => c.userEmail === req.user.email);
  if (existingCart) {
    await db.carts.updateById(existingCart.id || req.user.email, { items: cart.items });
  }

  res.json({ data: cart.items });
});

// ─── DELETE /api/cart/:productId ─────────────────────────────────────────────

router.delete('/:productId', requireAuth, async (req, res) => {
  const cart = getCart(req.user.email);
  cart.items = cart.items.filter(i => String(i.id) !== String(req.params.productId));

  const existingCart = db.carts.one(c => c.userEmail === req.user.email);
  if (existingCart) {
    await db.carts.updateById(existingCart.id || req.user.email, { items: cart.items });
  }

  res.json({ message: 'Item removed.', data: cart.items });
});

// ─── DELETE /api/cart ─────────────────────────────────────────────────────────

router.delete('/', requireAuth, async (req, res) => {
  const existingCart = db.carts.one(c => c.userEmail === req.user.email);
  if (existingCart) {
    await db.carts.updateById(existingCart.id || req.user.email, { items: [] });
  }
  res.json({ message: 'Cart cleared.', data: [] });
});

export default router;
