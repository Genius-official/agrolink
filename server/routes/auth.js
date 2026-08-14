import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';

const router = Router();

/** Generate signed JWT from user object */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

/** Strip sensitive fields before sending user to client */
function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

// ─── POST /api/auth/register ───────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please provide a valid full name.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const safeRole = ['farmer', 'buyer'].includes(role) ? role : 'buyer';

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existing = db.users.one(u => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      role: safeRole,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`,
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      bio: '',
      createdAt: new Date().toISOString(),
    };

    await db.users.insert(newUser);

    // Send welcome email
    try {
      await sendWelcomeEmail(normalizedEmail, name.trim(), safeRole);
      console.log(`\n📧 [WELCOME EMAIL DISPATCHED] Sent to ${normalizedEmail}`);
    } catch (emailErr) {
      console.warn('⚠️ Welcome email dispatch error:', emailErr.message);
    }

    const token = signToken(newUser);
    return res.status(201).json({
      message: 'Account created successfully.',
      data: { token, user: sanitizeUser(newUser) },
    });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ error: err.message || 'Failed to create account.' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.users.one(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please sign up.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Login successful.',
      data: { token, user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, (req, res) => {
  const user = db.users.byId(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ data: sanitizeUser(user) });
});

// In-memory store for 6-digit password reset verification codes
const resetCodes = new Map();

// ─── POST /api/auth/request-reset-code ────────────────────────────────────────

router.post('/request-reset-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    resetCodes.set(normalizedEmail, { code, expiresAt });

    // Dispatch real email via email service
    await sendPasswordResetEmail(normalizedEmail, code);

    return res.json({
      message: `A 6-digit security verification code has been sent to ${normalizedEmail}.`,
    });
  } catch (err) {
    console.error('Request code error:', err);
    res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// ─── POST /api/auth/verify-reset-code ─────────────────────────────────────────

router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = resetCodes.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({ error: 'No verification code requested for this email. Please request a code first.' });
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(normalizedEmail);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (stored.code !== code.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    return res.json({
      message: 'Verification code confirmed successfully.',
      verified: true,
    });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const stored = resetCodes.get(normalizedEmail);

    if (!stored || stored.code !== code?.toString().trim()) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please verify code first.' });
    }

    let user = db.users.one(u => u.email?.toLowerCase().trim() === normalizedEmail);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    let updated;

    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: passwordHash,
        role: 'farmer',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedEmail)}&background=random`,
        joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      };
      await db.users.insert(user);
      updated = user;
    } else {
      updated = await db.users.updateById(user.id, { password: passwordHash });
    }

    // Clean up reset code after successful password update
    resetCodes.delete(normalizedEmail);

    return res.json({
      message: 'Password reset successfully. You can now log in with your new password.',
      data: sanitizeUser(updated || user),
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

export default router;
