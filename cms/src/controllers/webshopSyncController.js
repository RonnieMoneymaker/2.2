import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get sync queue
export const getSyncQueue = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { status, entity, page = 1, limit = 50 } = req.query;

    const where = {
      websiteId,
      ...(status && { status }),
      ...(entity && { entity }),
    };

    const [items, total] = await Promise.all([
      prisma.syncQueue.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.syncQueue.count({ where }),
    ]);

    res.json({
      items,
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

// Queue product for sync
export const queueProductSync = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { productId, action = 'update' } = req.body;

    const product = await prisma.product.findFirst({
      where: { id: Number(productId), websiteId },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product niet gevonden' });
    }

    const queueItem = await prisma.syncQueue.create({
      data: {
        websiteId,
        entity: 'product',
        entityId: product.id,
        action,
        status: 'pending',
        payload: JSON.stringify(product),
      },
    });

    res.status(201).json(queueItem);
  } catch (error) {
    next(error);
  }
};

// Queue order for sync
export const queueOrderSync = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { orderId, action = 'update' } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: Number(orderId), websiteId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }

    const queueItem = await prisma.syncQueue.create({
      data: {
        websiteId,
        entity: 'order',
        entityId: order.id,
        action,
        status: 'pending',
        payload: JSON.stringify(order),
      },
    });

    res.status(201).json(queueItem);
  } catch (error) {
    next(error);
  }
};

// Process sync queue (manually trigger)
export const processSyncQueue = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { limit = 10 } = req.query;

    const pendingItems = await prisma.syncQueue.findMany({
      where: {
        websiteId,
        status: 'pending',
      },
      take: Number(limit),
      orderBy: { createdAt: 'asc' },
    });

    if (pendingItems.length === 0) {
      return res.json({ message: 'Geen items in de sync queue', processed: 0 });
    }

    const results = {
      success: 0,
      failed: 0,
      items: [],
    };

    for (const item of pendingItems) {
      try {
        // Update status to processing
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: { status: 'processing' },
        });

        // Hier zou je de synchronisatie logica implementeren
        // Voor nu: simuleer een sync met 90% success rate
        const success = Math.random() > 0.1;

        if (success) {
          await prisma.syncQueue.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              processedAt: new Date(),
            },
          });
          results.success++;
        } else {
          throw new Error('Sync failed (simulated)');
        }

        results.items.push({
          id: item.id,
          entity: item.entity,
          entityId: item.entityId,
          status: 'success',
        });
      } catch (error) {
        await prisma.syncQueue.update({
          where: { id: item.id },
          data: {
            status: 'failed',
            attempts: { increment: 1 },
            lastError: error.message,
          },
        });
        results.failed++;
        results.items.push({
          id: item.id,
          entity: item.entity,
          entityId: item.entityId,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.json({
      message: `${results.success} items succesvol gesynchroniseerd, ${results.failed} mislukt`,
      ...results,
    });
  } catch (error) {
    next(error);
  }
};

// Retry failed sync items
export const retryFailedSync = async (req, res, next) => {
  try {
    const websiteId = req.website.id;

    const updated = await prisma.syncQueue.updateMany({
      where: {
        websiteId,
        status: 'failed',
        attempts: { lt: 3 }, // Max 3 attempts
      },
      data: {
        status: 'pending',
        lastError: null,
      },
    });

    res.json({
      message: `${updated.count} items opnieuw in queue geplaatst`,
      count: updated.count,
    });
  } catch (error) {
    next(error);
  }
};

// Clear completed items
export const clearCompleted = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { olderThan = 7 } = req.query; // Days

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(olderThan));

    const deleted = await prisma.syncQueue.deleteMany({
      where: {
        websiteId,
        status: 'completed',
        processedAt: {
          lt: cutoffDate,
        },
      },
    });

    res.json({
      message: `${deleted.count} voltooide items verwijderd`,
      count: deleted.count,
    });
  } catch (error) {
    next(error);
  }
};

// Webshop API: Receive product from external webshop
export const receiveProduct = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const productData = req.body;

    // Check if product exists (by external ID or SKU)
    let product;
    if (productData.externalId) {
      product = await prisma.product.findFirst({
        where: {
          websiteId,
          sku: productData.externalId,
        },
      });
    }

    if (product) {
      // Update existing product
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          name: productData.name,
          description: productData.description,
          priceCents: productData.priceCents || productData.price * 100,
          stockQuantity: productData.stockQuantity || productData.stock,
          isActive: productData.isActive !== false,
          // Add more fields as needed
        },
      });
    } else {
      // Create new product
      product = await prisma.product.create({
        data: {
          websiteId,
          name: productData.name,
          slug: productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
          sku: productData.externalId || `WS-${Date.now()}`,
          description: productData.description,
          priceCents: productData.priceCents || productData.price * 100,
          stockQuantity: productData.stockQuantity || productData.stock || 0,
          isActive: productData.isActive !== false,
        },
      });
    }

    res.json({
      success: true,
      product,
      action: product ? 'updated' : 'created',
    });
  } catch (error) {
    next(error);
  }
};

// Webshop API: Receive order from external webshop
export const receiveOrder = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const orderData = req.body;

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        websiteId,
        email: orderData.customer.email,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          websiteId,
          email: orderData.customer.email,
          firstName: orderData.customer.firstName || '',
          lastName: orderData.customer.lastName || '',
          phone: orderData.customer.phone,
          address: orderData.customer.address,
          city: orderData.customer.city,
          postalCode: orderData.customer.postalCode,
          country: orderData.customer.country || 'Nederland',
        },
      });
    }

    // Check if order already exists
    let order = await prisma.order.findFirst({
      where: {
        websiteId,
        orderNumber: orderData.orderNumber,
      },
    });

    if (order) {
      return res.json({
        success: true,
        order,
        action: 'already_exists',
      });
    }

    // Create order
    order = await prisma.order.create({
      data: {
        websiteId,
        customerId: customer.id,
        orderNumber: orderData.orderNumber,
        status: orderData.status || 'pending',
        paymentStatus: orderData.paymentStatus || 'unpaid',
        paymentMethod: orderData.paymentMethod,
        subtotalCents: orderData.subtotalCents || 0,
        shippingCents: orderData.shippingCents || 0,
        taxCents: orderData.taxCents || 0,
        totalCents: orderData.totalCents,
        shippingFirstName: orderData.shipping?.firstName,
        shippingLastName: orderData.shipping?.lastName,
        shippingAddress: orderData.shipping?.address,
        shippingCity: orderData.shipping?.city,
        shippingPostal: orderData.shipping?.postalCode,
        shippingCountry: orderData.shipping?.country,
      },
    });

    res.status(201).json({
      success: true,
      order,
      action: 'created',
    });
  } catch (error) {
    next(error);
  }
};
