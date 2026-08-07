import { Router } from 'express';
import { db } from '../db/store.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

router.get('/', optionalAuth, (req, res) => {
  const email = (req.user?.email || req.query.email || '').toLowerCase().trim();
  const subs = db.subscriptions.all(s => s.userEmail?.toLowerCase().trim() === email);
  const active = subs.find(s => s.status === 'active') || null;
  res.json({ data: { active, history: subs } });
});

// ─── POST /api/subscriptions/upgrade ─────────────────────────────────────────

router.post('/upgrade', optionalAuth, async (req, res) => {
  try {
    const { plan, amountGhs, paystackRef, email: bodyEmail } = req.body;
    if (!['free', 'starter', 'business'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const targetEmail = (req.user?.email || bodyEmail || '').toLowerCase().trim();
    if (!targetEmail) {
      return res.status(400).json({ error: 'User email is required for subscription upgrade.' });
    }

    let user = db.users.one(u => u.email?.toLowerCase().trim() === targetEmail);
    if (!user) {
      // Create user if not present on server yet
      user = {
        id: `user-${Date.now()}`,
        name: 'User',
        email: targetEmail,
        role: 'farmer',
        plan: 'free',
        joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString()
      };
      await db.users.insert(user);
    }

    // Mark previous active subscriptions for this user as expired
    await db.subscriptions.updateWhere(
      s => s.userEmail?.toLowerCase().trim() === targetEmail && s.status === 'active',
      { status: 'expired' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days validity

    const newSub = {
      id: Date.now(),
      userEmail: targetEmail,
      plan,
      amountGhs: parseFloat(amountGhs) || (plan === 'business' ? 299 : plan === 'starter' ? 99 : 0),
      paystackRef: paystackRef || `REF-${Date.now()}`,
      status: plan === 'free' ? 'expired' : 'active',
      paidAt: new Date().toISOString(),
      expiresAt: plan === 'free' ? null : expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (plan !== 'free') {
      await db.subscriptions.insert(newSub);
    }

    // Update user record plan status in DB & MySQL
    const updatedUser = await db.users.updateById(user.id, {
      plan,
      planExpiresAt: plan === 'free' ? null : expiresAt.toISOString(),
    });

    const { password, ...safeUser } = updatedUser || user;

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
