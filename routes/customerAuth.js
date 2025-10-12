const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const realEmailService = require('../services/realEmailService');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Customer Registration
router.post('/register', [
  body('first_name').notEmpty().withMessage('Voornaam is verplicht'),
  body('last_name').notEmpty().withMessage('Achternaam is verplicht'),
  body('email').isEmail().withMessage('Geldig email adres is verplicht'),
  body('password').isLength({ min: 6 }).withMessage('Wachtwoord moet minimaal 6 karakters zijn'),
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

    const { first_name, last_name, email, password, phone, address, postal_code, city, country } = req.body;

    // Check if customer already exists
    const existingCustomer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Email adres is al geregistreerd' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });

    // Insert new customer
    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO customers (
          first_name, last_name, email, phone, address, postal_code, city, country,
          password_hash, is_verified, verification_token, customer_status, date_created,
          registration_ip, webshop_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'new', datetime('now'), ?, 1)
      `, [
        first_name, last_name, email, phone || '', address || '', postal_code || '', 
        city || '', country || 'Nederland', hashedPassword, verificationToken,
        req.ip || '127.0.0.1'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Send verification email
    try {
      await realEmailService.sendEmail({
        to: email,
        from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
        subject: 'Welkom! Bevestig je email adres',
        html: generateVerificationEmail(first_name, verificationToken)
      });
      console.log('✅ Verification email sent to:', email);
    } catch (emailError) {
      console.log('⚠️ Verification email failed:', emailError.message);
    }

    res.status(201).json({
      message: 'Account aangemaakt! Check je email voor verificatie.',
      customerId: result,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Customer Login
router.post('/login', [
  body('email').isEmail().withMessage('Geldig email adres is verplicht'),
  body('password').notEmpty().withMessage('Wachtwoord is verplicht')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find customer
    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!customer || !customer.password_hash) {
      return res.status(401).json({ error: 'Ongeldige login gegevens' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, customer.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Ongeldige login gegevens' });
    }

    // Check if verified
    if (!customer.is_verified) {
      return res.status(401).json({ 
        error: 'Account niet geverifieerd. Check je email voor verificatie link.',
        requiresVerification: true 
      });
    }

    // Update last login
    db.run(`
      UPDATE customers 
      SET last_login_ip = ?, last_login_at = datetime('now')
      WHERE id = ?
    `, [req.ip || '127.0.0.1', customer.id]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email, 
        role: 'customer',
        type: 'customer'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login succesvol',
      token,
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        role: 'customer'
      }
    });

    console.log('✅ Customer login successful:', email);

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Email Verification
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Update customer verification status
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE customers 
        SET is_verified = 1, verification_token = NULL, customer_status = 'active'
        WHERE email = ? AND verification_token = ?
      `, [decoded.email, token], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    if (result === 0) {
      return res.status(400).json({ error: 'Ongeldige of verlopen verificatie link' });
    }

    res.json({ message: 'Email succesvol geverifieerd! Je kunt nu inloggen.' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ error: 'Ongeldige of verlopen verificatie link' });
  }
});

// Resend Verification Email
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Geldig email adres is verplicht')
], async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE email = ? AND is_verified = 0', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!customer) {
      return res.status(404).json({ error: 'Account niet gevonden of al geverifieerd' });
    }

    // Generate new verification token
    const verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
    
    // Update token in database
    db.run('UPDATE customers SET verification_token = ? WHERE email = ?', [verificationToken, email]);

    // Send verification email
    await realEmailService.sendEmail({
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: 'Bevestig je email adres',
      html: generateVerificationEmail(customer.first_name, verificationToken)
    });

    res.json({ message: 'Verificatie email opnieuw verzonden' });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Password Reset Request
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Geldig email adres is verplicht')
], async (req, res) => {
  try {
    const { email } = req.body;

    const customer = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM customers WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!customer) {
      // Don't reveal if email exists for security
      return res.json({ message: 'Als het email adres bestaat, is een reset link verzonden.' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ email, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
    
    // Store reset token (in production, use separate table)
    db.run('UPDATE customers SET verification_token = ? WHERE email = ?', [resetToken, email]);

    // Send reset email
    await realEmailService.sendEmail({
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@webshop.nl',
      subject: 'Wachtwoord reset',
      html: generatePasswordResetEmail(customer.first_name, resetToken)
    });

    res.json({ message: 'Als het email adres bestaat, is een reset link verzonden.' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Interne server fout' });
  }
});

// Password Reset
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Wachtwoord moet minimaal 6 karakters zijn')
], async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'Ongeldige reset link' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password
    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE customers 
        SET password_hash = ?, verification_token = NULL
        WHERE email = ?
      `, [hashedPassword, decoded.email], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    if (result === 0) {
      return res.status(400).json({ error: 'Ongeldige reset link' });
    }

    res.json({ message: 'Wachtwoord succesvol aangepast' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: 'Ongeldige of verlopen reset link' });
  }
});

function generateVerificationEmail(firstName, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welkom bij onze webshop!</h1>
        </div>
        <div class="content">
            <p>Beste ${firstName},</p>
            <p>Bedankt voor je registratie! Om je account te activeren, klik je op de onderstaande knop:</p>
            
            <a href="${verificationUrl}" class="button">✅ Bevestig Email Adres</a>
            
            <p>Of kopieer deze link naar je browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>Deze link is 24 uur geldig.</p>
            
            <p>Als je dit account niet hebt aangemaakt, kun je deze email negeren.</p>
        </div>
        <div class="footer">
            <p>Met vriendelijke groet,<br>Het Webshop Team</p>
        </div>
    </body>
    </html>
  `;
}

function generatePasswordResetEmail(firstName, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Wachtwoord Reset</h1>
        </div>
        <div class="content">
            <p>Beste ${firstName},</p>
            <p>Je hebt een wachtwoord reset aangevraagd. Klik op de onderstaande knop om je wachtwoord te wijzigen:</p>
            
            <a href="${resetUrl}" class="button">🔒 Reset Wachtwoord</a>
            
            <p>Of kopieer deze link naar je browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p>Deze link is 1 uur geldig.</p>
            
            <p>Als je geen wachtwoord reset hebt aangevraagd, kun je deze email negeren.</p>
        </div>
        <div class="footer">
            <p>Met vriendelijke groet,<br>Het Webshop Team</p>
        </div>
    </body>
    </html>
  `;
}

module.exports = router;
