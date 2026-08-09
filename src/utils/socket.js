/**
 * AgroLink Socket.io Client
 * Manages a singleton socket connection for real-time events.
 * Uses runtime module resolution so Vite dev server can compile cleanly even before `npm install` finishes.
 */

let socket = null;

/**
 * Connect socket and join the user's personal notification room.
 * Safe to call; degrades gracefully if socket.io-client package is not installed yet.
 *
 * @param {string} email - Current user's email (used as room key)
 * @param {object} handlers
 * @param {Function} handlers.onMessage      - Called with new message object
 * @param {Function} handlers.onNotification - Called with new notification object
 * @param {Function} handlers.onOrderUpdate  - Called with { orderId, status }
 */
export async function connectSocket(email, { onMessage, onNotification, onOrderUpdate, onProductCreated, onProductUpdated, onProductDeleted } = {}) {
  const cleanEmail = email?.toLowerCase()?.trim();

  let socketIO;
  try {
    const pkgName = 'socket.io-client';
    const module = await import(/* @vite-ignore */ pkgName);
    socketIO = module.io || module.default || module;
  } catch {
    console.warn('[Socket] socket.io-client not installed yet. Run `npm install socket.io-client` in project root for real-time features.');
    return null;
  }

  if (!socketIO || typeof socketIO !== 'function') return null;

  if (!socket) {
    try {
      const RAILWAY_SOCKET_URL = 'https://agrolink-production-182c.up.railway.app';
      const SOCKET_URL = import.meta.env.DEV
        ? undefined
        : (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('vercel.app')
            ? import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api$/, '')
            : RAILWAY_SOCKET_URL);
      socket = socketIO(SOCKET_URL, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
        if (cleanEmail) socket.emit('join', cleanEmail);
      });

      socket.on('connect_error', err => {
        console.warn('[Socket] Connection error:', err.message);
      });

      socket.on('disconnect', reason => {
        console.log('[Socket] Disconnected:', reason);
      });
    } catch (err) {
      console.warn('[Socket] Failed to initialize socket:', err);
      return null;
    }
  } else if (socket.connected && cleanEmail) {
    socket.emit('join', cleanEmail);
  }

  // Always re-bind/update event listeners
  if (socket) {
    socket.off('new_message');
    socket.off('new_notification');
    socket.off('order_updated');
    socket.off('product_created');
    socket.off('product_updated');
    socket.off('product_deleted');

    if (onMessage) socket.on('new_message', onMessage);
    if (onNotification) socket.on('new_notification', onNotification);
    if (onOrderUpdate) socket.on('order_updated', onOrderUpdate);
    if (onProductCreated) socket.on('product_created', onProductCreated);
    if (onProductUpdated) socket.on('product_updated', onProductUpdated);
    if (onProductDeleted) socket.on('product_deleted', onProductDeleted);
  }

  return socket;
}

/** Disconnect and clean up the socket instance. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Disconnected (manual).');
  }
}

/** Get the current socket instance (or null if not connected). */
export function getSocket() {
  return socket;
}
