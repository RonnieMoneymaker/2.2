const googleAdsService = require('./services/googleAdsService');
const metaAdsService = require('./services/metaAdsService');
const realDhlService = require('./services/realDhlService');
const realEmailService = require('./services/realEmailService');

async function testPlatformIntegrations() {
  console.log('🧪 Testing Platform Integrations...\n');

  // Test Google Ads
  console.log('📊 Testing Google Ads Integration...');
  try {
    const googleCampaigns = await googleAdsService.getCampaigns();
    console.log(`✅ Google Ads: ${googleCampaigns.length} campaigns found`);
    console.log('   Sample campaign:', googleCampaigns[0]?.name || 'Mock data');
    
    const googleMetrics = await googleAdsService.getPerformanceMetrics();
    console.log(`   Metrics - Cost: €${googleMetrics.cost}, ROAS: ${googleMetrics.roas}`);
  } catch (error) {
    console.log('❌ Google Ads Error:', error.message);
  }

  console.log('\n📱 Testing Meta Ads Integration...');
  try {
    const metaCampaigns = await metaAdsService.getCampaigns();
    console.log(`✅ Meta Ads: ${metaCampaigns.length} campaigns found`);
    console.log('   Sample campaign:', metaCampaigns[0]?.name || 'Mock data');
    
    const metaMetrics = await metaAdsService.getPerformanceMetrics();
    console.log(`   Metrics - Cost: €${metaMetrics.cost}, ROAS: ${metaMetrics.roas}`);
  } catch (error) {
    console.log('❌ Meta Ads Error:', error.message);
  }

  console.log('\n📦 Testing DHL Integration...');
  try {
    const shipmentData = {
      sender: {
        name: 'Webshop Test',
        companyName: 'Test Webshop BV',
        street: 'Teststraat 123',
        city: 'Amsterdam',
        postalCode: '1012AB',
        countryCode: 'NL',
        email: 'test@webshop.nl',
        phone: '+31201234567'
      },
      receiver: {
        name: 'Test Klant',
        street: 'Klantenstraat 456',
        city: 'Utrecht',
        postalCode: '3511AB',
        countryCode: 'NL',
        email: 'klant@example.com',
        phone: '+31301234567'
      },
      packages: [{
        weight: 0.5,
        length: 20,
        width: 15,
        height: 10
      }],
      declaredValue: 99.99,
      description: 'Test product'
    };

    const shipmentResult = await realDhlService.createShipment(shipmentData);
    console.log(`✅ DHL: Shipment created - ${shipmentResult.trackingNumber}`);
    console.log(`   Cost: €${shipmentResult.cost}, Delivery: ${shipmentResult.estimatedDelivery}`);
    
    // Test tracking
    const trackingInfo = await realDhlService.trackShipment(shipmentResult.trackingNumber);
    console.log(`   Tracking: ${trackingInfo.statusDescription}`);
  } catch (error) {
    console.log('❌ DHL Error:', error.message);
  }

  console.log('\n📧 Testing Email Service...');
  try {
    const orderData = {
      customerEmail: 'test@example.com',
      customerName: 'Test Klant',
      orderNumber: 'TEST-001',
      orderDate: new Date().toISOString(),
      total: 99.99,
      items: [
        { name: 'Test Product', quantity: 1, price: 99.99 }
      ]
    };

    const emailResult = await realEmailService.sendOrderConfirmation(orderData);
    console.log(`✅ Email: Order confirmation sent via ${emailResult.provider}`);
    console.log(`   Success: ${emailResult.success}, Message ID: ${emailResult.messageId}`);

    const shippingData = {
      customerEmail: 'test@example.com',
      customerName: 'Test Klant',
      orderNumber: 'TEST-001',
      trackingNumber: '3S4ATEST123',
      estimatedDelivery: new Date(Date.now() + 24*60*60*1000).toISOString(),
      shippingMethod: 'DHL'
    };

    const shippingEmailResult = await realEmailService.sendShippingNotification(shippingData);
    console.log(`✅ Email: Shipping notification sent via ${shippingEmailResult.provider}`);
  } catch (error) {
    console.log('❌ Email Error:', error.message);
  }

  console.log('\n🎯 Testing Campaign Creation...');
  try {
    // Test Google Ads campaign creation
    const googleCampaignResult = await googleAdsService.createCampaign({
      name: 'Playwright Test Campaign',
      type: 'SEARCH',
      budgetId: 'test_budget',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    });
    console.log(`✅ Google Ads Campaign: ${googleCampaignResult.success ? 'Created' : 'Failed'}`);
    console.log(`   Message: ${googleCampaignResult.message || googleCampaignResult.error}`);

    // Test Meta Ads campaign creation
    const metaCampaignResult = await metaAdsService.createCampaign({
      name: 'Playwright Meta Test',
      objective: 'OUTCOME_SALES'
    });
    console.log(`✅ Meta Ads Campaign: ${metaCampaignResult.success ? 'Created' : 'Failed'}`);
    console.log(`   Message: ${metaCampaignResult.message || metaCampaignResult.error}`);
  } catch (error) {
    console.log('❌ Campaign Creation Error:', error.message);
  }

  console.log('\n📈 Integration Test Complete!');
  console.log('Note: Real API calls require proper credentials in .env file');
  console.log('Without credentials, mock data is used for development');
}

// Run the test
testPlatformIntegrations().catch(console.error);
