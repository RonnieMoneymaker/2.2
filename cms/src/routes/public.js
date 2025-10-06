import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get website by domain (helper)
async function getWebsiteByDomain(req) {
  const domain = req.headers.origin || req.headers.host || 'voltmover.nl';
  let website = await prisma.website.findFirst({
    where: { 
      OR: [
        { domain: { contains: domain } },
        { domain: 'voltmover.nl' } // fallback
      ]
    }
  });
  
  if (!website) {
    website = await prisma.website.findFirst(); // fallback to first
  }
  
  return website;
}

// PUBLIC ROUTES - NO AUTHENTICATION REQUIRED

// Get all products (for webshop)
router.get('/products', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const { category, search, featured, page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;
    
    const where = {
      websiteId: website.id,
      isActive: true,
      ...(category && { categoryId: parseInt(category) }),
      ...(featured && { isFeatured: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };
    
    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { priceCents: 'asc' };
    if (sort === 'price_desc') orderBy = { priceCents: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { where: { isActive: true } },
          reviews: { where: { isApproved: true }, select: { rating: true } }
        },
        orderBy,
        take: parseInt(limit),
        skip
      }),
      prisma.product.count({ where })
    ]);
    
    // Calculate average rating
    const productsWithRatings = products.map(p => {
      const avgRating = p.reviews.length > 0 
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length 
        : 0;
      return {
        ...p,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: p.reviews.length,
        reviews: undefined // Don't send full reviews
      };
    });
    
    res.json({
      products: productsWithRatings,
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

// Get single product by slug
router.get('/products/:slug', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const product = await prisma.product.findFirst({
      where: {
        websiteId: website.id,
        slug: req.params.slug,
        isActive: true
      },
      include: {
        category: true,
        variants: { where: { isActive: true } },
        attributes: true,
        reviews: {
          where: { isApproved: true },
          include: {
            customer: {
              select: { firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;
    
    res.json({
      ...product,
      averageRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length
    });
  } catch (e) {
    next(e);
  }
});

// Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const categories = await prisma.category.findMany({
      where: { websiteId: website.id },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

// Get featured products
router.get('/featured', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const products = await prisma.product.findMany({
      where: {
        websiteId: website.id,
        isActive: true,
        isFeatured: true
      },
      include: {
        category: true,
        reviews: { where: { isApproved: true }, select: { rating: true } }
      },
      take: 10
    });
    
    const productsWithRatings = products.map(p => {
      const avgRating = p.reviews.length > 0
        ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
        : 0;
      return {
        ...p,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: p.reviews.length,
        reviews: undefined
      };
    });
    
    res.json({ products: productsWithRatings });
  } catch (e) {
    next(e);
  }
});

// Get shipping methods
router.get('/shipping-methods', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const { country = 'NL' } = req.query;
    
    const methods = await prisma.shippingMethod.findMany({
      where: {
        websiteId: website.id,
        isActive: true
      },
      include: {
        zones: {
          where: { country }
        }
      }
    });
    
    const methodsWithCosts = methods.map(m => {
      const zone = m.zones[0];
      const totalCost = m.priceCents + (zone ? zone.additionalCents : 0);
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        priceCents: totalCost,
        isFree: m.isFree,
        freeAbove: m.freeAbove,
        estimatedDays: m.minDays && m.maxDays ? `${m.minDays}-${m.maxDays}` : null
      };
    });
    
    res.json({ shippingMethods: methodsWithCosts });
  } catch (e) {
    next(e);
  }
});

// Validate discount code
router.post('/discount/validate', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const { code, orderTotal } = req.body;
    
    const discount = await prisma.discountCode.findFirst({
      where: {
        websiteId: website.id,
        code: code.toUpperCase(),
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ],
        OR: [
          { usageLimit: null },
          { usageCount: { lt: prisma.raw('usageLimit') } }
        ]
      }
    });
    
    if (!discount) {
      return res.status(404).json({ error: 'Invalid or expired discount code' });
    }
    
    // Check minimum order value
    if (discount.minOrderCents && orderTotal < discount.minOrderCents) {
      return res.status(400).json({ 
        error: `Minimum order value of €${(discount.minOrderCents / 100).toFixed(2)} required` 
      });
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = Math.floor(orderTotal * (discount.value / 100));
      if (discount.maxDiscountCents) {
        discountAmount = Math.min(discountAmount, discount.maxDiscountCents);
      }
    } else if (discount.type === 'fixed_amount') {
      discountAmount = discount.value;
    }
    
    res.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      discountAmount,
      description: discount.type === 'free_shipping' ? 'Free shipping' : `€${(discountAmount / 100).toFixed(2)} off`
    });
  } catch (e) {
    next(e);
  }
});

// Get tax rate for country
router.get('/tax-rate', async (req, res, next) => {
  try {
    const website = await getWebsiteByDomain(req);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const { country = 'NL' } = req.query;
    
    const taxRate = await prisma.taxRate.findFirst({
      where: {
        websiteId: website.id,
        country,
        isActive: true
      }
    });
    
    res.json({
      taxRate: taxRate ? taxRate.rate : 21.0, // Default to 21% if not found
      name: taxRate ? taxRate.name : 'BTW'
    });
  } catch (e) {
    next(e);
  }
});

export default router;
