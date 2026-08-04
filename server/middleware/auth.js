import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Verify JWT from Authorization: Bearer <token> header.
 * Attaches decoded payload to req.user on success.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token.';
    return res.status(401).json({ error: msg });
  }
};

/**
 * Optionally parse JWT — does NOT reject if missing.
 * Useful for routes that behave differently when authenticated.
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.slice(7), config.jwtSecret);
    } catch {
      // Token invalid but not required — continue without user
    }
  }
  next();
};

/**
 * Role-based access control guard. Use after requireAuth.
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'farmer')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};
