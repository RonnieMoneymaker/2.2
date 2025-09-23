const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { createPostgresPool } = require('../database/postgres-init');
const router = express.Router();

// Optional Supabase/Postgres runtime switch
const usePg = process.env.USE_SUPABASE_RUNTIME === '1' && !!process.env.DATABASE_URL;
let pgPool = null;
if (usePg) {
  try {
    pgPool = createPostgresPool();
    // Note: schema was created by quick-supabase-setup; interactions table may be missing → create lazily when needed
  } catch (e) {
    console.error('Postgres pool init failed, falling back to SQLite:', e.message);
    pgPool = null;
  }
}

// Get all customers with pagination and search
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search = '', status = '' } = req.query;
  const offset = (page - 1) * limit;
  
  if (pgPool) {
    try {
      const where = [];
      const values = [];
      if (search) {
        where.push('(first_name ILIKE $' + (values.length + 1) + ' OR last_name ILIKE $' + (values.length + 1) + ' OR email ILIKE $' + (values.length + 1) + ')');
        values.push(`%${search}%`);
      }
      if (status) {
        where.push('customer_status = $' + (values.length + 1));
        values.push(status);
      }
      const base = `SELECT id, email, first_name, last_name, phone, city, total_orders, total_spent, customer_status, date_created, last_order_date FROM customers`;
      const whereSql = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const listSql = base + whereSql + ' ORDER BY date_created DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
      const listValues = [...values, parseInt(limit), parseInt(offset)];
      const client = await pgPool.connect();
      try {
        const list = await client.query(listSql, listValues);
        const countRes = await client.query('SELECT COUNT(*) AS total FROM customers' + whereSql.replace(/ILIKE \$\d+/g, (m) => m) + (whereSql ? '' : ''), values);
        const total = parseInt(countRes.rows[0].total || '0');
        return res.json({
          customers: list.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } finally {
        client.release();
      }
    } catch (e) {
      return res.status(500).json({ error: 'Postgres fout bij ophalen klanten', details: e.message });
    }
  }
  
  let query = `
    SELECT id, email, first_name, last_name, phone, city, 
           total_orders, total_spent, customer_status, date_created,
           last_order_date
    FROM customers 
    WHERE 1=1
  `;
  
  const params = [];
  
  if (search) {
    query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (status) {
    query += ` AND customer_status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY date_created DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij ophalen klanten' });
    }
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND customer_status = ?`;
      countParams.push(status);
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij tellen klanten' });
      }
      
      res.json({
        customers,
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

// Get single customer with order history
router.get('/:id', async (req, res) => {
  const customerId = req.params.id;
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      const custRes = await client.query('SELECT * FROM customers WHERE id = $1', [customerId]);
      const customer = custRes.rows[0];
      if (!customer) {
        client.release();
        return res.status(404).json({ error: 'Klant niet gevonden' });
      }
      const ordersRes = await client.query(
        `SELECT o.*, COUNT(oi.id) AS item_count
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.customer_id = $1
         GROUP BY o.id
         ORDER BY o.order_date DESC`,
        [customerId]
      );
      let interactions = [];
      try {
        const intRes = await client.query('SELECT * FROM customer_interactions WHERE customer_id = $1 ORDER BY date_created DESC', [customerId]);
        interactions = intRes.rows;
      } catch (_) {
        interactions = [];
      }
      client.release();
      return res.json({
        ...customer,
        orders: ordersRes.rows,
        interactions
      });
    } catch (e) {
      client.release();
      return res.status(500).json({ error: 'Postgres fout', details: e.message });
    }
  }
  
  db.get(
    'SELECT * FROM customers WHERE id = ?',
    [customerId],
    (err, customer) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }
      
      if (!customer) {
        return res.status(404).json({ error: 'Klant niet gevonden' });
      }
      
      // Get customer orders
      db.all(
        `SELECT o.*, COUNT(oi.id) as item_count 
         FROM orders o 
         LEFT JOIN order_items oi ON o.id = oi.order_id 
         WHERE o.customer_id = ? 
         GROUP BY o.id 
         ORDER BY o.order_date DESC`,
        [customerId],
        (err, orders) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout bij ophalen bestellingen' });
          }
          
          // Get customer interactions
          db.all(
            'SELECT * FROM customer_interactions WHERE customer_id = ? ORDER BY date_created DESC',
            [customerId],
            (err, interactions) => {
              if (err) {
                return res.status(500).json({ error: 'Database fout bij ophalen interacties' });
              }
              
              res.json({
                ...customer,
                orders,
                interactions
              });
            }
          );
        }
      );
    }
  );
});

