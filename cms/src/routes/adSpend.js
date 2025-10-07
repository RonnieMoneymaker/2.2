import { Router } from 'express';
import {
  getAdSpend,
  getAdSpendSummary,
  getTodayAdSpend,
  createAdSpend,
  updateAdSpend,
  deleteAdSpend,
  syncGoogleAds,
  syncMetaAds,
} from '../controllers/adSpendController.js';

const router = Router();

router.get('/', getAdSpend);
router.get('/summary', getAdSpendSummary);
router.get('/today', getTodayAdSpend);
router.get('/:id', (req, res, next) => {
  // Get single ad spend entry
  const { id } = req.params;
  next();
});
router.post('/', createAdSpend);
router.post('/sync/google', syncGoogleAds);
router.post('/sync/meta', syncMetaAds);
router.put('/:id', updateAdSpend);
router.delete('/:id', deleteAdSpend);

export default router;
