import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '../generated/prisma/index.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import statsRouter from './routes/stats.js';
import customersRouter from './routes/customers.js';
import ordersRouter from './routes/orders.js';
import activityRouter from './routes/activity.js';
import uploadRouter from './routes/upload.js';
import analyticsRouter from './routes/analytics.js';
import integrationsRouter from './routes/integrations.js';
import chatRouter from './routes/chat.js';
import webhooksRouter from './routes/webhooks.js';
import emailMarketingRouter from './routes/emailMarketing.js';
import publicRouter from './routes/public.js';
import cartRouter from './routes/cart.js';
import mediaRouter from './routes/media.js';
import financialRouter from './routes/financial.js';
import settingsRouter from './routes/settings.js';
import bulkRouter from './routes/bulk.js';
import notificationsRouter from './routes/notifications.js';
import searchRouter from './routes/search.js';
import performanceRouter from './routes/performance.js';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5050;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*', // In production, specify your actual domain(s)
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));

// Public health before API key guard
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Serve admin UI and static assets with caching
app.use(express.static('public', { maxAge: '7d', etag: true }));

// Serve uploaded media files (public access)
app.use('/media', express.static('uploads', { maxAge: '7d', etag: true }));

// PUBLIC ROUTES (no authentication required for webshop)
app.use('/public', publicRouter);
app.use('/cart', cartRouter);

// Upload route (no API key needed for now - would add in production)
app.use('/api/upload', uploadRouter);

// Webhooks (no API key needed - external services)
app.use('/api/webhooks', webhooksRouter);

// Multi-tenant resolution via API key
app.use(async (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return res.status(401).json({ error: 'API key ontbreekt' });
  try {
    const website = await prisma.website.findUnique({ where: { apiKey } });
    if (!website || !website.isActive) return res.status(403).json({ error: 'Ongeldige of inactieve API key' });
    req.website = website;
    next();
  } catch (e) {
    next(e);
  }
});

app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/activity', activityRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/email-marketing', emailMarketingRouter);
app.use('/api/media', mediaRouter);
app.use('/api/financial', financialRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/bulk', bulkRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);
app.use('/api/performance', performanceRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interne serverfout' });
});

app.listen(PORT, () => {
  console.log(`CMS API luistert op poort ${PORT}`);
});

export default app;

