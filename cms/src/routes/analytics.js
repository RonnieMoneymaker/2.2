import { Router } from 'express';
import { 
  getAnalyticsOverview,
  getGoogleAdsData,
  getFacebookAdsData,
  getSnapchatAdsData,
  getClarityData,
  getMerchantCenterData
} from '../controllers/realAnalyticsController.js';

const router = Router();

// Get overview of all analytics platforms
router.get('/overview', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getAnalyticsOverview(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Google Ads data
router.get('/google-ads', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getGoogleAdsData(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Facebook Ads data
router.get('/facebook-ads', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getFacebookAdsData(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Snapchat Ads data
router.get('/snapchat-ads', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getSnapchatAdsData(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Microsoft Clarity data
router.get('/clarity', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getClarityData(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Google Merchant Center data
router.get('/merchant-center', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = await getMerchantCenterData(websiteId);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

// Get all platforms data in one call
router.get('/all', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const [overview, googleAds, facebookAds, snapchatAds, clarity, merchantCenter] = await Promise.all([
      getAnalyticsOverview(websiteId),
      getGoogleAdsData(websiteId),
      getFacebookAdsData(websiteId),
      getSnapchatAdsData(websiteId),
      getClarityData(websiteId),
      getMerchantCenterData(websiteId)
    ]);
    
    res.json({
      overview,
      googleAds,
      facebookAds,
      snapchatAds,
      clarity,
      merchantCenter
    });
  } catch (e) {
    next(e);
  }
});

export default router;
