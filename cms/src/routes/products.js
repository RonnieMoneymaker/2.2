import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();
const router = Router();

// List products (with pagination and optional search)
router.get('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = Math.min(parseInt(req.query.limit ?? '20', 10), 100);
    const search = (req.query.search ?? '').toString().trim();
    const skip = (page - 1) * limit;

    const where = {
      websiteId,
      isActive: true,
      ...(search ? { OR: [
        { name: { contains: search, mode: 'insensitive' }},
        { slug: { contains: search, mode: 'insensitive' }},
        { sku: { contains: search, mode: 'insensitive' }},
      ] } : {})
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.product.count({ where })
    ]);

    res.json({
      products: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (e) {
    next(e);
  }
});

// Create product
router.post('/', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { 
      name, slug, sku, description, shortDescription,
      priceCents, costCents, taxRate, shippingCostCents,
      comparePriceCents, currency, stockQuantity, 
      categoryId, images, weight, dimensions,
      lowStockThreshold, isFeatured, isActive,
      metaTitle, metaDescription
    } = req.body;
    
    // Bereken netto winst
    const price = priceCents ?? 0;
    const cost = costCents ?? 0;
    const shipping = shippingCostCents ?? 0;
    const tax = (price * ((taxRate ?? 21) / 100));
    const profitMarginCents = price - cost - shipping - Math.floor(tax);
    
    const product = await prisma.product.create({
      data: {
        websiteId,
        name,
        slug,
        sku,
        description,
        shortDescription,
        priceCents: price,
        costCents: cost,
        taxRate: taxRate ?? 21.0,
        shippingCostCents: shipping,
        profitMarginCents,
        comparePriceCents,
        currency: currency ?? 'EUR',
        stockQuantity: stockQuantity ?? 0,
        lowStockThreshold: lowStockThreshold ?? 5,
        categoryId: categoryId ?? null,
        images: images ?? null,
        weight,
        dimensions,
        isFeatured: isFeatured ?? false,
        isActive: isActive ?? true,
        metaTitle,
        metaDescription,
      }
    });
    res.status(201).json({ product });
  } catch (e) {
    next(e);
  }
});

// Update product
router.put('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id, 10);
    const data = req.body;
    
    // Ensure record belongs to this website
    const exists = await prisma.product.findFirst({ where: { id, websiteId } });
    if (!exists) return res.status(404).json({ error: 'Product niet gevonden' });
    
    // Herbereken netto winst als financiële velden worden geupdate
    if (data.priceCents !== undefined || data.costCents !== undefined || 
        data.shippingCostCents !== undefined || data.taxRate !== undefined) {
      const price = data.priceCents ?? exists.priceCents;
      const cost = data.costCents ?? exists.costCents ?? 0;
      const shipping = data.shippingCostCents ?? exists.shippingCostCents ?? 0;
      const taxRate = data.taxRate ?? exists.taxRate ?? 21;
      const tax = Math.floor(price * (taxRate / 100));
      data.profitMarginCents = price - cost - shipping - tax;
    }
    
    const product = await prisma.product.update({ where: { id }, data });
    res.json({ product });
  } catch (e) {
    next(e);
  }
});

// Soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const id = parseInt(req.params.id, 10);
    const exists = await prisma.product.findFirst({ where: { id, websiteId } });
    if (!exists) return res.status(404).json({ error: 'Product niet gevonden' });
    const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ product });
  } catch (e) {
    next(e);
  }
});

export default router;


