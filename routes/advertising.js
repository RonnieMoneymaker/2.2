const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const googleAdsService = require('../services/googleAdsService');
const metaAdsService = require('../services/metaAdsService');
const router = express.Router();

// Get all ad campaigns
router.get('/campaigns', authenticateToken, (req, res) => {
  const { platform, status } = req.query;
  
  let query = `
    SELECT ac.*, u.first_name, u.last_name,
           ROUND((ac.clicks * 100.0 / NULLIF(ac.impressions, 0)), 2) as ctr,
           ROUND((ac.spent / NULLIF(ac.clicks, 0)), 2) as cpc,
           ROUND((ac.spent / NULLIF(ac.conversions, 0)), 2) as cpa
    FROM ad_campaigns ac
    LEFT JOIN users u ON ac.created_by = u.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (platform) {
    query += ` AND ac.platform = ?`;
    params.push(platform);
  }
  
  if (status) {
    query += ` AND ac.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY ac.created_at DESC`;
  
  db.all(query, params, (err, campaigns) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen campagnes' });
    }
    
    res.json({ campaigns });
  });
});

// Get single campaign with metrics
router.get('/campaigns/:id', authenticateToken, (req, res) => {
  const campaignId = req.params.id;
  
  db.get(
    `SELECT ac.*, u.first_name, u.last_name,
            ROUND((ac.clicks * 100.0 / NULLIF(ac.impressions, 0)), 2) as ctr,
            ROUND((ac.spent / NULLIF(ac.clicks, 0)), 2) as cpc,
            ROUND((ac.spent / NULLIF(ac.conversions, 0)), 2) as cpa
     FROM ad_campaigns ac
     LEFT JOIN users u ON ac.created_by = u.id
     WHERE ac.id = ?`,
    [campaignId],
    (err, campaign) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campagne niet gevonden' });
      }
      
      // Get daily metrics for last 30 days
      db.all(
        `SELECT * FROM ad_metrics 
         WHERE campaign_id = ? 
         ORDER BY date DESC 
         LIMIT 30`,
        [campaignId],
        (err, metrics) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout bij ophalen metrics' });
          }
          
          res.json({
            campaign,
            metrics
          });
        }
      );
    }
  );
});

// Create new campaign
router.post('/campaigns', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Campagne naam is verplicht'),
    body('platform').isIn(['google', 'meta']).withMessage('Platform moet google of meta zijn'),
    body('budget').isFloat({ min: 0 }).withMessage('Budget moet een positief getal zijn')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, platform, campaign_id, budget } = req.body;
    
    db.run(
      `INSERT INTO ad_campaigns (name, platform, campaign_id, budget, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, platform, campaign_id, budget, req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij aanmaken campagne' });
        }
        
        res.status(201).json({
          message: 'Campagne succesvol aangemaakt',
          campaignId: this.lastID
        });
      }
    );
  }
);

