import { Router } from 'express';
import {
  getPaymentProviders,
  getPaymentProvider,
  createPaymentProvider,
  updatePaymentProvider,
  deletePaymentProvider,
  getSupportedProviders,
  testConnection,
} from '../controllers/paymentController.js';

const router = Router();

router.get('/', getPaymentProviders);
router.get('/supported', getSupportedProviders);
router.get('/:id', getPaymentProvider);
router.get('/:id/test', testConnection);
router.post('/', createPaymentProvider);
router.put('/:id', updatePaymentProvider);
router.delete('/:id', deletePaymentProvider);

export default router;
