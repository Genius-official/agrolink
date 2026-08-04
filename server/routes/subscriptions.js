import { Router } from 'express';
import { db } from '../db/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

router.get('/', requireAuth, (req, res) => {
  const subs = db.subscriptions.all(s => s.userEmail === req.user.email);
  const active = subs.find(s => s.status === 'active') || null;
  res.json({ data: { active, history: subs } });
});

// ─── POST /api/subscriptions/upgrade ─────────────────────────────────────────

router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const { plan, amountGhs, paystackRef } = req.body;
    if (!['starter', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const user = db.users.one(u => u.email === req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Mark previous active subscriptions for this user as expired
    await db.subscriptions.updateWhere(
      s => s.userEmail === req.user.email && s.status === 'active',
      { status: 'expired' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const newSub = {
      id: Date.now(),
      userEmail: req.user.email,
      plan,
      amountGhs: parseFloat(amountGhs) || (plan === 'business' ? 199 : 49),
      paystackRef: paystackRef || `REF-${Date.now()}`,
      status: 'active',
      paidAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.subscriptions.insert(newSub);

    // Update user record plan status
    const updatedUser = await db.users.updateById(user.id, {
      plan,
      planExpiresAt: expiresAt.toISOString(),
    });

    const { password, ...safeUser } = updatedUser;

    res.status(200).json({
      message: `Successfully subscribed to ${plan.toUpperCase()} plan!`,
      data: { subscription: newSub, user: safeUser },
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to process subscription upgrade.' });
  }
});

export default router;
