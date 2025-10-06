import { Router } from 'express';
import {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignStats,
  syncContactsToMailchimp
} from '../controllers/emailMarketingController.js';

const router = Router();

// Get all campaigns
router.get('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const campaigns = await getAllCampaigns(websiteId);
    res.json({ campaigns });
  } catch (e) {
    next(e);
  }
});

// Get single campaign
router.get('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const campaign = await getCampaign(id, websiteId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ campaign });
  } catch (e) {
    next(e);
  }
});

// Create campaign
router.post('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const campaign = await createCampaign(websiteId, req.body);
    res.status(201).json({ campaign });
  } catch (e) {
    next(e);
  }
});

// Update campaign
router.put('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const campaign = await updateCampaign(id, websiteId, req.body);
    res.json({ campaign });
  } catch (e) {
    next(e);
  }
});

// Delete campaign
router.delete('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    await deleteCampaign(id, websiteId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Send campaign
router.post('/:id/send', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const result = await sendCampaign(id, websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Get campaign stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id);
    const stats = await getCampaignStats(id, websiteId);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

// Sync contacts to Mailchimp
router.post('/sync/mailchimp', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const result = await syncContactsToMailchimp(websiteId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
