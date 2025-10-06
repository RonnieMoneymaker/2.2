import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get comprehensive financial overview
router.get('/overview', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { period = 'all' } = req.query;
    
    // Calculate date range
    let dateFilter = {};
    const now = new Date();
    if (period === 'today') {
      dateFilter = { createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) } };
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { createdAt: { gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      dateFilter = { createdAt: { gte: yearAgo } };
    }
    
    // Get all completed orders
    const orders = await prisma.order.findMany({
      where: {
        websiteId,
        paymentStatus: 'paid',
        ...dateFilter
      },
      include: {
        items: {
          include: {
            product: {
              select: { costCents: true, priceCents: true }
            }
          }
        }
      }
    });
    
    // Calculate financial metrics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalTax = 0;
    let totalShipping = 0;
    let totalDiscount = 0;
    
    orders.forEach(order => {
      totalRevenue += order.subtotalCents;
      totalTax += order.taxCents;
      totalShipping += order.shippingCents;
      totalDiscount += order.discountCents;
      
      // Calculate cost
      order.items.forEach(item => {
        if (item.product && item.product.costCents) {
          totalCost += item.product.costCents * item.quantity;
        }
      });
    });
    
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalDiscount; // Simplified (would include other costs)
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    res.json({
      period,
      orderCount: orders.length,
      revenue: {
        totalCents: totalRevenue,
        withTax: totalRevenue + totalTax,
        taxCents: totalTax,
        shippingCents: totalShipping,
        discountCents: totalDiscount
      },
      costs: {
        productCostCents: totalCost
      },
      profit: {
        grossProfitCents: grossProfit,
        netProfitCents: netProfit,
        marginPercentage: Math.round(profitMargin * 100) / 100
      },
      averages: {
        orderValueCents: orders.length > 0 ? Math.floor(totalRevenue / orders.length) : 0,
        profitPerOrderCents: orders.length > 0 ? Math.floor(grossProfit / orders.length) : 0
      }
    });
  } catch (e) {
    next(e);
  }
});

// Get profit by product
router.get('/profit-by-product', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { limit = 20, sort = 'profit_desc' } = req.query;
    
    // Get all order items with products
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          websiteId,
          paymentStatus: 'paid'
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceCents: true,
            costCents: true
          }
        }
      }
    });
    
    // Group by product and calculate profit
    const productStats = {};
    
    orderItems.forEach(item => {
      if (!item.product) return;
      
      const productId = item.product.id;
      if (!productStats[productId]) {
        productStats[productId] = {
          product: item.product,
          quantitySold: 0,
          revenueCents: 0,
          costCents: 0,
          profitCents: 0,
          profitMargin: 0
        };
      }
      
      const cost = item.product.costCents || 0;
      const revenue = item.unitCents * item.quantity;
      const totalCost = cost * item.quantity;
      const profit = revenue - totalCost;
      
      productStats[productId].quantitySold += item.quantity;
      productStats[productId].revenueCents += revenue;
      productStats[productId].costCents += totalCost;
      productStats[productId].profitCents += profit;
    });
    
    // Calculate profit margins
    Object.values(productStats).forEach(stat => {
      stat.profitMargin = stat.revenueCents > 0 
        ? (stat.profitCents / stat.revenueCents) * 100 
        : 0;
    });
    
    // Convert to array and sort
    let results = Object.values(productStats);
    
    if (sort === 'profit_desc') {
      results.sort((a, b) => b.profitCents - a.profitCents);
    } else if (sort === 'profit_asc') {
      results.sort((a, b) => a.profitCents - b.profitCents);
    } else if (sort === 'revenue_desc') {
      results.sort((a, b) => b.revenueCents - a.revenueCents);
    } else if (sort === 'quantity_desc') {
      results.sort((a, b) => b.quantitySold - a.quantitySold);
    }
    
    res.json({
      products: results.slice(0, limit),
      total: results.length
    });
  } catch (e) {
    next(e);
  }
});

// Get revenue over time (for charts)
router.get('/revenue-over-time', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const orders = await prisma.order.findMany({
      where: {
        websiteId,
        paymentStatus: 'paid',
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        subtotalCents: true,
        totalCents: true
      }
    });
    
    // Group by day
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = {
        date: dateKey,
        revenueCents: 0,
        orderCount: 0
      };
    }
    
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].revenueCents += order.subtotalCents;
        dailyStats[dateKey].orderCount += 1;
      }
    });
    
    const timeline = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    res.json({ timeline });
  } catch (e) {
    next(e);
  }
});

// Get profit over time (for charts)
router.get('/profit-over-time', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const orders = await prisma.order.findMany({
      where: {
        websiteId,
        paymentStatus: 'paid',
        createdAt: { gte: startDate }
      },
      include: {
        items: {
          include: {
            product: {
              select: { costCents: true }
            }
          }
        }
      }
    });
    
    // Group by day
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = {
        date: dateKey,
        revenueCents: 0,
        costCents: 0,
        profitCents: 0
      };
    }
    
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].revenueCents += order.subtotalCents;
        
        order.items.forEach(item => {
          if (item.product && item.product.costCents) {
            const cost = item.product.costCents * item.quantity;
            dailyStats[dateKey].costCents += cost;
          }
        });
        
        dailyStats[dateKey].profitCents = 
          dailyStats[dateKey].revenueCents - dailyStats[dateKey].costCents;
      }
    });
    
    const timeline = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    res.json({ timeline });
  } catch (e) {
    next(e);
  }
});

// Get top customers by value
router.get('/top-customers', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { limit = 10 } = req.query;
    
    const customers = await prisma.customer.findMany({
      where: { websiteId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        orderCount: true,
        totalSpent: true,
        lastOrderAt: true
      },
      orderBy: { totalSpent: 'desc' },
      take: limit
    });
    
    res.json({ customers });
  } catch (e) {
    next(e);
  }
});

// Get category performance
router.get('/category-performance', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    const categories = await prisma.category.findMany({
      where: { websiteId },
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: {
                  paymentStatus: 'paid'
                }
              },
              include: {
                product: {
                  select: { costCents: true }
                }
              }
            }
          }
        }
      }
    });
    
    const categoryStats = categories.map(cat => {
      let revenueCents = 0;
      let costCents = 0;
      let quantitySold = 0;
      
      cat.products.forEach(product => {
        product.orderItems.forEach(item => {
          revenueCents += item.unitCents * item.quantity;
          if (item.product && item.product.costCents) {
            costCents += item.product.costCents * item.quantity;
          }
          quantitySold += item.quantity;
        });
      });
      
      const profitCents = revenueCents - costCents;
      const profitMargin = revenueCents > 0 ? (profitCents / revenueCents) * 100 : 0;
      
      return {
        category: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        },
        revenueCents,
        costCents,
        profitCents,
        profitMargin,
        quantitySold,
        productCount: cat.products.length
      };
    });
    
    // Sort by revenue
    categoryStats.sort((a, b) => b.revenueCents - a.revenueCents);
    
    res.json({ categories: categoryStats });
  } catch (e) {
    next(e);
  }
});

// Get low stock products (inventory alert)
router.get('/low-stock', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    
    const products = await prisma.product.findMany({
      where: {
        websiteId,
        isActive: true,
        stockQuantity: {
          lte: prisma.raw('lowStockThreshold')
        }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
        priceCents: true
      },
      orderBy: { stockQuantity: 'asc' }
    });
    
    res.json({ products, count: products.length });
  } catch (e) {
    next(e);
  }
});

export default router;
