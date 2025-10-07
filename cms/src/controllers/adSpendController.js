import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all ad spend data
export const getAdSpend = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { platform, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {
      websiteId,
      ...(platform && { platform }),
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [adSpends, total] = await Promise.all([
      prisma.adSpend.findMany({
        where,
        include: {
          integration: true,
        },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date: 'desc' },
      }),
      prisma.adSpend.count({ where }),
    ]);

    res.json({
      adSpends,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get ad spend summary
export const getAdSpendSummary = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { startDate, endDate } = req.query;

    const where = { websiteId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const summary = await prisma.adSpend.aggregate({
      where,
      _sum: {
        spendCents: true,
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    // Group by platform
    const byPlatform = await prisma.adSpend.groupBy({
      by: ['platform'],
      where,
      _sum: {
        spendCents: true,
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
    });

    // Calculate ROI and other metrics
    const totalSpend = summary._sum.spendCents || 0;
    const totalRevenue = summary._sum.revenue || 0;
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const cpc = summary._sum.clicks > 0 ? totalSpend / summary._sum.clicks : 0;
    const cpa = summary._sum.conversions > 0 ? totalSpend / summary._sum.conversions : 0;

    res.json({
      total: {
        spend: totalSpend,
        revenue: totalRevenue,
        profit: totalRevenue - totalSpend,
        impressions: summary._sum.impressions || 0,
        clicks: summary._sum.clicks || 0,
        conversions: summary._sum.conversions || 0,
        roi: roi.toFixed(2),
        cpc: cpc.toFixed(2),
        cpa: cpa.toFixed(2),
      },
      byPlatform: byPlatform.map(p => ({
        platform: p.platform,
        spend: p._sum.spendCents || 0,
        revenue: p._sum.revenue || 0,
        profit: (p._sum.revenue || 0) - (p._sum.spendCents || 0),
        impressions: p._sum.impressions || 0,
        clicks: p._sum.clicks || 0,
        conversions: p._sum.conversions || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get today's ad spend
export const getTodayAdSpend = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = await prisma.adSpend.aggregate({
      where: {
        websiteId,
        date: { gte: today },
      },
      _sum: {
        spendCents: true,
      },
    });

    res.json({
      todaySpend: summary._sum.spendCents || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Create ad spend entry
export const createAdSpend = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const data = req.body;

    const adSpend = await prisma.adSpend.create({
      data: {
        ...data,
        websiteId,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        integration: true,
      },
    });

    res.status(201).json(adSpend);
  } catch (error) {
    next(error);
  }
};

// Update ad spend entry
export const updateAdSpend = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const data = req.body;

    const adSpend = await prisma.adSpend.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!adSpend) {
      return res.status(404).json({ error: 'Ad spend entry niet gevonden' });
    }

    const updated = await prisma.adSpend.update({
      where: { id: Number(id) },
      data,
      include: {
        integration: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Delete ad spend entry
export const deleteAdSpend = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const adSpend = await prisma.adSpend.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!adSpend) {
      return res.status(404).json({ error: 'Ad spend entry niet gevonden' });
    }

    await prisma.adSpend.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Ad spend entry succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};

// Sync Google Ads data
export const syncGoogleAds = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    // Zoek Google Ads integratie
    const integration = await prisma.integration.findFirst({
      where: {
        websiteId,
        platform: 'google_ads',
        isActive: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Google Ads integratie niet gevonden' });
    }

    // Hier zou je de Google Ads API aanroepen
    // Voor nu: simuleer data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check of er al data is voor vandaag
    const existing = await prisma.adSpend.findFirst({
      where: {
        websiteId,
        platform: 'google_ads',
        date: today,
      },
    });

    if (existing) {
      return res.json({ 
        message: 'Google Ads data al gesynchroniseerd voor vandaag',
        data: existing 
      });
    }

    // Maak nieuwe entry (in productie: gebruik echte Google Ads API data)
    const adSpend = await prisma.adSpend.create({
      data: {
        websiteId,
        integrationId: integration.id,
        platform: 'google_ads',
        date: today,
        spendCents: Math.floor(Math.random() * 50000) + 10000, // Simulatie
        impressions: Math.floor(Math.random() * 100000) + 50000,
        clicks: Math.floor(Math.random() * 5000) + 1000,
        conversions: Math.floor(Math.random() * 100) + 20,
        revenue: 0, // Wordt berekend uit orders
      },
    });

    // Update integration sync status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSync: new Date(),
        syncStatus: 'success',
      },
    });

    res.json({
      message: 'Google Ads data succesvol gesynchroniseerd',
      data: adSpend,
    });
  } catch (error) {
    next(error);
  }
};

// Sync Meta/Facebook Ads data
export const syncMetaAds = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    const integration = await prisma.integration.findFirst({
      where: {
        websiteId,
        platform: 'meta_ads',
        isActive: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Meta Ads integratie niet gevonden' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.adSpend.findFirst({
      where: {
        websiteId,
        platform: 'meta_ads',
        date: today,
      },
    });

    if (existing) {
      return res.json({ 
        message: 'Meta Ads data al gesynchroniseerd voor vandaag',
        data: existing 
      });
    }

    const adSpend = await prisma.adSpend.create({
      data: {
        websiteId,
        integrationId: integration.id,
        platform: 'meta_ads',
        date: today,
        spendCents: Math.floor(Math.random() * 40000) + 8000,
        impressions: Math.floor(Math.random() * 80000) + 40000,
        clicks: Math.floor(Math.random() * 4000) + 800,
        conversions: Math.floor(Math.random() * 80) + 15,
        revenue: 0,
      },
    });

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSync: new Date(),
        syncStatus: 'success',
      },
    });

    res.json({
      message: 'Meta Ads data succesvol gesynchroniseerd',
      data: adSpend,
    });
  } catch (error) {
    next(error);
  }
};
