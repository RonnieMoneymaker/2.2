import { Router } from 'express';
import realtimeService from '../services/realtime.js';

const router = Router();

// Get current live stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await realtimeService.getLiveStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

// Get quick stats (lightweight)
router.get('/stats/quick', (req, res) => {
  const stats = realtimeService.getQuickStats();
  res.json(stats);
});

// Get active visitors
router.get('/visitors', (req, res) => {
  const visitors = Array.from(realtimeService.activeVisitors.values()).map(v => ({
    sessionId: v.sessionId,
    currentPage: v.currentPage,
    pageViews: v.pageViews,
    cartValue: v.cartValue,
    duration: Math.floor((new Date() - v.startTime) / 1000),
    country: v.country,
    activities: v.activities.slice(-5) // Last 5 activities
  }));
  
  res.json({ visitors, count: visitors.length });
});

// Get admin count
router.get('/admins', (req, res) => {
  const count = realtimeService.getAdminCount();
  const admins = Array.from(realtimeService.onlineUsers.values())
    .filter(u => u.type === 'admin')
    .map(u => ({
      username: u.username,
      connectedAt: u.connectedAt
    }));
  
  res.json({ admins, count });
});

// Trigger order notification (for testing)
router.post('/trigger/order/:orderId', (req, res) => {
  const { orderId } = req.params;
  realtimeService.notifyNewOrder(parseInt(orderId));
  res.json({ success: true, message: 'Order notification triggered' });
});

// Trigger order status change
router.post('/trigger/order-status', (req, res) => {
  const { orderId, oldStatus, newStatus } = req.body;
  realtimeService.notifyOrderStatus(parseInt(orderId), oldStatus, newStatus);
  res.json({ success: true, message: 'Order status notification triggered' });
});

// Trigger low stock alert
router.post('/trigger/lowstock/:productId', (req, res) => {
  const { productId } = req.params;
  realtimeService.notifyLowStock(parseInt(productId));
  res.json({ success: true, message: 'Low stock notification triggered' });
});

export default router;
