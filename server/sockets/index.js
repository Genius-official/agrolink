import { Server } from 'socket.io';
import { config } from '../config.js';

/** Singleton io instance — imported by routes that need real-time push */
export let io = null;

/**
 * Initialize Socket.io on the given HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
export function initializeSockets(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Allow both WebSocket and HTTP long-polling transports
    transports: ['websocket', 'polling'],
  });

  io.on('connection', socket => {
    if (config.isDev) {
      console.log(`  🔌 Socket connected: ${socket.id}`);
    }

    /**
     * Client emits 'join' with their email to subscribe to personal events.
     * Room name: "user:<email>"
     */
    socket.on('join', email => {
      if (typeof email === 'string' && email) {
        const cleanEmail = email.toLowerCase().trim();
        socket.join(`user:${cleanEmail}`);
        if (config.isDev) console.log(`  👤 ${cleanEmail} joined room user:${cleanEmail}`);
      }
    });

    socket.on('leave', email => {
      if (typeof email === 'string' && email) {
        const cleanEmail = email.toLowerCase().trim();
        socket.leave(`user:${cleanEmail}`);
      }
    });

    socket.on('disconnect', reason => {
      if (config.isDev) {
        console.log(`  🔌 Socket disconnected: ${socket.id} (${reason})`);
      }
    });

    socket.on('error', err => {
      console.error('Socket error:', err);
    });
  });

  return io;
}

/**
 * Emit an event to a specific user's personal room.
 * Safe to call even if io is not initialized yet.
 * @param {string} email  - Recipient's email
 * @param {string} event  - Socket event name
 * @param {any}    data   - Payload
 */
export function emitToUser(email, event, data) {
  if (io && email) {
    const cleanEmail = String(email).toLowerCase().trim();
    io.to(`user:${cleanEmail}`).emit(event, data);
  }
}

/**
 * Broadcast to all connected clients.
 * @param {string} event
 * @param {any}    data
 */
export function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}
