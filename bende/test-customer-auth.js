const axios = require('axios');

async function testCustomerAuth() {
  console.log('🧪 Testing Customer Authentication...');
  
  try {
    // Test customer login
    const response = await axios.post('http://localhost:5000/api/customer-auth/login', {
      email: 'piet.bakker@email.com',
      password: 'customer123'
    });
    
    console.log('✅ Customer login successful');
    console.log('Customer:', response.data.customer);
    console.log('Token:', response.data.token ? 'Generated' : 'Missing');
    
    // Test customer portal access
    const portalResponse = await axios.get('http://localhost:5000/api/customer-portal/profile', {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });
    
    console.log('✅ Customer portal access works');
    console.log('Customer profile:', portalResponse.data.customer.first_name);
    
  } catch (error) {
    console.log('❌ Customer auth error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('❌ Customer auth route not found - need to add route to server');
    } else if (error.response?.status === 401) {
      console.log('❌ Invalid customer credentials');
    }
  }
}

testCustomerAuth();



