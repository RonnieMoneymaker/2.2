import { Router } from 'express';
import {
  getAllIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testConnection,
  syncWooCommerceProducts,
  syncShopifyProducts,
  getSyncLogs,
  getWebhooks
} from '../controllers/integrationsController.js';

const router = Router();

// Get all integrations
router.get('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const integrations = await getAllIntegrations(websiteId);
    res.json({ integrations });
  } catch (e) {
    next(e);
  }
});

// Get single integration
router.get('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const integration = await getIntegration(id, websiteId);
    
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    
    res.json({ integration });
  } catch (e) {
    next(e);
  }
});

// Create integration
router.post('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const integration = await createIntegration(websiteId, req.body);
    res.status(201).json({ integration });
  } catch (e) {
    next(e);
  }
});

// Update integration
router.put('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const integration = await updateIntegration(id, websiteId, req.body);
    res.json({ integration });
  } catch (e) {
    next(e);
  }
});

// Delete integration
router.delete('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    await deleteIntegration(id, websiteId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Test connection
router.post('/:id/test', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const result = await testConnection(id, websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Sync products from WooCommerce
router.post('/:id/sync/woocommerce/products', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const result = await syncWooCommerceProducts(id, websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Sync products from Shopify
router.post('/:id/sync/shopify/products', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const result = await syncShopifyProducts(id, websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Get sync logs for integration
router.get('/:id/logs', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const logs = await getSyncLogs(id, websiteId);
    res.json({ logs });
  } catch (e) {
    next(e);
  }
});

// Get webhooks for integration
router.get('/:id/webhooks', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const webhooks = await getWebhooks(id);
    res.json({ webhooks });
  } catch (e) {
    next(e);
  }
});

export default router;
