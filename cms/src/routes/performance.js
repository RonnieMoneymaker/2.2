import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get overall performance metrics
router.get('/overview', async (req, res, next) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      averageOrderValue,
      topProducts,
      topCustomers,
      conversionRate,
      returnRate
    ] = await Promise.all([
      // Total orders in period
      prisma.order.count({
        where: {
          websiteId: req.website.id,
          createdAt: { gte: daysAgo }
        }
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          websiteId: req.website.id,
          createdAt: { gte: daysAgo },
          status: { not: 'cancelled' }
        },
        _sum: { totalCents: true }
      }),

      // New customers
      prisma.customer.count({
        where: {
          websiteId: req.website.id,
          createdAt: { gte: daysAgo }
        }
      }),

      // Average order value
      prisma.order.aggregate({
        where: {
          websiteId: req.website.id,
          createdAt: { gte: daysAgo },
          status: { not: 'cancelled' }
        },
        _avg: { totalCents: true }
      }),

      // Top 10 products by revenue
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            websiteId: req.website.id,
            createdAt: { gte: daysAgo },
            status: { not: 'cancelled' }
          }
        },
        _sum: {
          totalCents: true,
          quantity: true
        },
        orderBy: {
          _sum: {
            totalCents: 'desc'
          }
        },
        take: 10
      }),

      // Top 10 customers by spending
      prisma.order.groupBy({
        by: ['customerId'],
        where: {
          websiteId: req.website.id,
          createdAt: { gte: daysAgo },
          status: { not: 'cancelled' }
        },
        _sum: { totalCents: true },
        _count: true,
        orderBy: {
          _sum: {
            totalCents: 'desc'
          }
        },
        take: 10
      }),

      // Conversion rate (orders / customers)
      Promise.all([
        prisma.customer.count({
          where: {
            websiteId: req.website.id,
            createdAt: { gte: daysAgo }
          }
        }),
        prisma.order.count({
          where: {
            websiteId: req.website.id,
            createdAt: { gte: daysAgo }
          }
        })
      ]).then(([customers, orders]) => 
        customers > 0 ? (orders / customers) * 100 : 0
      ),

      // Return rate
      Promise.all([
        prisma.order.count({
          where: {
            websiteId: req.website.id,
            createdAt: { gte: daysAgo },
            status: 'cancelled'
          }
        }),
        prisma.order.count({
          where: {
            websiteId: req.website.id,
            createdAt: { gte: daysAgo }
          }
        })
      ]).then(([cancelled, total]) => 
        total > 0 ? (cancelled / total) * 100 : 0
      )
    ]);

    // Enrich top products with names
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, images: true }
    });

    const enrichedTopProducts = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        ...tp,
        productName: product?.name || 'Unknown',
        productImage: product?.images ? JSON.parse(product.images)[0] : null,
        revenue: tp._sum.totalCents,
        quantity: tp._sum.quantity
      };
    });

    // Enrich top customers with names
    const customerIds = topCustomers.map(c => c.customerId);
    const customersData = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const enrichedTopCustomers = topCustomers.map(tc => {
      const customer = customersData.find(c => c.id === tc.customerId);
      return {
        ...tc,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
        customerEmail: customer?.email || '',
        totalSpent: tc._sum.totalCents,
        orderCount: tc._count
      };
    });

    res.json({
      period: parseInt(period),
      metrics: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalCents || 0,
        totalCustomers,
        averageOrderValue: Math.round(averageOrderValue._avg.totalCents || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        returnRate: Math.round(returnRate * 100) / 100
      },
      topProducts: enrichedTopProducts,
      topCustomers: enrichedTopCustomers
    });
  } catch (e) {
    next(e);
  }
});

// Get sales by day
router.get('/sales-by-day', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const orders = await prisma.order.findMany({
      where: {
        websiteId: req.website.id,
        createdAt: { gte: daysAgo },
        status: { not: 'cancelled' }
      },
      select: {
        createdAt: true,
        totalCents: true
      }
    });

    // Group by day
    const salesByDay = {};
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      salesByDay[dateKey] = { orders: 0, revenue: 0 };
    }

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (salesByDay[dateKey]) {
        salesByDay[dateKey].orders++;
        salesByDay[dateKey].revenue += order.totalCents;
      }
    });

    const chartData = Object.entries(salesByDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue / 100
      }));

    res.json({ chartData });
  } catch (e) {
    next(e);
  }
});

// Get category performance
router.get('/categories', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const categories = await prisma.category.findMany({
      where: { websiteId: req.website.id },
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: daysAgo },
                  status: { not: 'cancelled' }
                }
              }
            }
          }
        }
      }
    });

    const categoryPerformance = categories.map(cat => {
      const totalRevenue = cat.products.reduce((sum, product) => {
        return sum + product.orderItems.reduce((itemSum, item) => itemSum + item.totalCents, 0);
      }, 0);

      const totalOrders = cat.products.reduce((sum, product) => {
        return sum + product.orderItems.length;
      }, 0);

      return {
        id: cat.id,
        name: cat.name,
        productCount: cat.products.length,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({ categories: categoryPerformance });
  } catch (e) {
    next(e);
  }
});

// Get customer lifetime value
router.get('/customer-ltv', async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { websiteId: req.website.id },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          select: { totalCents: true, createdAt: true }
        }
      },
      take: 100
    });

    const customerLTV = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalCents, 0);
      const orderCount = customer.orders.length;
      const firstOrderDate = customer.orders.length > 0 
        ? customer.orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0].createdAt
        : customer.createdAt;
      const daysSinceFirst = Math.floor((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        totalSpent,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        daysSinceFirst,
        ltv: totalSpent
      };
    }).sort((a, b) => b.ltv - a.ltv);

    const avgLTV = customerLTV.length > 0
      ? customerLTV.reduce((sum, c) => sum + c.ltv, 0) / customerLTV.length
      : 0;

    res.json({
      customers: customerLTV.slice(0, 20),
      averageLTV: avgLTV,
      totalCustomers: customerLTV.length
    });
  } catch (e) {
    next(e);
  }
});

export default router;
