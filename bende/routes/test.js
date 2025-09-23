const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');
const router = express.Router();

// Simple test login without any middleware
router.post('/login', async (req, res) => {
  console.log('Test login endpoint hit:', req.body);
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
  }

  try {
    // Check if user exists
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database fout' });
        }

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
          return res.status(401).json({ error: 'Ongeldige inloggegevens' });
        }

        try {
          const isValidPassword = await bcrypt.compare(password, user.password);
          console.log('Password valid:', isValidPassword);
          
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Ongeldige inloggegevens' });
          }

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

          console.log('Login successful for:', email);

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
          console.error('Password comparison error:', error);
          res.status(500).json({ error: 'Server fout bij wachtwoord verificatie' });
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server fout bij inloggen' });
  }
});

module.exports = router;