// Update campaign
router.put('/campaigns/:id', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Campagne naam mag niet leeg zijn'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget moet een positief getal zijn'),
    body('status').optional().isIn(['active', 'paused', 'ended']).withMessage('Ongeldige status')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const campaignId = req.params.id;
    const updates = req.body;
    const allowedFields = ['name', 'budget', 'status'];
    
    const setClause = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (setClause.length === 0) {
      return res.status(400).json({ error: 'Geen geldige velden om bij te werken' });
    }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(campaignId);
    
    db.run(
      `UPDATE ad_campaigns SET ${setClause.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij bijwerken campagne' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Campagne niet gevonden' });
        }
        
        res.json({ message: 'Campagne succesvol bijgewerkt' });
      }
    );
  }
);

// Add campaign metrics (for API integrations)
router.post('/campaigns/:id/metrics', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('date').isISO8601().withMessage('Geldige datum vereist'),
    body('impressions').isInt({ min: 0 }).withMessage('Impressions moet een positief getal zijn'),
    body('clicks').isInt({ min: 0 }).withMessage('Clicks moet een positief getal zijn'),
    body('spent').isFloat({ min: 0 }).withMessage('Spent moet een positief getal zijn')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const campaignId = req.params.id;
    const { date, impressions, clicks, spent, conversions = 0, revenue = 0 } = req.body;
    
    db.run(
      `INSERT OR REPLACE INTO ad_metrics (campaign_id, date, impressions, clicks, spent, conversions, revenue) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campaignId, date, impressions, clicks, spent, conversions, revenue],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij toevoegen metrics' });
        }
        
        // Update campaign totals
        db.run(`
          UPDATE ad_campaigns 
          SET impressions = (SELECT SUM(impressions) FROM ad_metrics WHERE campaign_id = ?),
              clicks = (SELECT SUM(clicks) FROM ad_metrics WHERE campaign_id = ?),
              spent = (SELECT SUM(spent) FROM ad_metrics WHERE campaign_id = ?),
              conversions = (SELECT SUM(conversions) FROM ad_metrics WHERE campaign_id = ?),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [campaignId, campaignId, campaignId, campaignId, campaignId]);
        
        res.status(201).json({
          message: 'Metrics succesvol toegevoegd',
          metricId: this.lastID
        });
      }
    );
  }
);

// Get advertising overview/dashboard
router.get('/overview', authenticateToken, (req, res) => {
  const { period = '30' } = req.query;
  
  const queries = {
    // Total campaigns
    totalCampaigns: `SELECT COUNT(*) as count FROM ad_campaigns`,
    
    // Active campaigns
    activeCampaigns: `SELECT COUNT(*) as count FROM ad_campaigns WHERE status = 'active'`,
    
    // Total spend this period
    totalSpend: `
      SELECT SUM(spent) as total 
      FROM ad_metrics 
      WHERE date >= date('now', '-${parseInt(period)} days')
    `,
    
    // Total conversions this period
    totalConversions: `
      SELECT SUM(conversions) as total 
      FROM ad_metrics 
      WHERE date >= date('now', '-${parseInt(period)} days')
    `,
    
    // Platform performance
    platformPerformance: `
      SELECT 
        ac.platform,
        COUNT(ac.id) as campaigns,
        SUM(ac.spent) as spent,
        SUM(ac.impressions) as impressions,
        SUM(ac.clicks) as clicks,
        SUM(ac.conversions) as conversions,
        ROUND((SUM(ac.clicks) * 100.0 / NULLIF(SUM(ac.impressions), 0)), 2) as ctr,
        ROUND((SUM(ac.spent) / NULLIF(SUM(ac.clicks), 0)), 2) as cpc
      FROM ad_campaigns ac
      GROUP BY ac.platform
    `,
    
    // Daily performance last 7 days
    dailyPerformance: `
      SELECT 
        date,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(spent) as spent,
        SUM(conversions) as conversions,
        SUM(revenue) as revenue
      FROM ad_metrics 
      WHERE date >= date('now', '-7 days')
      GROUP BY date
      ORDER BY date DESC
    `,
    
    // Top performing campaigns
    topCampaigns: `
      SELECT 
        ac.id,
        ac.name,
        ac.platform,
        ac.spent,
        ac.conversions,
        ROUND((ac.spent / NULLIF(ac.conversions, 0)), 2) as cpa,
        ROUND((ac.clicks * 100.0 / NULLIF(ac.impressions, 0)), 2) as ctr
      FROM ad_campaigns ac
      WHERE ac.conversions > 0
      ORDER BY ac.conversions DESC
      LIMIT 5
    `
  };
  
  const results = {};
  const queryKeys = Object.keys(queries);
  let completed = 0;
  
  queryKeys.forEach(key => {
    db.all(queries[key], (err, rows) => {
      if (err) {
        console.error(`Error in query ${key}:`, err);
        results[key] = key.includes('total') || key.includes('Count') ? { count: 0, total: 0 } : [];
      } else {
        results[key] = key.includes('total') || key.includes('Count') ? rows[0] : rows;
      }
      
      completed++;
      if (completed === queryKeys.length) {
        res.json(results);
      }
    });
  });
});

// Sync with Google Ads (placeholder for actual API integration)
router.post('/sync/google', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  (req, res) => {
    // This would integrate with Google Ads API
    // For now, return a placeholder response
    res.json({
      message: 'Google Ads sync functionaliteit komt binnenkort beschikbaar',
      status: 'placeholder',
      note: 'Hier zou de integratie met Google Ads API komen voor automatische data synchronisatie'
    });
  }
);

// Sync with Meta Ads (placeholder for actual API integration)
router.post('/sync/meta', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  (req, res) => {
    // This would integrate with Meta Marketing API
    // For now, return a placeholder response
    res.json({
      message: 'Meta Ads sync functionaliteit komt binnenkort beschikbaar',
      status: 'placeholder',
      note: 'Hier zou de integratie met Meta Marketing API komen voor Facebook/Instagram campagnes'
    });
  }
);

// Get campaign performance comparison
router.get('/compare', authenticateToken, (req, res) => {
  const { campaign_ids, period = '30' } = req.query;
  
  if (!campaign_ids) {
    return res.status(400).json({ error: 'Campaign IDs zijn verplicht' });
  }
  
  const ids = campaign_ids.split(',').map(id => parseInt(id));
  const placeholders = ids.map(() => '?').join(',');
  
  db.all(`
    SELECT 
      ac.id,
      ac.name,
      ac.platform,
      SUM(am.impressions) as impressions,
      SUM(am.clicks) as clicks,
      SUM(am.spent) as spent,
      SUM(am.conversions) as conversions,
      SUM(am.revenue) as revenue,
      ROUND((SUM(am.clicks) * 100.0 / NULLIF(SUM(am.impressions), 0)), 2) as ctr,
      ROUND((SUM(am.spent) / NULLIF(SUM(am.clicks), 0)), 2) as cpc,
      ROUND((SUM(am.spent) / NULLIF(SUM(am.conversions), 0)), 2) as cpa,
      ROUND((SUM(am.revenue) / NULLIF(SUM(am.spent), 0)), 2) as roas
    FROM ad_campaigns ac
    LEFT JOIN ad_metrics am ON ac.id = am.campaign_id 
      AND am.date >= date('now', '-${parseInt(period)} days')
    WHERE ac.id IN (${placeholders})
    GROUP BY ac.id, ac.name, ac.platform
    ORDER BY spent DESC
  `, ids, (err, comparison) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij vergelijken campagnes' });
    }
    
    res.json({
      period: `${period} dagen`,
      campaigns: comparison
    });
  });
});

module.exports = router;
