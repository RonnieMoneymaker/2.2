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

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5050;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(morgan('tiny'));
app.use(express.json({ limit: '10mb' }));

// Public health before API key guard
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Serve admin UI and static assets with caching
app.use(express.static('public', { maxAge: '7d', etag: true }));

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Interne serverfout' });
});

app.listen(PORT, () => {
  console.log(`CMS API luistert op poort ${PORT}`);
});

export default app;

