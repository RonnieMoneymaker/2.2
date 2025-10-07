import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerComments,
  addCustomerComment,
  updateCustomerComment,
  deleteCustomerComment,
} from '../controllers/customersController.js';

const router = Router();

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.get('/:id/comments', getCustomerComments);
router.post('/', createCustomer);
router.post('/:id/comments', addCustomerComment);
router.put('/:id', updateCustomer);
router.put('/:id/comments/:commentId', updateCustomerComment);
router.delete('/:id', deleteCustomer);
router.delete('/:id/comments/:commentId', deleteCustomerComment);

export default router;


