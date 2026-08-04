import { Router } from 'express';
import { db } from '../db/store.js';
import { optionalAuth } from '../middleware/auth.js';
import { emitToUser } from '../sockets/index.js';

export default function messageRoutes(io) {
  const router = Router();

  // ─── GET /api/messages ────────────────────────────────────────────────────────
  router.get('/', optionalAuth, (req, res) => {
    const activeEmail = (req.user?.email || req.query.email || '').toLowerCase().trim();
    const { with: withEmail } = req.query;

    if (!activeEmail) {
      return res.json({ data: [], total: 0 });
    }

    let messages;
    if (withEmail) {
      const cleanWith = String(withEmail).toLowerCase().trim();
      messages = db.messages.all(m =>
        m && m.senderEmail && m.recipientEmail && (
          (m.senderEmail.toLowerCase().trim() === activeEmail && m.recipientEmail.toLowerCase().trim() === cleanWith) ||
          (m.senderEmail.toLowerCase().trim() === cleanWith && m.recipientEmail.toLowerCase().trim() === activeEmail)
        )
      );
    } else {
      messages = db.messages.all(m =>
        m && m.senderEmail && m.recipientEmail && (
          m.senderEmail.toLowerCase().trim() === activeEmail ||
          m.recipientEmail.toLowerCase().trim() === activeEmail
        )
      );
    }

    messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    res.json({ data: messages, total: messages.length });
  });

  // ─── POST /api/messages ───────────────────────────────────────────────────────
  router.post('/', optionalAuth, async (req, res) => {
    try {
      const { recipientEmail, text, senderEmail, senderName } = req.body || {};
      if (!recipientEmail || !text?.trim()) {
        return res.status(400).json({ error: 'recipientEmail and text are required.' });
      }

      const activeSenderEmail = (req.user?.email || senderEmail || '').toLowerCase().trim();
      if (!activeSenderEmail) {
        return res.status(400).json({ error: 'Sender email is required.' });
      }

      const cleanRecipientEmail = String(recipientEmail).toLowerCase().trim();
      const sender = (req.user?.id ? db.users.byId(req.user.id) : null) || db.users.one(u => u.email === activeSenderEmail);
      const timestamp = Date.now();

      const message = {
        id: `msg-${timestamp}-${Math.random().toString(36).slice(2)}`,
        senderEmail: activeSenderEmail,
        senderName: senderName || sender?.name || req.user?.name || activeSenderEmail.split('@')[0],
        senderAvatar: sender?.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || activeSenderEmail)}&background=random`,
        recipientEmail: cleanRecipientEmail,
        text: text.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp,
        createdAt: new Date().toISOString(),
      };

      await db.messages.insert(message);

      // In-app notification for recipient
      const notif = {
        id: `notif-${timestamp}-${Math.random().toString(36).slice(2)}`,
        recipientEmail: cleanRecipientEmail,
        title: 'New Message',
        message: `${message.senderName} sent you a message: "${text.length > 40 ? text.slice(0, 40) + '...' : text}"`,
        time: 'Just now',
        read: false,
        type: 'message',
        chatTarget: { name: message.senderName, email: activeSenderEmail },
        createdAt: new Date().toISOString(),
      };
      await db.notifications.insert(notif);

      // Real-time delivery to recipient and sender
      emitToUser(cleanRecipientEmail, 'new_message', message);
      emitToUser(activeSenderEmail, 'new_message', message);
      emitToUser(cleanRecipientEmail, 'new_notification', notif);

      res.status(201).json({ message: 'Message sent.', data: message });
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ error: 'Failed to send message.' });
    }
  });

  // ─── GET /api/messages/conversations ─────────────────────────────────────────
  router.get('/conversations', optionalAuth, (req, res) => {
    const email = (req.user?.email || req.query.email || '').toLowerCase().trim();

    if (!email) {
      return res.json({ data: [] });
    }

    const allMessages = db.messages.all(m =>
      m && m.senderEmail && m.recipientEmail && (
        m.senderEmail.toLowerCase().trim() === email ||
        m.recipientEmail.toLowerCase().trim() === email
      )
    );

    const convMap = {};
    for (const msg of allMessages) {
      const s = msg.senderEmail.toLowerCase().trim();
      const r = msg.recipientEmail.toLowerCase().trim();
      const partner = s === email ? r : s;
      if (!convMap[partner] || msg.timestamp > convMap[partner].timestamp) {
        convMap[partner] = msg;
      }
    }

    const conversations = Object.entries(convMap).map(([partnerEmail, lastMsg]) => {
      const partner = db.users.one(u => u.email === partnerEmail);
      return {
        partnerEmail,
        partnerName: partner?.name || lastMsg.senderName || partnerEmail,
        partnerAvatar: partner?.avatar || null,
        lastMessage: lastMsg.text,
        lastTimestamp: lastMsg.timestamp,
      };
    });

    conversations.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
    res.json({ data: conversations });
  });

  return router;
}
