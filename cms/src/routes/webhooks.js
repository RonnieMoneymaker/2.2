import { Router } from 'express';
import {
  handleMollieWebhook,
  handleStripeWebhook,
  handleWooCommerceWebhook,
  getAllWebhooks
} from '../controllers/webhooksController.js';

const router = Router();

// Mollie webhook (no auth required)
router.post('/mollie', async (req, res, next) => {
  try {
    await handleMollieWebhook(req.body);
    res.status(200).send('OK');
  } catch (e) {
    console.error('Mollie webhook error:', e);
    res.status(500).send('Error');
  }
});

// Stripe webhook (no auth required)
router.post('/stripe', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    await handleStripeWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (e) {
    console.error('Stripe webhook error:', e);
    res.status(400).send(`Webhook Error: ${e.message}`);
  }
});

// WooCommerce webhook (no auth required)
router.post('/woocommerce', async (req, res, next) => {
  try {
    const topic = req.headers['x-wc-webhook-topic'];
    await handleWooCommerceWebhook(topic, req.body);
    res.status(200).send('OK');
  } catch (e) {
    console.error('WooCommerce webhook error:', e);
    res.status(500).send('Error');
  }
});

// Get all webhooks (requires auth)
router.get('/', async (req, res, next) => {
  try {
    const webhooks = await getAllWebhooks(req.query);
    res.json({ webhooks });
  } catch (e) {
    next(e);
  }
});

export default router;
