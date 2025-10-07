import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      websiteId: req.website.id,
      ...(unreadOnly === 'true' && { isRead: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip
      }),
      prisma.notification.count({ where })
    ]);

    const unreadCount = await prisma.notification.count({
      where: {
        websiteId: req.website.id,
        isRead: false
      }
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (e) {
    next(e);
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: parseInt(req.params.id)
      },
      data: {
        isRead: true
      }
    });

    res.json({ notification });
  } catch (e) {
    next(e);
  }
});

// Mark all as read
router.post('/mark-all-read', async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        websiteId: req.website.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ 
      success: true,
      updated: result.count,
      message: `${result.count} notificaties gemarkeerd als gelezen`
    });
  } catch (e) {
    next(e);
  }
});

// Delete notification
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.notification.delete({
      where: {
        id: parseInt(req.params.id)
      }
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Delete all read notifications
router.post('/clear-read', async (req, res, next) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        websiteId: req.website.id,
        isRead: true
      }
    });

    res.json({ 
      success: true,
      deleted: result.count,
      message: `${result.count} gelezen notificaties verwijderd`
    });
  } catch (e) {
    next(e);
  }
});

// Create notification (internal use)
router.post('/', async (req, res, next) => {
  try {
    const { type, title, message, link } = req.body;

    const notification = await prisma.notification.create({
      data: {
        websiteId: req.website.id,
        type,
        title,
        message,
        link
      }
    });

    res.json({ notification });
  } catch (e) {
    next(e);
  }
});

// Get notification stats
router.get('/stats', async (req, res, next) => {
  try {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { websiteId: req.website.id }
      }),
      prisma.notification.count({
        where: { websiteId: req.website.id, isRead: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { websiteId: req.website.id },
        _count: true
      })
    ]);

    res.json({
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {})
    });
  } catch (e) {
    next(e);
  }
});

export default router;
