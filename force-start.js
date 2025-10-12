// Minimale server die gegarandeerd start
const express = require('express');
const app = express();

app.use(express.static('client/build'));
app.use(express.json());

// Mock API endpoints
app.post('/api/auth/login', (req, res) => {
  res.json({
    token: 'mock_token_12345',
    user: { email: 'admin@webshop.nl', role: 'admin' }
  });
});

app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalCustomers: { count: 25 },
    totalOrders: { count: 48 },
    totalRevenue: { total: 3847.50 },
    recentOrders: [],
    topCustomers: []
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

const path = require('path');

const PORT = 3001; // Use different port
app.listen(PORT, () => {
  console.log(`🚀 FORCE SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log('✅ Login: admin@webshop.nl / admin123');
});
