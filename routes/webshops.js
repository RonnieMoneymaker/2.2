const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

/**
 * Webshop Management Routes
 * Manage multiple webshops in multi-tenant setup
 */

// Get all webshops
router.get('/', (req, res) => {
  db.all(`
    SELECT 
      w.*,
      COUNT(DISTINCT c.id) as customers_count,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
      COUNT(DISTINCT o.id) as orders_count
    FROM webshops w
    LEFT JOIN customers c ON w.id = c.webshop_id
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE w.is_active = 1
    GROUP BY w.id
    ORDER BY w.created_at DESC
  `, (err, webshops) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen webshops' });
    }
    
    res.json({ 
      webshops: webshops || [],
      count: webshops.length
    });
  });
});

// Get single webshop
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT 
      w.*,
      COUNT(DISTINCT c.id) as customers_count,
      COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
      COUNT(DISTINCT o.id) as orders_count
    FROM webshops w
    LEFT JOIN customers c ON w.id = c.webshop_id
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE w.id = ?
    GROUP BY w.id
  `, [id], (err, webshop) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen webshop' });
    }
    
    if (!webshop) {
      return res.status(404).json({ error: 'Webshop niet gevonden' });
    }
    
    res.json({ webshop });
  });
});

// Create new webshop
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Naam is verplicht'),
  body('domain').trim().isLength({ min: 1 }).withMessage('Domein is verplicht'),
  body('subscription_plan').isIn(['starter', 'professional', 'enterprise']).withMessage('Ongeldig subscription plan')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, domain, description, subscription_plan, settings } = req.body;
  
  db.run(`
    INSERT INTO webshops (name, domain, description, owner_id, subscription_plan, settings)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    name, 
    domain, 
    description || '', 
    req.user.userId, 
    subscription_plan,
    settings || JSON.stringify({ currency: 'EUR', language: 'nl', timezone: 'Europe/Amsterdam' })
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij aanmaken webshop' });
    }
    
    res.status(201).json({
      message: 'Webshop succesvol aangemaakt',
      webshopId: this.lastID,
      webshop: {
        id: this.lastID,
        name,
        domain,
        description,
        subscription_plan
      }
    });
  });
});

// Update webshop
router.put('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { name, domain, description, subscription_plan, is_active, settings } = req.body;
  
  db.run(`
    UPDATE webshops 
    SET name = ?, domain = ?, description = ?, subscription_plan = ?, is_active = ?, settings = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [name, domain, description, subscription_plan, is_active, settings, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij bijwerken webshop' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Webshop niet gevonden' });
    }
    
    res.json({ message: 'Webshop succesvol bijgewerkt' });
  });
});

// Delete webshop
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  
  // Soft delete - set is_active to 0
  db.run(`
    UPDATE webshops 
    SET is_active = 0, updated_at = datetime('now')
    WHERE id = ?
  `, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij verwijderen webshop' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Webshop niet gevonden' });
    }
    
    res.json({ message: 'Webshop succesvol verwijderd' });
  });
});

module.exports = router;

