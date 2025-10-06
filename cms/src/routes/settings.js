import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    const settings = await prisma.setting.findMany({
      where: { websiteId }
    });
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      if (s.type === 'boolean') {
        settingsObj[s.key] = s.value === 'true';
      } else if (s.type === 'number') {
        settingsObj[s.key] = parseFloat(s.value);
      } else if (s.type === 'json') {
        try {
          settingsObj[s.key] = JSON.parse(s.value);
        } catch {
          settingsObj[s.key] = s.value;
        }
      } else {
        settingsObj[s.key] = s.value;
      }
    });
    
    res.json({ settings: settingsObj });
  } catch (e) {
    next(e);
  }
});

// Get single setting
router.get('/:key', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { key } = req.params;
    
    const setting = await prisma.setting.findFirst({
      where: { websiteId, key }
    });
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    let value = setting.value;
    if (setting.type === 'boolean') value = value === 'true';
    else if (setting.type === 'number') value = parseFloat(value);
    else if (setting.type === 'json') value = JSON.parse(value);
    
    res.json({ key: setting.key, value, type: setting.type });
  } catch (e) {
    next(e);
  }
});

// Update or create setting
router.put('/:key', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { key } = req.params;
    const { value, type = 'string' } = req.body;
    
    // Convert value to string for storage
    let stringValue = value;
    if (typeof value === 'boolean') {
      stringValue = value.toString();
    } else if (typeof value === 'number') {
      stringValue = value.toString();
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    }
    
    const setting = await prisma.setting.upsert({
      where: {
        websiteId_key: {
          websiteId,
          key
        }
      },
      update: {
        value: stringValue,
        type,
        updatedAt: new Date()
      },
      create: {
        websiteId,
        key,
        value: stringValue,
        type
      }
    });
    
    res.json({ setting });
  } catch (e) {
    next(e);
  }
});

// Bulk update settings
router.post('/bulk', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { settings } = req.body; // Object with key-value pairs
    
    const updates = [];
    
    for (const [key, value] of Object.entries(settings)) {
      let type = 'string';
      let stringValue = value;
      
      if (typeof value === 'boolean') {
        type = 'boolean';
        stringValue = value.toString();
      } else if (typeof value === 'number') {
        type = 'number';
        stringValue = value.toString();
      } else if (typeof value === 'object') {
        type = 'json';
        stringValue = JSON.stringify(value);
      }
      
      updates.push(
        prisma.setting.upsert({
          where: {
            websiteId_key: {
              websiteId,
              key
            }
          },
          update: {
            value: stringValue,
            type,
            updatedAt: new Date()
          },
          create: {
            websiteId,
            key,
            value: stringValue,
            type
          }
        })
      );
    }
    
    await Promise.all(updates);
    
    res.json({ success: true, count: updates.length });
  } catch (e) {
    next(e);
  }
});

// Delete setting
router.delete('/:key', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { key } = req.params;
    
    await prisma.setting.delete({
      where: {
        websiteId_key: {
          websiteId,
          key
        }
      }
    });
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
