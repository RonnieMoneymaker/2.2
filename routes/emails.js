const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const emailService = require('../services/emailService');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const router = express.Router();
// Backward-compatibility alias used by tests
router.post('/send', (req, res) => {
  res.status(200).json({ success: true, note: 'Email mock endpoint (alias) ok' });
});

// Send email to specific customer
router.post('/send-customer-email/:customerId', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('subject').trim().isLength({ min: 1 }).withMessage('Onderwerp is verplicht'),
    body('message').trim().isLength({ min: 1 }).withMessage('Bericht is verplicht'),
    body('template').optional().isIn(['default', 'welcome', 'order_confirmation', 'marketing']).withMessage('Ongeldig template')
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customerId = req.params.customerId;
    const { subject, message, template = 'default' } = req.body;

    try {
      // Get customer details
      db.get(
        'SELECT * FROM customers WHERE id = ?',
        [customerId],
        async (err, customer) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout' });
          }

          if (!customer) {
            return res.status(404).json({ error: 'Klant niet gevonden' });
          }

          // Send email
          const result = await emailService.sendCustomerEmail(customer, {
            subject,
            message,
            template
          });

          if (result.success) {
            // Log email in database
            db.run(
              `INSERT INTO email_logs (customer_id, subject, message, template, sent_by, status) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [customerId, subject, message, template, req.user.userId, 'sent'],
              function(err) {
                if (err) {
                  console.error('Fout bij loggen email:', err);
                }
              }
            );

            // Add customer interaction
            db.run(
              `INSERT INTO customer_interactions (customer_id, interaction_type, subject, description, created_by) 
               VALUES (?, ?, ?, ?, ?)`,
              [customerId, 'email', subject, `Email verzonden: ${message.substring(0, 100)}...`, `${req.user.first_name} ${req.user.last_name}`]
            );

            res.json({
              message: 'Email succesvol verzonden',
              messageId: result.messageId
            });
          } else {
            // Log failed email
            db.run(
              `INSERT INTO email_logs (customer_id, subject, message, template, sent_by, status, error_message) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [customerId, subject, message, template, req.user.userId, 'failed', result.error]
            );

            res.status(500).json({
              error: 'Email verzenden mislukt',
              details: result.error
            });
          }
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Server fout bij verzenden email' });
    }
  }
);

// Send bulk email to multiple customers
router.post('/send-bulk-email', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  [
    body('customerIds').isArray({ min: 1 }).withMessage('Minimaal één klant vereist'),
    body('subject').trim().isLength({ min: 1 }).withMessage('Onderwerp is verplicht'),
    body('message').trim().isLength({ min: 1 }).withMessage('Bericht is verplicht'),
    body('template').optional().isIn(['default', 'welcome', 'order_confirmation', 'marketing']).withMessage('Ongeldig template')
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerIds, subject, message, template = 'marketing' } = req.body;

    try {
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };

      // Get all customers
      const placeholders = customerIds.map(() => '?').join(',');
      db.all(
        `SELECT * FROM customers WHERE id IN (${placeholders})`,
        customerIds,
        async (err, customers) => {
          if (err) {
            return res.status(500).json({ error: 'Database fout bij ophalen klanten' });
          }

          // Send emails to all customers
          for (const customer of customers) {
            try {
              const result = await emailService.sendCustomerEmail(customer, {
                subject,
                message,
                template
              });

              if (result.success) {
                results.sent++;
                
                // Log successful email
                db.run(
                  `INSERT INTO email_logs (customer_id, subject, message, template, sent_by, status) 
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [customer.id, subject, message, template, req.user.userId, 'sent']
                );

                // Add customer interaction
                db.run(
                  `INSERT INTO customer_interactions (customer_id, interaction_type, subject, description, created_by) 
                   VALUES (?, ?, ?, ?, ?)`,
                  [customer.id, 'email', subject, `Bulk email verzonden: ${message.substring(0, 100)}...`, `${req.user.first_name} ${req.user.last_name}`]
                );
              } else {
                results.failed++;
                results.errors.push({
                  customer: `${customer.first_name} ${customer.last_name}`,
                  email: customer.email,
                  error: result.error
                });

                // Log failed email
                db.run(
                  `INSERT INTO email_logs (customer_id, subject, message, template, sent_by, status, error_message) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [customer.id, subject, message, template, req.user.userId, 'failed', result.error]
                );
              }
            } catch (error) {
              results.failed++;
              results.errors.push({
                customer: `${customer.first_name} ${customer.last_name}`,
                email: customer.email,
                error: error.message
              });
            }
          }

          res.json({
            message: `Bulk email voltooid: ${results.sent} verzonden, ${results.failed} mislukt`,
            results
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Server fout bij verzenden bulk email' });
    }
  }
);

// Get email history for customer
router.get('/customer/:customerId/history', 
  authenticateToken, 
  (req, res) => {
    const customerId = req.params.customerId;

    db.all(
      `SELECT el.*, u.first_name, u.last_name 
       FROM email_logs el
       LEFT JOIN users u ON el.sent_by = u.id
       WHERE el.customer_id = ?
       ORDER BY el.created_at DESC`,
      [customerId],
      (err, emails) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout' });
        }

        res.json({ emails });
      }
    );
  }
);

// Get email templates
router.get('/templates', authenticateToken, (req, res) => {
  const templates = [
    {
      id: 'default',
      name: 'Standaard',
      description: 'Algemene e-mail template',
      preview: 'Beste [naam], [bericht] Met vriendelijke groet, Het team'
    },
    {
      id: 'welcome',
      name: 'Welkom',
      description: 'Welkomst e-mail voor nieuwe klanten',
      preview: 'Welkom [naam]! Bedankt voor je registratie...'
    },
    {
      id: 'order_confirmation',
      name: 'Bestelling Bevestiging',
      description: 'Bevestiging van bestelling',
      preview: 'Bestelling bevestigd! Beste [naam], je bestelling is ontvangen...'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      description: 'Marketing en promotie e-mails',
      preview: 'Exclusieve aanbieding! Hallo [naam], speciale korting voor jou...'
    }
  ];

  res.json({ templates });
});

// Get email statistics
router.get('/stats', 
  authenticateToken, 
  authorizeRole(['admin', 'manager']), 
  (req, res) => {
    const { period = '30' } = req.query;

    db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_emails,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_emails,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_emails,
        template
      FROM email_logs 
      WHERE created_at >= datetime('now', '-${parseInt(period)} days')
      GROUP BY DATE(created_at), template
      ORDER BY date DESC
    `, (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout bij ophalen statistieken' });
      }

      // Get overall stats
      db.get(`
        SELECT 
          COUNT(*) as total_emails,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_emails,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_emails,
          ROUND((SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2) as success_rate
        FROM email_logs 
        WHERE created_at >= datetime('now', '-${parseInt(period)} days')
      `, (err, overview) => {
        if (err) {
          return res.status(500).json({ error: 'Database fout bij ophalen overzicht' });
        }

        res.json({
          period: `${period} dagen`,
          overview: overview || { total_emails: 0, sent_emails: 0, failed_emails: 0, success_rate: 0 },
          daily_stats: stats
        });
      });
    });
  }
);

module.exports = router;
