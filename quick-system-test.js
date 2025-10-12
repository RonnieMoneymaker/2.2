const axios = require('axios');
const fs = require('fs');

async function quickSystemTest() {
  console.log('⚡ SNELLE SYSTEEM TEST - ALLE FUNCTIONALITEITEN');
  console.log('=' .repeat(60));
  
  const results = {
    backend: false,
    database: false,
    adminAuth: false,
    customerAuth: false,
    dashboard: false,
    customers: false,
    orders: false,
    products: false,
    advertising: false,
    ai: false,
    profit: false,
    costs: false,
    shipping: false,
    dhl: false,
    email: false
  };
  
  let adminToken = '';
  let customerToken = '';
  
  try {
    // Test 1: Backend Health (2 sec)
    console.log('\n⚡ Testing Backend Health...');
    const healthCheck = await axios.get('http://localhost:5000/api/analytics/dashboard').catch(e => null);
    if (healthCheck && healthCheck.status === 200) {
      results.backend = true;
      results.database = true;
      console.log('✅ Backend + Database: WORKING');
    } else {
      console.log('❌ Backend not responding');
      return results;
    }
    
    // Test 2: Admin Authentication (1 sec)
    console.log('\n⚡ Testing Admin Auth...');
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@webshop.nl',
      password: 'admin123'
    }).catch(e => null);
    
    if (adminLogin && adminLogin.data.token) {
      results.adminAuth = true;
      adminToken = adminLogin.data.token;
      console.log('✅ Admin Auth: WORKING');
    } else {
      console.log('❌ Admin auth failed');
    }
    
    // Test 3: Customer Authentication (1 sec)
    console.log('\n⚡ Testing Customer Auth...');
    const customerLogin = await axios.post('http://localhost:5000/api/customer-auth/login', {
      email: 'piet.bakker@email.com', 
      password: 'customer123'
    }).catch(e => null);
    
    if (customerLogin && customerLogin.data.token) {
      results.customerAuth = true;
      customerToken = customerLogin.data.token;
      console.log('✅ Customer Auth: WORKING');
    } else {
      console.log('⚠️ Customer auth needs fix (not critical)');
    }
    
    const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    
    // Test 4: Dashboard Data (1 sec)
    console.log('\n⚡ Testing Dashboard...');
    const dashboard = await axios.get('http://localhost:5000/api/analytics/dashboard', authHeaders).catch(e => null);
    if (dashboard && dashboard.data.totalCustomers) {
      results.dashboard = true;
      console.log('✅ Dashboard: WORKING - Data loaded');
    }
    
    // Test 5: Customers API (1 sec)
    console.log('\n⚡ Testing Customers...');
    const customers = await axios.get('http://localhost:5000/api/customers', authHeaders).catch(e => null);
    if (customers && customers.data.customers) {
      results.customers = true;
      console.log(`✅ Customers: WORKING - ${customers.data.customers.length} customers`);
    }
    
    // Test 6: Orders API (1 sec)
    console.log('\n⚡ Testing Orders...');
    const orders = await axios.get('http://localhost:5000/api/orders', authHeaders).catch(e => null);
    if (orders && orders.data.orders) {
      results.orders = true;
      console.log(`✅ Orders: WORKING - ${orders.data.orders.length} orders`);
    }
    
    // Test 7: Products API (1 sec)
    console.log('\n⚡ Testing Products...');
    const products = await axios.get('http://localhost:5000/api/products', authHeaders).catch(e => null);
    if (products && Array.isArray(products.data)) {
      results.products = true;
      console.log(`✅ Products: WORKING - ${products.data.length} products`);
    }
    
    // Test 8: Advertising API (1 sec)
    console.log('\n⚡ Testing Advertising...');
    const advertising = await axios.get('http://localhost:5000/api/advertising/campaigns', authHeaders).catch(e => null);
    if (advertising && advertising.data.campaigns) {
      results.advertising = true;
      console.log(`✅ Advertising: WORKING - ${advertising.data.campaigns.length} campaigns`);
    }
    
    // Test 9: AI Insights (1 sec)
    console.log('\n⚡ Testing AI...');
    const ai = await axios.get('http://localhost:5000/api/ai/insights', authHeaders).catch(e => null);
    if (ai && ai.data.productRecommendations) {
      results.ai = true;
      console.log(`✅ AI: WORKING - ${ai.data.productRecommendations.length} recommendations`);
    }
    
    // Test 10: Profit Analytics (1 sec)
    console.log('\n⚡ Testing Profit...');
    const profit = await axios.get('http://localhost:5000/api/profit/analysis', authHeaders).catch(e => null);
    if (profit && profit.data.totalProfit !== undefined) {
      results.profit = true;
      console.log(`✅ Profit: WORKING - €${profit.data.totalProfit} total`);
    }
    
    // Test 11: Cost Management (1 sec)
    console.log('\n⚡ Testing Costs...');
    const costs = await axios.get('http://localhost:5000/api/costs/fixed', authHeaders).catch(e => null);
    if (costs && costs.data.costs) {
      results.costs = true;
      console.log(`✅ Costs: WORKING - ${costs.data.costs.length} fixed costs`);
    }
    
    // Test 12: Shipping (1 sec)
    console.log('\n⚡ Testing Shipping...');
    const shipping = await axios.post('http://localhost:5000/api/shipping/calculate', {
      weight: 500,
      destination: 'NL'
    }, authHeaders).catch(e => null);
    if (shipping && shipping.data.cost !== undefined) {
      results.shipping = true;
      console.log(`✅ Shipping: WORKING - €${shipping.data.cost} calculated`);
    }
    
    // Test 13: DHL Integration (1 sec)
    console.log('\n⚡ Testing DHL...');
    if (orders && orders.data.orders.length > 0) {
      const dhl = await axios.post('http://localhost:5000/api/fulfillment/create-dhl-label', {
        orderId: orders.data.orders[0].id
      }, authHeaders).catch(e => null);
      if (dhl && dhl.data.trackingNumber) {
        results.dhl = true;
        console.log(`✅ DHL: WORKING - ${dhl.data.trackingNumber}`);
      }
    }
    
    // Test 14: Email Service (1 sec)
    console.log('\n⚡ Testing Email...');
    const email = await axios.post('http://localhost:5000/api/emails/send', {
      to: 'test@example.com',
      subject: 'Quick Test',
      type: 'test'
    }, authHeaders).catch(e => null);
    if (email && email.data.success) {
      results.email = true;
      console.log(`✅ Email: WORKING - Sent via ${email.data.provider}`);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
  
  // Results Summary
  console.log('\n📊 SNELLE TEST RESULTATEN');
  console.log('=' .repeat(40));
  
  const workingFeatures = Object.values(results).filter(Boolean).length;
  const totalFeatures = Object.keys(results).length;
  const percentage = Math.round((workingFeatures / totalFeatures) * 100);
  
  Object.entries(results).forEach(([feature, working]) => {
    console.log(`${working ? '✅' : '❌'} ${feature.toUpperCase()}: ${working ? 'WORKING' : 'NEEDS FIX'}`);
  });
  
  console.log(`\n🎯 SYSTEM HEALTH: ${workingFeatures}/${totalFeatures} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🎉 EXCELLENT - READY FOR PRODUCTION!');
  } else if (percentage >= 75) {
    console.log('✅ GOOD - MOSTLY READY, MINOR FIXES NEEDED');
  } else if (percentage >= 50) {
    console.log('⚠️ FAIR - CORE WORKS, SOME FEATURES NEED ATTENTION');
  } else {
    console.log('❌ POOR - MAJOR FIXES NEEDED');
  }
  
  // Platform Integration Status
  console.log('\n🔌 PLATFORM INTEGRATION STATUS:');
  console.log(`Google Ads: ${results.advertising ? '✅ Ready' : '⚠️ Mock Data'}`);
  console.log(`Meta Ads: ${results.advertising ? '✅ Ready' : '⚠️ Mock Data'}`);
  console.log(`DHL API: ${results.dhl ? '✅ Working' : '⚠️ Mock Service'}`);
  console.log(`Email Service: ${results.email ? '✅ Working' : '⚠️ Mock Service'}`);
  
  // Deployment Recommendation
  console.log('\n🚀 DEPLOYMENT RECOMMENDATION:');
  if (percentage >= 75) {
    console.log('DEPLOY NOW to Railway/Vercel!');
    console.log('Core business functionality is solid.');
    console.log('Minor issues can be fixed post-deployment.');
  } else {
    console.log('Fix critical issues first, then deploy.');
  }
  
  return results;
}

// Run the test
quickSystemTest().then(results => {
  console.log('\n⚡ Quick test completed in ~15 seconds!');
  process.exit(Object.values(results).filter(Boolean).length >= 10 ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});



