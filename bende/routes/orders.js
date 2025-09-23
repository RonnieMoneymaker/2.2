const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const router = express.Router();

// Get all orders with pagination and filtering
router.get('/', (req, res) => {
  const { page = 1, limit = 20, status = '', customer_id = '' } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT o.*, c.first_name, c.last_name, c.email,
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += ` AND o.status = ?`;
    params.push(status);
  }
  
  if (customer_id) {
    query += ` AND o.customer_id = ?`;
    params.push(customer_id);
  }
  
  query += ` GROUP BY o.id ORDER BY o.order_date DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen bestellingen' });
    }
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    
    if (customer_id) {
      countQuery += ` AND customer_id = ?`;
      countParams.push(customer_id);
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij tellen bestellingen' });
      }
      
      res.json({
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Get single order with details
router.get('/:id', (req, res) => {
  const orderId = req.params.id;
  
  db.get(
    `SELECT o.*, c.first_name, c.last_name, c.email, c.phone
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     WHERE o.id = ?`,
    [orderId],
    (err, order) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }
      
      if (!order) {
        return res.status(404).json({ error: 'Bestelling niet gevonden' });
      }
      
      // Get order items
      db.all(
        'SELECT * FROM order_items WHERE order_id = ?',
        [orderId],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout bij ophalen orderitems' });
          }
          
          res.json({
            ...order,
            items
          });
        }
      );
    }
  );
});

// Create new order
router.post('/', [
  body('customer_id').isInt({ min: 1 }).withMessage('Geldige klant-ID vereist'),
  body('order_number').trim().isLength({ min: 1 }).withMessage('Bestelnummer is verplicht'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Geldig totaalbedrag vereist'),
  body('items').isArray({ min: 1 }).withMessage('Minimaal één orderitem vereist')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    customer_id, order_number, total_amount, currency = 'EUR',
    payment_method, shipping_address, notes, items
  } = req.body;
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Insert order
    db.run(
      `INSERT INTO orders (
        customer_id, order_number, total_amount, currency,
        payment_method, shipping_address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, order_number, total_amount, currency, payment_method, shipping_address, notes],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Bestelnummer is al in gebruik' });
          }
          return res.status(500).json({ error: 'Database fout bij aanmaken bestelling' });
        }
        
        const orderId = this.lastID;
        
        // Insert order items
        const itemStmt = db.prepare(`
          INSERT INTO order_items (order_id, product_name, product_sku, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        let itemErrors = [];
        items.forEach((item, index) => {
          itemStmt.run([
            orderId, item.product_name, item.product_sku || null,
            item.quantity, item.unit_price, item.quantity * item.unit_price
          ], (err) => {
            if (err) itemErrors.push(`Item ${index + 1}: ${err.message}`);
          });
        });
        
        itemStmt.finalize((err) => {
          if (err || itemErrors.length > 0) {
            db.run('ROLLBACK');
            return res.status(500).json({ 
              error: 'Database fout bij toevoegen orderitems',
              details: itemErrors
            });
          }
          
          // Update customer statistics
          db.run(`
            UPDATE customers 
            SET total_orders = total_orders + 1,
                total_spent = total_spent + ?,
                last_order_date = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [total_amount, customer_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Database fout bij bijwerken klantstatistieken' });
            }
            
            db.run('COMMIT');
            res.status(201).json({
              message: 'Bestelling succesvol aangemaakt',
              orderId: orderId
            });
          });
        });
      }
    );
  });
});

// Update order status
router.patch('/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Ongeldige status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const orderId = req.params.id;
  const { status, tracking_number } = req.body;
  
  let query = 'UPDATE orders SET status = ?';
  let params = [status];
  
  if (tracking_number) {
    query += ', tracking_number = ?';
    params.push(tracking_number);
  }
  
  query += ' WHERE id = ?';
  params.push(orderId);
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij bijwerken status' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }
    
    res.json({ message: 'Status succesvol bijgewerkt' });
  });
});

// Get order statistics
router.get('/stats/summary', (req, res) => {
  const { period = '30' } = req.query; // days
  
  db.all(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value,
      status,
      COUNT(*) as status_count
    FROM orders 
    WHERE order_date >= datetime('now', '-${parseInt(period)} days')
    GROUP BY status
  `, (err, statusStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen statistieken' });
    }
    
    db.get(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value
      FROM orders 
      WHERE order_date >= datetime('now', '-${parseInt(period)} days')
    `, (err, overallStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij ophalen algemene statistieken' });
      }
      
      res.json({
        period: `${period} dagen`,
        overall: overallStats,
        by_status: statusStats
      });
    });
  });
});

module.exports = router;
