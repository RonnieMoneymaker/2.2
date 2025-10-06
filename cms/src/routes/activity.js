import { Router } from 'express';
import {
  getActivities,
  getActivityStats,
  clearActivities,
} from '../controllers/activityController.js';

const router = Router();

router.get('/', getActivities);
router.get('/stats', getActivityStats);
router.delete('/', clearActivities);

export default router;


