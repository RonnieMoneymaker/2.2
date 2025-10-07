import { Router } from 'express';
import {
  getSyncQueue,
  queueProductSync,
  queueOrderSync,
  processSyncQueue,
  retryFailedSync,
  clearCompleted,
  receiveProduct,
  receiveOrder,
} from '../controllers/webshopSyncController.js';

const router = Router();

router.get('/queue', getSyncQueue);
router.post('/queue/product', queueProductSync);
router.post('/queue/order', queueOrderSync);
router.post('/process', processSyncQueue);
router.post('/retry', retryFailedSync);
router.delete('/completed', clearCompleted);

// Endpoints for receiving data from external webshops
router.post('/receive/product', receiveProduct);
router.post('/receive/order', receiveOrder);

export default router;
