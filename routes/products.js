const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();

// Get all products
router.get('/', (req, res) => {
  const { category, is_active = 1, search = '' } = req.query;
  
  let query = `
    SELECT p.*,
           ROUND((p.selling_price - p.purchase_price), 2) as gross_margin,
           ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.selling_price, 0) * 100), 2) as margin_percentage
    FROM products p
    WHERE p.is_active = ?
  `;
  
  const params = [is_active];
  
  if (category) {
    query += ` AND p.category = ?`;
    params.push(category);
  }
  
  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  query += ` ORDER BY p.category, p.name`;
  
  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen producten' });
    }
    
    res.json({ products });
  });
});

// Get single product with sales data
router.get('/:id', (req, res) => {
  const productId = req.params.id;
  
  db.get(
    `SELECT p.*,
            ROUND((p.selling_price - p.purchase_price), 2) as gross_margin,
            ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.selling_price, 0) * 100), 2) as margin_percentage
     FROM products p WHERE p.id = ?`,
    [productId],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Product niet gevonden' });
      }
      
      // Get sales data for this product
      db.all(`
        SELECT 
          oi.*,
          o.order_date,
          o.order_number,
          c.first_name,
          c.last_name,
          c.email
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE oi.product_sku = ?
        ORDER BY o.order_date DESC
        LIMIT 50
      `, [product.sku], (err, sales) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij ophalen verkopen' });
        }
        
        // Calculate sales statistics
        db.get(`
          SELECT 
            COUNT(*) as total_orders,
            SUM(oi.quantity) as total_quantity_sold,
            SUM(oi.total_price) as total_revenue,
            AVG(oi.unit_price) as avg_selling_price,
            MAX(o.order_date) as last_sold_date
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE oi.product_sku = ?
        `, [product.sku], (err, stats) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout bij berekenen statistieken' });
          }
          
          res.json({
            product,
            sales_history: sales,
            sales_stats: stats || {
              total_orders: 0,
              total_quantity_sold: 0,
              total_revenue: 0,
              avg_selling_price: 0,
              last_sold_date: null
            }
          });
        });
      });
    }
  );
});

// Create new product
router.post('/', 
  // authenticateToken, 
  // authorizeRole(['admin', 'manager']), 
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Productnaam is verplicht'),
    body('sku').optional().trim().isLength({ min: 1 }).withMessage('SKU mag niet leeg zijn'),
    body('purchase_price').isFloat({ min: 0 }).withMessage('Inkoopprijs moet een positief getal zijn'),
    body('selling_price').isFloat({ min: 0 }).withMessage('Verkoopprijs moet een positief getal zijn'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Voorraad moet een positief getal zijn')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name, sku, description, category, purchase_price, selling_price,
      stock_quantity = 0, supplier, supplier_sku
    } = req.body;
    
    db.run(
      `INSERT INTO products (name, sku, description, category, purchase_price, selling_price, stock_quantity, supplier, supplier_sku) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, description, category, purchase_price, selling_price, stock_quantity, supplier, supplier_sku],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'SKU is al in gebruik' });
          }
          return res.status(500).json({ error: 'Database fout bij aanmaken product' });
        }
        
        res.status(201).json({
          message: 'Product succesvol aangemaakt',
          productId: this.lastID
        });
      }
    );
  }
);

// Update product
router.put('/:id', 
  // authenticateToken, 
  // authorizeRole(['admin', 'manager']), 
  [
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Productnaam mag niet leeg zijn'),
    body('purchase_price').optional().isFloat({ min: 0 }).withMessage('Inkoopprijs moet een positief getal zijn'),
    body('selling_price').optional().isFloat({ min: 0 }).withMessage('Verkoopprijs moet een positief getal zijn'),
    body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Voorraad moet een positief getal zijn')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const productId = req.params.id;
    const updates = req.body;
    const allowedFields = [
      'name', 'sku', 'description', 'category', 'purchase_price', 
      'selling_price', 'stock_quantity', 'supplier', 'supplier_sku', 'is_active'
    ];
    
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
    values.push(productId);
    
    db.run(
      `UPDATE products SET ${setClause.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'SKU is al in gebruik' });
          }
          return res.status(500).json({ error: 'Database fout bij bijwerken product' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product niet gevonden' });
        }
        
        res.json({ message: 'Product succesvol bijgewerkt' });
      }
    );
  }
);

