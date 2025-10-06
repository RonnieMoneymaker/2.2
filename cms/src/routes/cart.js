import { Router } from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// In-memory cart storage (in production use Redis or database sessions)
const carts = new Map();

// Get cart by session ID
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const cart = carts.get(sessionId) || { items: [], totals: {} };
    
    // Enrich with product data
    if (cart.items.length > 0) {
      const productIds = cart.items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true }
      });
      
      cart.items = cart.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            priceCents: product.priceCents,
            images: product.images,
            stockQuantity: product.stockQuantity
          } : null
        };
      });
      
      // Recalculate totals
      cart.totals = calculateTotals(cart.items);
    }
    
    res.json({ cart });
  } catch (e) {
    next(e);
  }
});

// Add item to cart
router.post('/:sessionId/items', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { productId, variantId, quantity = 1 } = req.body;
    
    // Verify product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });
    
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stockQuantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    // Get or create cart
    let cart = carts.get(sessionId) || { items: [], totals: {} };
    
    // Check if item already in cart
    const existingIndex = cart.items.findIndex(
      item => item.productId === productId && item.variantId === variantId
    );
    
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        variantId,
        quantity,
        priceCents: product.priceCents
      });
    }
    
    cart.totals = calculateTotals(cart.items);
    carts.set(sessionId, cart);
    
    res.json({ cart });
  } catch (e) {
    next(e);
  }
});

// Update cart item quantity
router.put('/:sessionId/items/:productId', async (req, res, next) => {
  try {
    const { sessionId, productId } = req.params;
    const { quantity } = req.body;
    
    let cart = carts.get(sessionId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === parseInt(productId));
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    cart.totals = calculateTotals(cart.items);
    carts.set(sessionId, cart);
    
    res.json({ cart });
  } catch (e) {
    next(e);
  }
});

// Remove item from cart
router.delete('/:sessionId/items/:productId', async (req, res, next) => {
  try {
    const { sessionId, productId } = req.params;
    
    let cart = carts.get(sessionId);
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = cart.items.filter(item => item.productId !== parseInt(productId));
    cart.totals = calculateTotals(cart.items);
    carts.set(sessionId, cart);
    
    res.json({ cart });
  } catch (e) {
    next(e);
  }
});

// Clear cart
router.delete('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    carts.delete(sessionId);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

// Helper function to calculate totals
function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const tax = Math.floor(subtotal * 0.21); // 21% BTW
  const total = subtotal + tax;
  
  return {
    subtotalCents: subtotal,
    taxCents: tax,
    totalCents: total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  };
}

// Checkout - Create order from cart
router.post('/:sessionId/checkout', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const {
      customer,
      shipping,
      billing,
      shippingMethodId,
      discountCode,
      paymentMethod = 'mollie'
    } = req.body;
    
    const cart = carts.get(sessionId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Get or create customer
    let customerRecord = await prisma.customer.findFirst({
      where: { email: customer.email }
    });
    
    if (!customerRecord) {
      // Get website
      const website = await prisma.website.findFirst();
      
      customerRecord = await prisma.customer.create({
        data: {
          websiteId: website.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone
        }
      });
    }
    
    // Get shipping method
    const shippingMethod = await prisma.shippingMethod.findUnique({
      where: { id: shippingMethodId }
    });
    
    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
    const shippingCost = shippingMethod.priceCents;
    const tax = Math.floor(subtotal * 0.21);
    let discount = 0;
    
    // Apply discount code
    if (discountCode) {
      const discountRecord = await prisma.discountCode.findFirst({
        where: {
          code: discountCode.toUpperCase(),
          isActive: true
        }
      });
      
      if (discountRecord) {
        if (discountRecord.type === 'percentage') {
          discount = Math.floor(subtotal * (discountRecord.value / 100));
        } else if (discountRecord.type === 'fixed_amount') {
          discount = discountRecord.value;
        }
        
        // Update usage count
        await prisma.discountCode.update({
          where: { id: discountRecord.id },
          data: { usageCount: { increment: 1 } }
        });
      }
    }
    
    const total = subtotal + shippingCost + tax - discount;
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;
    
    // Create order
    const order = await prisma.order.create({
      data: {
        websiteId: customerRecord.websiteId,
        customerId: customerRecord.id,
        orderNumber,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod,
        subtotalCents: subtotal,
        shippingCents: shippingCost,
        taxCents: tax,
        discountCents: discount,
        totalCents: total,
        shippingFirstName: shipping.firstName,
        shippingLastName: shipping.lastName,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingPostal: shipping.postalCode,
        shippingCountry: shipping.country,
        shippingPhone: shipping.phone,
        billingFirstName: billing.firstName,
        billingLastName: billing.lastName,
        billingAddress: billing.address,
        billingCity: billing.city,
        billingPostal: billing.postalCode,
        billingCountry: billing.country,
        billingEmail: billing.email
      }
    });
    
    // Create order items
    for (const item of cart.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitCents: item.priceCents,
          totalCents: item.priceCents * item.quantity,
          taxCents: Math.floor(item.priceCents * item.quantity * 0.21)
        }
      });
      
      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }
    
    // Create order status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'pending',
        note: 'Order created'
      }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        websiteId: customerRecord.websiteId,
        type: 'order_placed',
        title: 'New Order Received',
        message: `Order ${orderNumber} for €${(total / 100).toFixed(2)}`,
        link: `/orders/${order.id}`
      }
    });
    
    // Clear cart
    carts.delete(sessionId);
    
    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        status: order.status,
        paymentStatus: order.paymentStatus
      },
      paymentUrl: null // Would integrate with Mollie/Stripe here
    });
  } catch (e) {
    console.error('Checkout error:', e);
    next(e);
  }
});

export default router;
