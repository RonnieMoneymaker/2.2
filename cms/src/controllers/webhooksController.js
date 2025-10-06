// Webhooks Controller - Handle incoming webhooks from platforms
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Handle Mollie webhook
export const handleMollieWebhook = async (payload) => {
  try {
    const webhookRecord = await prisma.webhook.create({
      data: {
        platform: 'mollie',
        event: payload.id ? 'payment.update' : 'unknown',
        payload: JSON.stringify(payload),
        processed: false
      }
    });
    
    // Get payment details from Mollie
    const integration = await prisma.integration.findFirst({
      where: { platform: 'mollie', isActive: true }
    });
    
    if (!integration) {
      throw new Error('Mollie integration not found');
    }
    
    const config = JSON.parse(integration.config);
    const response = await fetch(`https://api.mollie.com/v2/payments/${payload.id}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    const payment = await response.json();
    
    // Update order status based on payment
    if (payment.metadata && payment.metadata.orderId) {
      const orderId = parseInt(payment.metadata.orderId);
      
      let newStatus = 'pending';
      if (payment.status === 'paid') newStatus = 'processing';
      else if (payment.status === 'failed') newStatus = 'failed';
      else if (payment.status === 'canceled') newStatus = 'cancelled';
      else if (payment.status === 'expired') newStatus = 'cancelled';
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });
    }
    
    // Mark webhook as processed
    await prisma.webhook.update({
      where: { id: webhookRecord.id },
      data: { processed: true, processedAt: new Date() }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Mollie webhook error:', error);
    throw error;
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (payload, signature) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { platform: 'stripe', isActive: true }
    });
    
    if (!integration) {
      throw new Error('Stripe integration not found');
    }
    
    const webhookRecord = await prisma.webhook.create({
      data: {
        platform: 'stripe',
        event: payload.type || 'unknown',
        payload: JSON.stringify(payload),
        processed: false
      }
    });
    
    const config = JSON.parse(integration.config);
    
    // TODO: Verify Stripe signature
    // const stripe = require('stripe')(config.secretKey);
    // const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
    
    const event = payload;
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata && paymentIntent.metadata.orderId) {
          await prisma.order.update({
            where: { id: parseInt(paymentIntent.metadata.orderId) },
            data: { status: 'processing' }
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        if (failedIntent.metadata && failedIntent.metadata.orderId) {
          await prisma.order.update({
            where: { id: parseInt(failedIntent.metadata.orderId) },
            data: { status: 'failed' }
          });
        }
        break;
        
      case 'charge.refunded':
        const refund = event.data.object;
        if (refund.metadata && refund.metadata.orderId) {
          await prisma.order.update({
            where: { id: parseInt(refund.metadata.orderId) },
            data: { status: 'refunded' }
          });
        }
        break;
    }
    
    await prisma.webhook.update({
      where: { id: webhookRecord.id },
      data: { processed: true, processedAt: new Date() }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Stripe webhook error:', error);
    throw error;
  }
};

// Handle WooCommerce webhook
export const handleWooCommerceWebhook = async (topic, payload) => {
  try {
    const webhookRecord = await prisma.webhook.create({
      data: {
        platform: 'woocommerce',
        event: topic,
        payload: JSON.stringify(payload),
        processed: false
      }
    });
    
    const integration = await prisma.integration.findFirst({
      where: { platform: 'woocommerce', isActive: true }
    });
    
    if (!integration) {
      await prisma.webhook.update({
        where: { id: webhookRecord.id },
        data: { 
          processed: true, 
          processedAt: new Date(),
          errorMessage: 'WooCommerce integration not found'
        }
      });
      return { success: false, error: 'Integration not found' };
    }
    
    const websiteId = integration.websiteId;
    
    // Handle different topics
    switch (topic) {
      case 'order.created':
      case 'order.updated':
        await syncWooCommerceOrder(websiteId, payload);
        break;
        
      case 'product.created':
      case 'product.updated':
        await syncWooCommerceProduct(websiteId, payload);
        break;
    }
    
    await prisma.webhook.update({
      where: { id: webhookRecord.id },
      data: { processed: true, processedAt: new Date() }
    });
    
    return { success: true };
  } catch (error) {
    console.error('WooCommerce webhook error:', error);
    throw error;
  }
};

// Sync WooCommerce order
async function syncWooCommerceOrder(websiteId, wcOrder) {
  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: {
      websiteId,
      email: wcOrder.billing.email
    }
  });
  
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        websiteId,
        email: wcOrder.billing.email,
        firstName: wcOrder.billing.first_name,
        lastName: wcOrder.billing.last_name,
        phone: wcOrder.billing.phone,
        address: wcOrder.billing.address_1,
        city: wcOrder.billing.city,
        postalCode: wcOrder.billing.postcode,
        country: wcOrder.billing.country
      }
    });
  }
  
  // Check if order exists
  const existing = await prisma.order.findFirst({
    where: {
      websiteId,
      orderNumber: `WC-${wcOrder.id}`
    }
  });
  
  const orderData = {
    customerId: customer.id,
    status: mapWooCommerceStatus(wcOrder.status),
    totalCents: Math.round(parseFloat(wcOrder.total) * 100)
  };
  
  if (existing) {
    await prisma.order.update({
      where: { id: existing.id },
      data: orderData
    });
  } else {
    await prisma.order.create({
      data: {
        websiteId,
        orderNumber: `WC-${wcOrder.id}`,
        ...orderData
      }
    });
  }
}

// Sync WooCommerce product
async function syncWooCommerceProduct(websiteId, wcProduct) {
  const existing = await prisma.product.findFirst({
    where: {
      websiteId,
      sku: wcProduct.sku || `wc-${wcProduct.id}`
    }
  });
  
  const productData = {
    name: wcProduct.name,
    slug: wcProduct.slug,
    sku: wcProduct.sku || `wc-${wcProduct.id}`,
    description: wcProduct.description,
    priceCents: Math.round(parseFloat(wcProduct.price) * 100),
    stockQuantity: wcProduct.stock_quantity || 0,
    isActive: wcProduct.status === 'publish',
    images: JSON.stringify(wcProduct.images.map(img => img.src))
  };
  
  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: productData
    });
  } else {
    await prisma.product.create({
      data: {
        websiteId,
        ...productData
      }
    });
  }
}

// Map WooCommerce status to internal status
function mapWooCommerceStatus(wcStatus) {
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'on-hold': 'pending',
    'completed': 'delivered',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'failed': 'failed'
  };
  return statusMap[wcStatus] || 'pending';
}

// Get all webhooks
export const getAllWebhooks = async (params = {}) => {
  const { platform, processed, limit = 50 } = params;
  
  const where = {
    ...(platform && { platform }),
    ...(processed !== undefined && { processed: processed === 'true' })
  };
  
  return await prisma.webhook.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};
