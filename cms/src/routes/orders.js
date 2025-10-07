import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrderStats,
} from '../controllers/ordersController.js';

const router = Router();

router.get('/', getOrders);
router.get('/stats/overview', getOrderStats);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.put('/:id', updateOrder); // Volledige order bewerken
router.delete('/:id', deleteOrder);

export default router;


