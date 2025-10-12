const axios = require('axios');

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API...');
  
  try {
    // Test without auth first
    const response = await axios.get('http://localhost:5000/api/analytics/dashboard');
    console.log('✅ Dashboard API works:', response.status);
    console.log('📊 Data received:', Object.keys(response.data));
  } catch (error) {
    console.log('❌ Dashboard API error:', error.response?.status || error.message);
    
    // Try with auth
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@webshop.nl',
        password: 'admin123'
      });
      
      const authResponse = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${loginResponse.data.token}` }
      });
      
      console.log('✅ Dashboard API works with auth:', authResponse.status);
      console.log('📊 Data received:', Object.keys(authResponse.data));
    } catch (authError) {
      console.log('❌ Auth error:', authError.response?.status || authError.message);
    }
  }
}

testDashboardAPI();



