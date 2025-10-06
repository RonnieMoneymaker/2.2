import { Router } from 'express';
import {
  getChatMessages,
  getChatSessions,
  sendMessage,
  markAsRead,
  getUnreadCount,
  syncFromCrisp
} from '../controllers/crispController.js';

const router = Router();

// Get all chat sessions
router.get('/sessions', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const sessions = await getChatSessions(websiteId);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
});

// Get messages for a session
router.get('/messages', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { sessionId, limit, unreadOnly } = req.query;
    
    const messages = await getChatMessages(websiteId, {
      sessionId,
      limit: limit ? parseInt(limit) : undefined,
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({ messages });
  } catch (e) {
    next(e);
  }
});

// Send message
router.post('/messages', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const message = await sendMessage(websiteId, req.body);
    res.status(201).json({ message });
  } catch (e) {
    next(e);
  }
});

// Mark session as read
router.post('/sessions/:sessionId/read', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { sessionId } = req.params;
    await markAsRead(websiteId, sessionId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Get unread count
router.get('/unread', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const count = await getUnreadCount(websiteId);
    res.json({ count });
  } catch (e) {
    next(e);
  }
});

// Sync from Crisp
router.post('/sync', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const result = await syncFromCrisp(websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
