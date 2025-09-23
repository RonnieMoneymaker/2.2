const express = require('express');
const { db } = require('../database/init');
const router = express.Router();

// Dashboard overview statistics
router.get('/dashboard', (req, res) => {
  const queries = {
    // Total customers
    totalCustomers: `SELECT COUNT(*) as count FROM customers`,
    
    // New customers this month
    newCustomersThisMonth: `
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE date_created >= date('now', 'start of month')
    `,
    
    // Total orders
    totalOrders: `SELECT COUNT(*) as count FROM orders`,
    
    // Orders this month
    ordersThisMonth: `
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE order_date >= date('now', 'start of month')
    `,
    
    // Total revenue
    totalRevenue: `SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'`,
    
    // Revenue this month
    revenueThisMonth: `
      SELECT SUM(total_amount) as total 
      FROM orders 
      WHERE order_date >= date('now', 'start of month') AND status != 'cancelled'
    `,
    
    // Average order value
    avgOrderValue: `SELECT AVG(total_amount) as avg FROM orders WHERE status != 'cancelled'`,
    
    // Top customers by spend
    topCustomers: `
      SELECT c.id, c.first_name, c.last_name, c.email, c.total_spent, c.total_orders
      FROM customers c
      WHERE c.total_spent > 0
      ORDER BY c.total_spent DESC
      LIMIT 10
    `,
    
    // Recent orders
    recentOrders: `
      SELECT o.id, o.order_number, o.order_date, o.total_amount, o.status,
             c.first_name, c.last_name, c.email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.order_date DESC
      LIMIT 10
    `,
    
    // Order status distribution
    orderStatusDistribution: `
      SELECT status, COUNT(*) as count, SUM(total_amount) as revenue
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `
  };
  
  const results = {};
  const queryKeys = Object.keys(queries);
  let completed = 0;
  
  queryKeys.forEach(key => {
    db.all(queries[key], (err, rows) => {
      if (err) {
        console.error(`Error in query ${key}:`, err);
        results[key] = null;
      } else {
        results[key] = key.includes('total') || key.includes('avg') ? rows[0] : rows;
      }
      
      completed++;
      if (completed === queryKeys.length) {
        res.json(results);
      }
    });
  });
});

// Sales analytics over time
router.get('/sales-over-time', (req, res) => {
  const { period = '30', interval = 'day' } = req.query;
  
  let dateFormat, dateGroupBy;
  switch (interval) {
    case 'week':
      dateFormat = '%Y-W%W';
      dateGroupBy = "strftime('%Y-W%W', order_date)";
      break;
    case 'month':
      dateFormat = '%Y-%m';
      dateGroupBy = "strftime('%Y-%m', order_date)";
      break;
    default: // day
      dateFormat = '%Y-%m-%d';
      dateGroupBy = "strftime('%Y-%m-%d', order_date)";
  }
  
  db.all(`
    SELECT 
      ${dateGroupBy} as period,
      COUNT(*) as orders,
      SUM(total_amount) as revenue,
      AVG(total_amount) as avg_order_value
    FROM orders
    WHERE order_date >= datetime('now', '-${parseInt(period)} days')
      AND status != 'cancelled'
    GROUP BY ${dateGroupBy}
    ORDER BY period ASC
  `, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen verkoopcijfers' });
    }
    
    res.json({
      period: `${period} dagen`,
      interval,
      data: results
    });
  });
});

