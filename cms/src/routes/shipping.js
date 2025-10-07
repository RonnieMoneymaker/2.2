import { Router } from 'express';
import {
  getShippingRates,
  calculateShipping,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  getCarriers,
} from '../controllers/shippingController.js';

const router = Router();

router.get('/rates', getShippingRates);
router.post('/calculate', calculateShipping);
router.get('/carriers', getCarriers);
router.post('/rates', createShippingRate);
router.put('/rates/:id', updateShippingRate);
router.delete('/rates/:id', deleteShippingRate);

export default router;
