const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware to ensure customer role
const ensureCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ error: 'Alleen toegankelijk voor klanten' });
  }
  next();
};

// Get customer profile
router.get('/profile', authenticateToken, ensureCustomer, async (req, res) => {
  try {
    const customer = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, first_name, last_name, email, phone, address, postal_code, city, country,
               customer_status, date_created, lifetime_value, total_orders, total_spent
        FROM customers WHERE id = ?
      `, [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    res.json({ customer });

  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Update customer profile
router.put('/profile', authenticateToken, ensureCustomer, [
  body('first_name').optional().notEmpty().withMessage('Voornaam mag niet leeg zijn'),
  body('last_name').optional().notEmpty().withMessage('Achternaam mag niet leeg zijn'),
  body('phone').optional(),
  body('address').optional(),
  body('postal_code').optional(),
  body('city').optional(),
  body('country').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, phone, address, postal_code, city, country } = req.body;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE customers 
        SET first_name = ?, last_name = ?, phone = ?, address = ?, 
            postal_code = ?, city = ?, country = ?
        WHERE id = ?
      `, [first_name, last_name, phone, address, postal_code, city, country, req.user.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: 'Profiel succesvol bijgewerkt' });

  } catch (error) {
    console.error('Update customer profile error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Get customer orders
router.get('/orders', authenticateToken, ensureCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, 
             GROUP_CONCAT(oi.product_name || ' (x' || oi.quantity || ')') as items,
             COUNT(oi.id) as item_count,
             SUM(oi.quantity) as total_items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const orders = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE customer_id = ?';
    const countParams = [req.user.id];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const totalCount = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    res.json({
      orders: orders.map(order => ({
        ...order,
        items: order.items ? order.items.split(',') : [],
        estimated_profit: order.total_amount * 0.35 - 5.95 // Customer can see estimated profit
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Get specific order details
router.get('/orders/:id', authenticateToken, ensureCustomer, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await new Promise((resolve, reject) => {
      db.get(`
        SELECT o.*, st.tracking_number, st.carrier, st.status as shipping_status,
               st.estimated_delivery
        FROM orders o
        LEFT JOIN shipping_tracking st ON o.id = st.order_id
        WHERE o.id = ? AND o.customer_id = ?
      `, [id, req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }

    // Get order items
    const items = await new Promise((resolve, reject) => {
      db.all(`
        SELECT oi.*, p.primary_image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      order: {
        ...order,
        items,
        estimated_profit: order.total_amount * 0.35 - 5.95
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Customer analytics (their own data)
router.get('/analytics', authenticateToken, ensureCustomer, async (req, res) => {
  try {
    const analytics = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total_amount) as total_spent,
          AVG(o.total_amount) as avg_order_value,
          MAX(o.created_at) as last_order_date,
          MIN(o.created_at) as first_order_date
        FROM orders o
        WHERE o.customer_id = ?
      `, [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get order history by month
    const monthlyOrders = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          strftime('%Y-%m', o.created_at) as month,
          COUNT(*) as order_count,
          SUM(o.total_amount) as monthly_spent
        FROM orders o
        WHERE o.customer_id = ?
        GROUP BY strftime('%Y-%m', o.created_at)
        ORDER BY month DESC
        LIMIT 12
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get favorite products
    const favoriteProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.name,
          SUM(oi.quantity) as total_quantity,
          COUNT(DISTINCT oi.order_id) as times_ordered,
          SUM(oi.price * oi.quantity) as total_spent_on_product
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = ?
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 5
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      analytics: {
        ...analytics,
        estimated_lifetime_profit: (analytics.total_spent || 0) * 0.35 - (analytics.total_orders || 0) * 5.95,
        customer_since_days: analytics.first_order_date ? 
          Math.floor((new Date() - new Date(analytics.first_order_date)) / (1000 * 60 * 60 * 24)) : 0
      },
      monthlyOrders,
      favoriteProducts
    });

  } catch (error) {
    console.error('Get customer analytics error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

module.exports = router;
