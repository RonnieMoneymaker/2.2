import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

export const getOrders = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { status, customerId, page = 1, limit = 50 } = req.query;

    const where = {
      websiteId,
      ...(status && { status }),
      ...(customerId && { customerId: Number(customerId) }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
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

export const getOrderById = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: Number(id), websiteId },
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

    res.json(order);
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { customerId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Bestelling moet minimaal 1 item bevatten' });
    }

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: Number(customerId), websiteId },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Klant niet gevonden' });
    }

    // Generate order number
    const orderCount = await prisma.order.count({ where: { websiteId } });
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    // Calculate total and validate products
    let totalCents = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: Number(item.productId), websiteId },
      });

      if (!product) {
        return res.status(404).json({ error: `Product ${item.productId} niet gevonden` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ 
          error: `Onvoldoende voorraad voor ${product.name}` 
        });
      }

      const itemTotal = product.priceCents * item.quantity;
      totalCents += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitCents: product.priceCents,
        totalCents: itemTotal,
      });
    }

    // Create order with items
    const order = await prisma.order.create({
      data: {
        websiteId,
        customerId: Number(customerId),
        orderNumber,
        totalCents,
        status: 'pending',
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update stock quantities
    for (const item of items) {
      await prisma.product.update({
        where: { id: Number(item.productId) },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Ongeldige status' });
    }

    const order = await prisma.order.findFirst({
      where: { id: Number(id), websiteId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const websiteId = req.website.id;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: Number(id), websiteId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Bestelling niet gevonden' });
    }

    // Restore stock quantities
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    await prisma.order.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Bestelling succesvol verwijderd' });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const websiteId = req.website.id;

    const [total, pending, processing, shipped, delivered, cancelled] = await Promise.all([
      prisma.order.count({ where: { websiteId } }),
      prisma.order.count({ where: { websiteId, status: 'pending' } }),
      prisma.order.count({ where: { websiteId, status: 'processing' } }),
      prisma.order.count({ where: { websiteId, status: 'shipped' } }),
      prisma.order.count({ where: { websiteId, status: 'delivered' } }),
      prisma.order.count({ where: { websiteId, status: 'cancelled' } }),
    ]);

    const revenue = await prisma.order.aggregate({
      where: { 
        websiteId, 
        status: { not: 'cancelled' } 
      },
      _sum: {
        totalCents: true,
      },
    });

    res.json({
      total,
      byStatus: {
        pending,
        processing,
        shipped,
        delivered,
        cancelled,
      },
      revenue: revenue._sum.totalCents || 0,
    });
  } catch (error) {
    next(error);
  }
};
