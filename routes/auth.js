const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Geldig e-mailadres vereist'),
  body('password').isLength({ min: 6 }).withMessage('Wachtwoord moet minimaal 6 karakters bevatten'),
  body('first_name').trim().isLength({ min: 1 }).withMessage('Voornaam is verplicht'),
  body('last_name').trim().isLength({ min: 1 }).withMessage('Achternaam is verplicht')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, first_name, last_name, role = 'user' } = req.body;

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Gebruiker met dit e-mailadres bestaat al' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      db.run(
        `INSERT INTO users (email, password, first_name, last_name, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [email, hashedPassword, first_name, last_name, role],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Fout bij aanmaken gebruiker' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { 
              userId: this.lastID, 
              email, 
              role,
              first_name,
              last_name 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          res.status(201).json({
            message: 'Gebruiker succesvol aangemaakt',
            token,
            user: {
              id: this.lastID,
              email,
              first_name,
              last_name,
              role
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server fout bij registratie' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Geldig e-mailadres vereist'),
  body('password').isLength({ min: 1 }).withMessage('Wachtwoord is verplicht')
], (req, res) => {
  console.log('Auth login endpoint hit:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        console.error('Database error in auth login:', err);
        return res.status(500).json({ error: 'Database fout' });
      }

      console.log('User found in auth login:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(401).json({ error: 'Ongeldige inloggegevens' });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid in auth login:', isValidPassword);
        
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Ongeldige inloggegevens' });
        }

        // Update last login
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name 
          },
          process.env.JWT_SECRET || 'default_secret',
          { expiresIn: '24h' }
        );

        console.log('Auth login successful for:', email);

        res.json({
          message: 'Succesvol ingelogd',
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });
      } catch (error) {
        console.error('Password comparison error in auth login:', error);
        res.status(500).json({ error: 'Server fout bij inloggen' });
      }
    }
  );
});

// Get current user profile
router.get('/profile', require('../middleware/auth').authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, first_name, last_name, role, created_at, last_login FROM users WHERE id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Gebruiker niet gevonden' });
      }

      res.json({ user });
    }
  );
});

// Change password
router.put('/change-password', require('../middleware/auth').authenticateToken, [
  body('currentPassword').isLength({ min: 1 }).withMessage('Huidig wachtwoord is verplicht'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nieuw wachtwoord moet minimaal 6 karakters bevatten')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  db.get(
    'SELECT password FROM users WHERE id = ?',
    [req.user.userId],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database fout' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Gebruiker niet gevonden' });
      }

      try {
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Huidig wachtwoord is onjuist' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedNewPassword, req.user.userId],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Fout bij bijwerken wachtwoord' });
            }

            res.json({ message: 'Wachtwoord succesvol gewijzigd' });
          }
        );
      } catch (error) {
        res.status(500).json({ error: 'Server fout bij wijzigen wachtwoord' });
      }
    }
  );
});

module.exports = router;
