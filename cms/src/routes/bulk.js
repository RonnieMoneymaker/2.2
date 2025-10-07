import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Bulk update products
router.post('/products/update', async (req, res, next) => {
  try {
    const { productIds, updates } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        websiteId: req.website.id
      },
      data: updates
    });

    res.json({ 
      success: true, 
      updated: result.count,
      message: `${result.count} producten bijgewerkt`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk delete products
router.post('/products/delete', async (req, res, next) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    const result = await prisma.product.deleteMany({
      where: {
        id: { in: productIds },
        websiteId: req.website.id
      }
    });

    res.json({ 
      success: true, 
      deleted: result.count,
      message: `${result.count} producten verwijderd`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk update order status
router.post('/orders/update-status', async (req, res, next) => {
  try {
    const { orderIds, status } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'orderIds array is required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Update orders
    const result = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
        websiteId: req.website.id
      },
      data: { status }
    });

    // Create status history for each order
    for (const orderId of orderIds) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note: 'Bulk status update'
        }
      });
    }

    res.json({ 
      success: true, 
      updated: result.count,
      message: `${result.count} bestellingen bijgewerkt naar ${status}`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk export
router.post('/export', async (req, res, next) => {
  try {
    const { type, filters } = req.body;
    
    let data = [];
    
    switch (type) {
      case 'products':
        data = await prisma.product.findMany({
          where: {
            websiteId: req.website.id,
            ...filters
          },
          include: {
            category: true
          }
        });
        break;
        
      case 'orders':
        data = await prisma.order.findMany({
          where: {
            websiteId: req.website.id,
            ...filters
          },
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        });
        break;
        
      case 'customers':
        data = await prisma.customer.findMany({
          where: {
            websiteId: req.website.id,
            ...filters
          }
        });
        break;
    }

    res.json({ 
      success: true, 
      data,
      count: data.length,
      message: `${data.length} items geëxporteerd`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk import products
router.post('/products/import', async (req, res, next) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'products array is required' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    for (const productData of products) {
      try {
        const existing = productData.sku ? await prisma.product.findFirst({
          where: {
            websiteId: req.website.id,
            sku: productData.sku
          }
        }) : null;

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              ...productData,
              websiteId: req.website.id
            }
          });
          results.updated++;
        } else {
          await prisma.product.create({
            data: {
              ...productData,
              websiteId: req.website.id,
              slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-')
            }
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          product: productData.name || productData.sku,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      results,
      message: `Import voltooid: ${results.created} aangemaakt, ${results.updated} bijgewerkt, ${results.errors.length} errors`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk update stock
router.post('/products/update-stock', async (req, res, next) => {
  try {
    const { updates } = req.body; // [{ productId, stockQuantity }]
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates array is required' });
    }

    let updated = 0;

    for (const update of updates) {
      await prisma.product.update({
        where: {
          id: update.productId
        },
        data: {
          stockQuantity: update.stockQuantity
        }
      });
      updated++;
    }

    res.json({ 
      success: true, 
      updated,
      message: `${updated} producten voorraad bijgewerkt`
    });
  } catch (e) {
    next(e);
  }
});

// Bulk pricing update
router.post('/products/update-pricing', async (req, res, next) => {
  try {
    const { productIds, priceAdjustment } = req.body;
    // priceAdjustment: { type: 'percentage'|'fixed', value: number }
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'productIds array is required' });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        websiteId: req.website.id
      }
    });

    let updated = 0;

    for (const product of products) {
      let newPrice = product.priceCents;
      
      if (priceAdjustment.type === 'percentage') {
        newPrice = Math.round(product.priceCents * (1 + priceAdjustment.value / 100));
      } else if (priceAdjustment.type === 'fixed') {
        newPrice = product.priceCents + Math.round(priceAdjustment.value * 100);
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { priceCents: newPrice }
      });
      updated++;
    }

    res.json({ 
      success: true, 
      updated,
      message: `${updated} producten prijzen bijgewerkt`
    });
  } catch (e) {
    next(e);
  }
});

export default router;
