const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const emailRoutes = require('./routes/emails');
const advertisingRoutes = require('./routes/advertising');
const costsRoutes = require('./routes/costs');
const productsRoutes = require('./routes/products');
const profitRoutes = require('./routes/profit');
const testRoutes = require('./routes/test');
const aiRoutes = require('./routes/ai');
const shippingRoutes = require('./routes/shipping');
const fulfillmentRoutes = require('./routes/fulfillment');
const customerAuthRoutes = require('./routes/customerAuth');
const customerPortalRoutes = require('./routes/customerPortal');
const apiSettingsRoutes = require('./routes/apiSettings');
const oauthRoutes = require('./routes/oauth');
const webshopsRoutes = require('./routes/webshops');
const liveViewingService = require('./services/liveViewingService');
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:2001',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Development mode settings
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Running in development mode');
}

// API Routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/profit', profitRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/fulfillment', fulfillmentRoutes);
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/settings', apiSettingsRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/webshops', webshopsRoutes);

// Simple health check endpoint for automated tests
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Er is iets misgegaan op de server',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Interne serverfout'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint niet gevonden' });
});

// Initialize database and start server with Socket.IO
initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 CRM Server draait op poort ${PORT}`);
      console.log(`📊 Dashboard beschikbaar op http://localhost:${PORT}`);
    });
    try {
      liveViewingService.initialize(server);
    } catch (e) {
      console.warn('⚠️ Live viewing kon niet initialiseren:', e.message);
    }
  })
  .catch(err => {
    console.error('Database initialisatie mislukt:', err);
    process.exit(1);
  });

module.exports = app;
