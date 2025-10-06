// Integrations Controller - Manages all platform integrations
import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// Get all integrations for a website
export const getAllIntegrations = async (websiteId) => {
  return await prisma.integration.findMany({
    where: { websiteId },
    include: {
      syncLogs: {
        take: 5,
        orderBy: { startedAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Get single integration
export const getIntegration = async (id, websiteId) => {
  return await prisma.integration.findFirst({
    where: { id, websiteId },
    include: {
      syncLogs: {
        take: 20,
        orderBy: { startedAt: 'desc' }
      },
      webhooks: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
};

// Create new integration
export const createIntegration = async (websiteId, data) => {
  const { platform, name, config } = data;
  
  return await prisma.integration.create({
    data: {
      websiteId,
      platform,
      name,
      config: JSON.stringify(config),
      isActive: true,
      syncStatus: 'idle'
    }
  });
};

// Update integration
export const updateIntegration = async (id, websiteId, data) => {
  const { name, config, isActive } = data;
  
  return await prisma.integration.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(config && { config: JSON.stringify(config) }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date()
    }
  });
};

// Delete integration
export const deleteIntegration = async (id, websiteId) => {
  return await prisma.integration.delete({
    where: { id }
  });
};

// Test integration connection
export const testConnection = async (id, websiteId) => {
  const integration = await prisma.integration.findFirst({
    where: { id, websiteId }
  });
  
  if (!integration) {
    throw new Error('Integration not found');
  }
  
  const config = JSON.parse(integration.config);
  
  // Test based on platform
  switch (integration.platform) {
    case 'woocommerce':
      return await testWooCommerceConnection(config);
    case 'shopify':
      return await testShopifyConnection(config);
    case 'crisp':
      return await testCrispConnection(config);
    case 'mollie':
      return await testMollieConnection(config);
    case 'stripe':
      return await testStripeConnection(config);
    default:
      return { success: true, message: 'Connection test not implemented for this platform' };
  }
};

// WooCommerce: Sync products
export const syncWooCommerceProducts = async (integrationId, websiteId) => {
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, websiteId }
  });
  
  if (!integration) throw new Error('Integration not found');
  
  const config = JSON.parse(integration.config);
  const { url, consumerKey, consumerSecret } = config;
  
  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      integrationId,
      direction: 'import',
      entity: 'products',
      status: 'started',
      startedAt: new Date()
    }
  });
  
  try {
    // Update integration status
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'syncing', lastSync: new Date() }
    });
    
    // Fetch products from WooCommerce
    const WooCommerceRestApi = await import('@woocommerce/woocommerce-rest-api');
    const api = new WooCommerceRestApi.default({
      url,
      consumerKey,
      consumerSecret,
      version: 'wc/v3'
    });
    
    const response = await api.get('products', { per_page: 100 });
    const products = response.data;
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const wcProduct of products) {
      try {
        // Check if product exists
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
        
        successCount++;
      } catch (err) {
        console.error(`Failed to sync product ${wcProduct.id}:`, err);
        failedCount++;
      }
    }
    
    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'completed',
        recordsTotal: products.length,
        recordsSuccess: successCount,
        recordsFailed: failedCount,
        completedAt: new Date()
      }
    });
    
    // Update integration
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'success', lastError: null }
    });
    
    return { success: true, imported: successCount, failed: failedCount };
    
  } catch (error) {
    // Update sync log with error
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      }
    });
    
    // Update integration
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'error', lastError: error.message }
    });
    
    throw error;
  }
};

// Shopify: Sync products
export const syncShopifyProducts = async (integrationId, websiteId) => {
  const integration = await prisma.integration.findFirst({
    where: { id: integrationId, websiteId }
  });
  
  if (!integration) throw new Error('Integration not found');
  
  const config = JSON.parse(integration.config);
  const { shopName, apiKey, password } = config;
  
  const syncLog = await prisma.syncLog.create({
    data: {
      integrationId,
      direction: 'import',
      entity: 'products',
      status: 'started',
      startedAt: new Date()
    }
  });
  
  try {
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'syncing', lastSync: new Date() }
    });
    
    // Fetch from Shopify
    const url = `https://${apiKey}:${password}@${shopName}.myshopify.com/admin/api/2024-01/products.json`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.errors || 'Failed to fetch Shopify products');
    
    const products = data.products;
    let successCount = 0;
    let failedCount = 0;
    
    for (const shopifyProduct of products) {
      try {
        const variant = shopifyProduct.variants[0];
        const existing = await prisma.product.findFirst({
          where: { websiteId, sku: variant.sku || `shopify-${variant.id}` }
        });
        
        const productData = {
          name: shopifyProduct.title,
          slug: shopifyProduct.handle,
          sku: variant.sku || `shopify-${variant.id}`,
          description: shopifyProduct.body_html,
          priceCents: Math.round(parseFloat(variant.price) * 100),
          stockQuantity: variant.inventory_quantity || 0,
          isActive: shopifyProduct.status === 'active',
          images: JSON.stringify(shopifyProduct.images.map(img => img.src))
        };
        
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data: productData });
        } else {
          await prisma.product.create({ data: { websiteId, ...productData } });
        }
        
        successCount++;
      } catch (err) {
        console.error(`Failed to sync Shopify product:`, err);
        failedCount++;
      }
    }
    
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'completed',
        recordsTotal: products.length,
        recordsSuccess: successCount,
        recordsFailed: failedCount,
        completedAt: new Date()
      }
    });
    
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'success', lastError: null }
    });
    
    return { success: true, imported: successCount, failed: failedCount };
    
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'failed', errorMessage: error.message, completedAt: new Date() }
    });
    
    await prisma.integration.update({
      where: { id: integrationId },
      data: { syncStatus: 'error', lastError: error.message }
    });
    
    throw error;
  }
};

// Test connection helpers
async function testWooCommerceConnection(config) {
  try {
    const WooCommerceRestApi = await import('@woocommerce/woocommerce-rest-api');
    const api = new WooCommerceRestApi.default({
      url: config.url,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: 'wc/v3'
    });
    await api.get('products', { per_page: 1 });
    return { success: true, message: 'Connection successful!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testShopifyConnection(config) {
  try {
    const { shopName, apiKey, password } = config;
    const url = `https://${apiKey}:${password}@${shopName}.myshopify.com/admin/api/2024-01/shop.json`;
    const response = await fetch(url);
    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    }
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testCrispConnection(config) {
  try {
    // Test Crisp API
    const { identifier, key } = config;
    const auth = Buffer.from(`${identifier}:${key}`).toString('base64');
    const response = await fetch('https://api.crisp.chat/v1/website', {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    }
    return { success: false, message: 'Invalid credentials' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testMollieConnection(config) {
  try {
    const response = await fetch('https://api.mollie.com/v2/methods', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    }
    return { success: false, message: 'Invalid API key' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function testStripeConnection(config) {
  try {
    const response = await fetch('https://api.stripe.com/v1/payment_methods', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${config.secretKey}` }
    });
    if (response.ok || response.status === 401) {
      return { success: response.ok, message: response.ok ? 'Connection successful!' : 'Invalid API key' };
    }
    return { success: false, message: 'Connection failed' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get all sync logs
export const getSyncLogs = async (integrationId, websiteId) => {
  return await prisma.syncLog.findMany({
    where: { integrationId },
    include: {
      integration: {
        select: { name: true, platform: true }
      }
    },
    orderBy: { startedAt: 'desc' },
    take: 50
  });
};

// Get all webhooks
export const getWebhooks = async (integrationId) => {
  return await prisma.webhook.findMany({
    where: { integrationId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
};
