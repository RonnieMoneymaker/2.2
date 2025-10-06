import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// In-memory activity log (in production zou dit in database gaan)
let activityLog = [];
let logId = 1;

export const logActivity = (websiteId, action, entity, entityId, details, userId = 'system') => {
  const activity = {
    id: logId++,
    websiteId,
    action, // 'create', 'update', 'delete', 'view', 'export'
    entity, // 'product', 'customer', 'order', etc.
    entityId,
    details,
    userId,
    timestamp: new Date().toISOString(),
  };
  
  activityLog.unshift(activity);
  
  // Keep only last 1000 activities
  if (activityLog.length > 1000) {
    activityLog = activityLog.slice(0, 1000);
  }
  
  return activity;
};

export const getActivities = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { limit = 50, entity, action } = req.query;

    let filtered = activityLog.filter(a => a.websiteId === websiteId);

    if (entity) {
      filtered = filtered.filter(a => a.entity === entity);
    }

    if (action) {
      filtered = filtered.filter(a => a.action === action);
    }

    const activities = filtered.slice(0, Number(limit));

    res.json({
      activities,
      total: filtered.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getActivityStats = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const filtered = activityLog.filter(a => a.websiteId === websiteId);

    const stats = {
      total: filtered.length,
      today: filtered.filter(a => {
        const today = new Date().toDateString();
        return new Date(a.timestamp).toDateString() === today;
      }).length,
      byAction: {},
      byEntity: {},
      recent: filtered.slice(0, 10),
    };

    // Count by action
    filtered.forEach(a => {
      stats.byAction[a.action] = (stats.byAction[a.action] || 0) + 1;
      stats.byEntity[a.entity] = (stats.byEntity[a.entity] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const clearActivities = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    activityLog = activityLog.filter(a => a.websiteId !== websiteId);
    
    res.json({ message: 'Activity log cleared' });
  } catch (error) {
    next(error);
  }
};


