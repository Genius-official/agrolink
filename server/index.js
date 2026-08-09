import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { initializeSockets } from './sockets/index.js';
import { runSeed } from './db/seed.js';
import { initMySQL } from './db/mysql.js';

// ── Route imports ──────────────────────────────────────────────────────────────
import authRoutes         from './routes/auth.js';
import userRoutes         from './routes/users.js';
import productRoutes      from './routes/products.js';
import subscriptionRoutes from './routes/subscriptions.js';
import orderRoutes        from './routes/orders.js';
import bulkOrderRoutes    from './routes/bulkOrders.js';
import messageRoutes      from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import cartRoutes         from './routes/cart.js';

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// CORS — allow configured frontend origins, vercel, and railway domains
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      config.corsOrigins.includes('*') ||
      config.corsOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.railway.app') ||
      config.isDev
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`  → ${req.method} ${req.path}`);
    next();
  });
}

// ─── Initialize Socket.io ─────────────────────────────────────────────────────

const io = initializeSockets(httpServer);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (_req, res) =>
  res.json({ name: 'AgroLink API Server', status: 'online', health: '/api/health', version: '1.0.0' })
);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
);

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/orders',        orderRoutes(io));
app.use('/api/bulk-orders',   bulkOrderRoutes(io));
app.use('/api/messages',      messageRoutes(io));
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart',          cartRoutes);

// Serve static frontend build if present (Unified Single Service Deployment)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 404 for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error handler:', err?.message || err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────

async function start() {
  await initMySQL();
  await runSeed();

  httpServer.listen(config.port, () => {
    console.log(`\n🌿 AgroLink API Server (Railway Connected)`);
    console.log(`   http://localhost:${config.port}/api/health`);
    console.log(`   Socket.io ready for real-time connections`);
    console.log(`   Environment: ${config.nodeEnv}\n`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