// Customer analytics
router.get('/customers', (req, res) => {
  const queries = {
    // Customer distribution by status
    customersByStatus: `
      SELECT customer_status, COUNT(*) as count
      FROM customers
      GROUP BY customer_status
      ORDER BY count DESC
    `,
    
    // Customer acquisition over time (last 12 months)
    customerAcquisition: `
      SELECT 
        strftime('%Y-%m', date_created) as month,
        COUNT(*) as new_customers
      FROM customers
      WHERE date_created >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', date_created)
      ORDER BY month ASC
    `,
    
    // Customer lifetime value segments
    customerLTVSegments: `
      SELECT 
        CASE 
          WHEN total_spent = 0 THEN 'Geen aankopen'
          WHEN total_spent < 100 THEN '€0 - €100'
          WHEN total_spent < 250 THEN '€100 - €250'
          WHEN total_spent < 500 THEN '€250 - €500'
          WHEN total_spent < 1000 THEN '€500 - €1000'
          ELSE '€1000+'
        END as segment,
        COUNT(*) as customers,
        AVG(total_spent) as avg_spent,
        SUM(total_spent) as total_revenue
      FROM customers
      GROUP BY segment
      ORDER BY 
        CASE segment
          WHEN 'Geen aankopen' THEN 0
          WHEN '€0 - €100' THEN 1
          WHEN '€100 - €250' THEN 2
          WHEN '€250 - €500' THEN 3
          WHEN '€500 - €1000' THEN 4
          ELSE 5
        END
    `,
    
    // Geographic distribution
    customersByCity: `
      SELECT city, COUNT(*) as customers, SUM(total_spent) as revenue
      FROM customers
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY customers DESC
      LIMIT 15
    `
  };
  
  const results = {};
  const queryKeys = Object.keys(queries);
  let completed = 0;
  
  queryKeys.forEach(key => {
    db.all(queries[key], (err, rows) => {
      if (err) {
        console.error(`Error in query ${key}:`, err);
        results[key] = [];
      } else {
        results[key] = rows;
      }
      
      completed++;
      if (completed === queryKeys.length) {
        res.json(results);
      }
    });
  });
});

// Product performance (based on order items)
router.get('/products', (req, res) => {
  const { period = '30' } = req.query;
  
  db.all(`
    SELECT 
      oi.product_name,
      oi.product_sku,
      COUNT(*) as times_ordered,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.total_price) as total_revenue,
      AVG(oi.unit_price) as avg_price
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_date >= datetime('now', '-${parseInt(period)} days')
      AND o.status != 'cancelled'
    GROUP BY oi.product_name, oi.product_sku
    ORDER BY total_revenue DESC
    LIMIT 20
  `, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen productprestaties' });
    }
    
    res.json({
      period: `${period} dagen`,
      products: results
    });
  });
});

// Customer retention metrics
router.get('/retention', (req, res) => {
  db.all(`
    SELECT 
      CASE 
        WHEN total_orders = 1 THEN 'Eenmalige klant'
        WHEN total_orders = 2 THEN '2 bestellingen'
        WHEN total_orders <= 5 THEN '3-5 bestellingen'
        WHEN total_orders <= 10 THEN '6-10 bestellingen'
        ELSE '10+ bestellingen'
      END as segment,
      COUNT(*) as customers,
      AVG(total_spent) as avg_spent,
      SUM(total_spent) as total_revenue
    FROM customers
    WHERE total_orders > 0
    GROUP BY segment
    ORDER BY 
      CASE segment
        WHEN 'Eenmalige klant' THEN 1
        WHEN '2 bestellingen' THEN 2
        WHEN '3-5 bestellingen' THEN 3
        WHEN '6-10 bestellingen' THEN 4
        ELSE 5
      END
  `, (err, retentionData) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen retentiegegevens' });
    }
    
    // Calculate repeat purchase rate
    db.get(`
      SELECT 
        COUNT(CASE WHEN total_orders > 1 THEN 1 END) as repeat_customers,
        COUNT(*) as total_customers,
        ROUND(
          (COUNT(CASE WHEN total_orders > 1 THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as repeat_rate
      FROM customers
      WHERE total_orders > 0
    `, (err, repeatRate) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij berekenen herhalingspercentage' });
      }
      
      res.json({
        retention_segments: retentionData,
        repeat_purchase_rate: repeatRate
      });
    });
  });
});

module.exports = router;