// Create new customer
router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Geldig e-mailadres vereist'),
  body('first_name').trim().isLength({ min: 1 }).withMessage('Voornaam is verplicht'),
  body('last_name').trim().isLength({ min: 1 }).withMessage('Achternaam is verplicht'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('nl-NL').withMessage('Geldig telefoonnummer vereist')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const {
    email, first_name, last_name, phone, address, 
    city, postal_code, country = 'Nederland', notes
  } = req.body;
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          `INSERT INTO customers (email, first_name, last_name, phone, address, city, postal_code, country, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [email, first_name, last_name, phone, address, city, postal_code, country, notes]
        );
        return res.status(201).json({
          message: 'Klant succesvol aangemaakt',
          customerId: result.rows[0].id
        });
      } finally {
        client.release();
      }
    } catch (e) {
      if (e.code === '23505') {
        return res.status(400).json({ error: 'E-mailadres is al in gebruik' });
      }
      return res.status(500).json({ error: 'Postgres fout bij aanmaken klant', details: e.message });
    }
  }

  db.run(
    `INSERT INTO customers (
      email, first_name, last_name, phone, address, 
      city, postal_code, country, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, first_name, last_name, phone, address, city, postal_code, country, notes],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'E-mailadres is al in gebruik' });
        }
        return res.status(500).json({ error: 'Database fout bij aanmaken klant' });
      }
      
      res.status(201).json({
        message: 'Klant succesvol aangemaakt',
        customerId: this.lastID
      });
    }
  );
});

// Update customer
router.put('/:id', [
  body('email').optional().isEmail().normalizeEmail().withMessage('Geldig e-mailadres vereist'),
  body('first_name').optional().trim().isLength({ min: 1 }).withMessage('Voornaam mag niet leeg zijn'),
  body('last_name').optional().trim().isLength({ min: 1 }).withMessage('Achternaam mag niet leeg zijn'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('nl-NL').withMessage('Geldig telefoonnummer vereist')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const customerId = req.params.id;
  const updates = req.body;
  const allowedFields = [
    'email', 'first_name', 'last_name', 'phone', 'address',
    'city', 'postal_code', 'country', 'customer_status', 'notes'
  ];
  
  const setClause = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClause.push(key);
      values.push(updates[key]);
    }
  });
  
  if (setClause.length === 0) {
    return res.status(400).json({ error: 'Geen geldige velden om bij te werken' });
  }
  
  if (pgPool) {
    try {
      const assignments = setClause.map((field, idx) => `${field} = $${idx + 1}`).join(', ');
      const params = [...values, customerId];
      const sql = `UPDATE customers SET ${assignments} WHERE id = $${params.length}`;
      const client = await pgPool.connect();
      try {
        const result = await client.query(sql, params);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Klant niet gevonden' });
        }
        return res.json({ message: 'Klant succesvol bijgewerkt' });
      } finally {
        client.release();
      }
    } catch (e) {
      if (e.code === '23505') {
        return res.status(400).json({ error: 'E-mailadres is al in gebruik' });
      }
      return res.status(500).json({ error: 'Postgres fout bij bijwerken klant', details: e.message });
    }
  }

  values.push(customerId);
  
  db.run(
    `UPDATE customers SET ${setClause.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'E-mailadres is al in gebruik' });
        }
        return res.status(500).json({ error: 'Database fout bij bijwerken klant' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Klant niet gevonden' });
      }
      
      res.json({ message: 'Klant succesvol bijgewerkt' });
    }
  );
});

// Delete customer
router.delete('/:id', async (req, res) => {
  const customerId = req.params.id;
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        const result = await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Klant niet gevonden' });
        }
        return res.json({ message: 'Klant succesvol verwijderd' });
      } finally {
        client.release();
      }
    } catch (e) {
      return res.status(500).json({ error: 'Postgres fout bij verwijderen klant', details: e.message });
    }
  }

  db.run('DELETE FROM customers WHERE id = ?', [customerId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database fout bij verwijderen klant' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }
    
    res.json({ message: 'Klant succesvol verwijderd' });
  });
});

// Add customer interaction
router.post('/:id/interactions', [
  body('interaction_type').isIn(['email', 'phone', 'chat', 'meeting', 'note']).withMessage('Ongeldig interactietype'),
  body('subject').trim().isLength({ min: 1 }).withMessage('Onderwerp is verplicht'),
  body('description').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const customerId = req.params.id;
  const { interaction_type, subject, description, created_by = 'Systeem' } = req.body;
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS customer_interactions (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            interaction_type VARCHAR(50) NOT NULL,
            subject VARCHAR(255),
            description TEXT,
            date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100)
          )
        `);
        const ins = await client.query(
          `INSERT INTO customer_interactions (customer_id, interaction_type, subject, description, created_by)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [customerId, interaction_type, subject, description, created_by]
        );
        return res.status(201).json({
          message: 'Interactie succesvol toegevoegd',
          interactionId: ins.rows[0].id
        });
      } finally {
        client.release();
      }
    } catch (e) {
      return res.status(500).json({ error: 'Postgres fout bij toevoegen interactie', details: e.message });
    }
  }

  db.run(
    `INSERT INTO customer_interactions (
      customer_id, interaction_type, subject, description, created_by
    ) VALUES (?, ?, ?, ?, ?)`,
    [customerId, interaction_type, subject, description, created_by],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij toevoegen interactie' });
      }
      
      res.status(201).json({
        message: 'Interactie succesvol toegevoegd',
        interactionId: this.lastID
      });
    }
  );
});

module.exports = router;
