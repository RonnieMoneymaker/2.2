import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/overview', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const [products, categories, customers, orders] = await Promise.all([
      prisma.product.count({ where: { websiteId, isActive: true } }),
      prisma.category.count({ where: { websiteId } }),
      prisma.customer.count({ where: { websiteId } }),
      prisma.order.count({ where: { websiteId } })
    ]);
    // Last 14 days revenue
    const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
    const recent = await prisma.order.findMany({
      where: { websiteId, createdAt: { gte: since }, status: { in: ['processing', 'delivered'] } },
      select: { totalCents: true, createdAt: true }
    });
    const byDay = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    recent.forEach(o => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (byDay[key] != null) byDay[key] += o.totalCents;
    });
    const salesOverTime = Object.keys(byDay).sort().map(k => ({ date: k, totalCents: byDay[k] }));
    res.json({ products, categories, customers, orders, salesOverTime });
  } catch (e) {
    next(e);
  }
});

export default router;


