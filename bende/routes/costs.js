const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// Get all fixed costs
router.get('/fixed-costs', (req, res) => {
  const { category, is_active = 1 } = req.query;
  
  let query = `
    SELECT fc.*, u.first_name, u.last_name
    FROM fixed_costs fc
    LEFT JOIN users u ON fc.created_by = u.id
    WHERE fc.is_active = ?
  `;
  
  const params = [is_active];
  
  if (category) {
    query += ` AND fc.category = ?`;
    params.push(category);
  }
  
  query += ` ORDER BY fc.category, fc.name`;
  
  db.all(query, params, (err, costs) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen vaste kosten' });
    }
    
    res.json({ fixed_costs: costs });
  });
});

// Backward-compatibility alias used by tests
router.get('/fixed', (req, res) => {
  const { category, is_active = 1 } = req.query;
  let query = `
    SELECT fc.*, u.first_name, u.last_name
    FROM fixed_costs fc
    LEFT JOIN users u ON fc.created_by = u.id
    WHERE fc.is_active = ?
  `;
  const params = [is_active];
  if (category) {
    query += ` AND fc.category = ?`;
    params.push(category);
  }
  query += ` ORDER BY fc.category, fc.name`;
  db.all(query, params, (err, costs) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen vaste kosten' });
    }
    res.json({ fixed_costs: costs });
  });
});

// Get fixed costs summary by category
router.get('/fixed-costs/summary', (req, res) => {
  db.all(`
    SELECT 
      category,
      COUNT(*) as cost_items,
      SUM(CASE WHEN billing_cycle = 'monthly' THEN amount ELSE amount/12 END) as monthly_total,
      SUM(CASE WHEN billing_cycle = 'yearly' THEN amount ELSE amount*12 END) as yearly_total
    FROM fixed_costs 
    WHERE is_active = 1
    GROUP BY category
    ORDER BY monthly_total DESC
  `, (err, summary) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen kostenoverzicht' });
    }
    
    // Calculate overall totals
    db.get(`
      SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN billing_cycle = 'monthly' THEN amount ELSE amount/12 END) as total_monthly,
        SUM(CASE WHEN billing_cycle = 'yearly' THEN amount ELSE amount*12 END) as total_yearly
      FROM fixed_costs 
      WHERE is_active = 1
    `, (err, totals) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij berekenen totalen' });
      }
      
      res.json({
        summary,
        totals: totals || { total_items: 0, total_monthly: 0, total_yearly: 0 }
      });
    });
  });
});

// Create new fixed cost
router.post('/fixed-costs', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Naam is verplicht'),
    body('category').trim().isLength({ min: 1 }).withMessage('Categorie is verplicht'),
    body('amount').isFloat({ min: 0 }).withMessage('Bedrag moet een positief getal zijn'),
    body('billing_cycle').isIn(['monthly', 'quarterly', 'yearly']).withMessage('Ongeldige factureringscyclus'),
    body('start_date').isISO8601().withMessage('Geldige startdatum vereist')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, category, amount, billing_cycle, start_date, end_date } = req.body;
    
    db.run(
      `INSERT INTO fixed_costs (name, description, category, amount, billing_cycle, start_date, end_date, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, category, amount, billing_cycle, start_date, end_date, req.user.userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij aanmaken vaste kost' });
        }
        
        res.status(201).json({
          message: 'Vaste kost succesvol aangemaakt',
          costId: this.lastID
        });
      }
    );
  }
);

// Update fixed cost
router.put('/fixed-costs/:id', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Naam mag niet leeg zijn'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Bedrag moet een positief getal zijn'),
    body('billing_cycle').optional().isIn(['monthly', 'quarterly', 'yearly']).withMessage('Ongeldige factureringscyclus')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const costId = req.params.id;
    const updates = req.body;
    const allowedFields = ['name', 'description', 'category', 'amount', 'billing_cycle', 'start_date', 'end_date', 'is_active'];
    
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
    values.push(costId);
    
    db.run(
      `UPDATE fixed_costs SET ${setClause.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij bijwerken vaste kost' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Vaste kost niet gevonden' });
        }
        
        res.json({ message: 'Vaste kost succesvol bijgewerkt' });
      }
    );
  }
);

// Delete fixed cost
router.delete('/fixed-costs/:id', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  (req, res) => {
    const costId = req.params.id;
    
    // Soft delete - set is_active to false
    db.run(
      'UPDATE fixed_costs SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [costId], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij verwijderen vaste kost' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Vaste kost niet gevonden' });
        }
        
        res.json({ message: 'Vaste kost succesvol verwijderd' });
      }
    );
  }
);

// Get cost categories
router.get('/categories', authenticateToken, (req, res) => {
  db.all(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM fixed_costs 
    WHERE is_active = 1
    GROUP BY category
    ORDER BY category
  `, (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen categorieën' });
    }
    
    // Add predefined categories that might not exist yet
    const predefinedCategories = [
      'Huisvesting', 'Personeel', 'IT & Communicatie', 'Utilities', 
      'Verzekeringen', 'Professionele Diensten', 'Marketing', 'Financieel'
    ];
    
    const existingCategories = categories.map(c => c.category);
    const allCategories = [
      ...categories,
      ...predefinedCategories
        .filter(cat => !existingCategories.includes(cat))
        .map(cat => ({ category: cat, count: 0 }))
    ];
    
    res.json({ categories: allCategories });
  });
});

// Calculate costs for specific period
router.get('/period-costs', authenticateToken, (req, res) => {
  const { start_date, end_date = new Date().toISOString().split('T')[0] } = req.query;
  
  if (!start_date) {
    return res.status(400).json({ error: 'Start datum is verplicht' });
  }
  
  // Calculate days in period
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const daysInPeriod = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  db.all(`
    SELECT 
      fc.*,
      CASE 
        WHEN fc.billing_cycle = 'monthly' THEN (fc.amount * ${daysInPeriod} / 30.44)
        WHEN fc.billing_cycle = 'quarterly' THEN (fc.amount * ${daysInPeriod} / 91.31)
        WHEN fc.billing_cycle = 'yearly' THEN (fc.amount * ${daysInPeriod} / 365.25)
        ELSE fc.amount
      END as allocated_amount
    FROM fixed_costs fc
    WHERE fc.is_active = 1 
      AND fc.start_date <= ?
      AND (fc.end_date IS NULL OR fc.end_date >= ?)
    ORDER BY fc.category, fc.name
  `, [end_date, start_date], (err, costs) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij berekenen periodekosten' });
    }
    
    // Group by category
    const costsByCategory = costs.reduce((acc, cost) => {
      if (!acc[cost.category]) {
        acc[cost.category] = {
          category: cost.category,
          costs: [],
          total: 0
        };
      }
      acc[cost.category].costs.push(cost);
      acc[cost.category].total += parseFloat(cost.allocated_amount);
      return acc;
    }, {});
    
    const totalAllocated = costs.reduce((sum, cost) => sum + parseFloat(cost.allocated_amount), 0);
    
    res.json({
      period: { start_date, end_date, days: daysInPeriod },
      costs_by_category: Object.values(costsByCategory),
      total_allocated: totalAllocated,
      daily_average: totalAllocated / daysInPeriod
    });
  });
});

module.exports = router;
