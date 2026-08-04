import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;