// Delete product (soft delete)
router.delete('/:id', 
  // authenticateToken, 
  // authorizeRole(['admin', 'manager']), 
  (req, res) => {
    const productId = req.params.id;
    
    db.run(
      'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [productId], 
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij verwijderen product' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product niet gevonden' });
        }
        
        res.json({ message: 'Product succesvol verwijderd' });
      }
    );
  }
);

// Get product categories
router.get('/meta/categories', authenticateToken, (req, res) => {
  db.all(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM products 
    WHERE is_active = 1 AND category IS NOT NULL
    GROUP BY category
    ORDER BY category
  `, (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen categorieën' });
    }
    
    res.json({ categories });
  });
});

// Get product performance summary
router.get('/performance/summary', authenticateToken, (req, res) => {
  const { period = '30' } = req.query;
  
  db.all(`
    SELECT 
      p.id,
      p.name,
      p.sku,
      p.category,
      p.purchase_price,
      p.selling_price,
      ROUND((p.selling_price - p.purchase_price), 2) as unit_margin,
      ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.selling_price, 0) * 100), 2) as margin_percentage,
      COALESCE(sales.quantity_sold, 0) as quantity_sold,
      COALESCE(sales.revenue, 0) as revenue,
      COALESCE(sales.gross_profit, 0) as gross_profit,
      COALESCE(sales.orders_count, 0) as orders_count
    FROM products p
    LEFT JOIN (
      SELECT 
        oi.product_sku,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.total_price) as revenue,
        SUM(oi.quantity * p2.purchase_price) as cogs,
        SUM(oi.total_price - (oi.quantity * p2.purchase_price)) as gross_profit,
        COUNT(DISTINCT oi.order_id) as orders_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p2 ON oi.product_sku = p2.sku
      WHERE o.order_date >= date('now', '-${parseInt(period)} days')
        AND o.status != 'cancelled'
      GROUP BY oi.product_sku
    ) sales ON p.sku = sales.product_sku
    WHERE p.is_active = 1
    ORDER BY COALESCE(sales.revenue, 0) DESC, p.name
  `, (err, performance) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen productprestaties' });
    }
    
    // Calculate totals
    const totals = performance.reduce((acc, product) => {
      acc.total_revenue += parseFloat(product.revenue) || 0;
      acc.total_gross_profit += parseFloat(product.gross_profit) || 0;
      acc.total_quantity_sold += parseInt(product.quantity_sold) || 0;
      acc.products_sold += product.quantity_sold > 0 ? 1 : 0;
      return acc;
    }, {
      total_revenue: 0,
      total_gross_profit: 0,
      total_quantity_sold: 0,
      products_sold: 0,
      total_products: performance.length
    });
    
    res.json({
      period: `${period} dagen`,
      performance,
      totals
    });
  });
});

// Bulk update purchase prices
router.put('/bulk/purchase-prices', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('updates').isArray({ min: 1 }).withMessage('Updates array is verplicht'),
    body('updates.*.id').isInt({ min: 1 }).withMessage('Product ID is verplicht'),
    body('updates.*.purchase_price').isFloat({ min: 0 }).withMessage('Inkoopprijs moet een positief getal zijn')
  ], 
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { updates } = req.body;
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      let hasError = false;
      
      updates.forEach((update, index) => {
        if (hasError) return;
        
        db.run(
          'UPDATE products SET purchase_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [update.purchase_price, update.id],
          function(err) {
            if (err) {
              hasError = true;
              db.run('ROLLBACK');
              return res.status(500).json({ 
                error: `Database fout bij bijwerken product ${update.id}`,
                index 
              });
            }
            
            completed++;
            if (completed === updates.length) {
              db.run('COMMIT');
              res.json({ 
                message: `${updates.length} producten succesvol bijgewerkt`,
                updated_count: updates.length
              });
            }
          }
        );
      });
    });
  }
);

module.exports = router;
