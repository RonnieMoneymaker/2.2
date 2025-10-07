import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Global search across all entities
router.get('/global', async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        products: [],
        customers: [],
        orders: [],
        categories: []
      });
    }

    const searchTerm = query.toLowerCase();

    const [products, customers, orders, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          websiteId: req.website.id,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          sku: true,
          priceCents: true,
          images: true
        }
      }),

      prisma.customer.findMany({
        where: {
          websiteId: req.website.id,
          OR: [
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { firstName: { contains: searchTerm, mode: 'insensitive' } },
            { lastName: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }),

      prisma.order.findMany({
        where: {
          websiteId: req.website.id,
          orderNumber: { contains: searchTerm, mode: 'insensitive' }
        },
        take: parseInt(limit),
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),

      prisma.category.findMany({
        where: {
          websiteId: req.website.id,
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          slug: true
        }
      })
    ]);

    res.json({
      products,
      customers,
      orders,
      categories,
      totalResults: products.length + customers.length + orders.length + categories.length
    });
  } catch (e) {
    next(e);
  }
});

// Advanced product filters
router.post('/products/advanced', async (req, res, next) => {
  try {
    const {
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      featured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.body;

    const skip = (page - 1) * limit;

    const where = {
      websiteId: req.website.id,
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(minPrice && { priceCents: { gte: parseInt(minPrice) * 100 } }),
      ...(maxPrice && { priceCents: { lte: parseInt(maxPrice) * 100 } }),
      ...(inStock && { stockQuantity: { gt: 0 } }),
      ...(lowStock && { stockQuantity: { lte: 5 } }),
      ...(featured !== undefined && { isFeatured: featured }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

// Advanced order filters
router.post('/orders/advanced', async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      minTotal,
      maxTotal,
      customerId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.body;

    const skip = (page - 1) * limit;

    const where = {
      websiteId: req.website.id,
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(customerId && { customerId: parseInt(customerId) }),
      ...(minTotal && { totalCents: { gte: parseInt(minTotal) * 100 } }),
      ...(maxTotal && { totalCents: { lte: parseInt(maxTotal) * 100 } }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) })
        }
      }),
      ...(search && { orderNumber: { contains: search, mode: 'insensitive' } })
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: true
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

// Advanced customer filters
router.post('/customers/advanced', async (req, res, next) => {
  try {
    const {
      country,
      city,
      minOrders,
      minSpent,
      hasOrders,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.body;

    const skip = (page - 1) * limit;

    const where = {
      websiteId: req.website.id,
      ...(country && { country }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          orders: {
            select: {
              id: true,
              totalCents: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        take: parseInt(limit),
        skip
      }),
      prisma.customer.count({ where })
    ]);

    // Post-filter by order count and spent (since we can't do this in SQL easily)
    let filteredCustomers = customers;

    if (minOrders || minSpent || hasOrders !== undefined) {
      filteredCustomers = customers.filter(customer => {
        const orderCount = customer.orders.length;
        const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalCents, 0);

        if (minOrders && orderCount < minOrders) return false;
        if (minSpent && totalSpent < minSpent * 100) return false;
        if (hasOrders !== undefined && (hasOrders ? orderCount === 0 : orderCount > 0)) return false;

        return true;
      });
    }

    res.json({
      customers: filteredCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    next(e);
  }
});

export default router;
