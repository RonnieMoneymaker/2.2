import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Login from './pages/Login';
import Advertising from './pages/Advertising';
import Products from './pages/Products';
import ProfitAnalytics from './pages/ProfitAnalytics';
import CostManagement from './pages/CostManagement';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import ShippingTax from './pages/ShippingTax';
import ShippingRules from './pages/ShippingRules';
import SaaSDashboard from './pages/SaaSDashboard';
import PaymentProviders from './pages/PaymentProviders';
import GeographicMap from './pages/GeographicMap';
import CustomerLogin from './pages/CustomerLogin';
import CustomerPortal from './pages/CustomerPortal';
import AIInsights from './pages/AIInsights';
import APISettings from './pages/APISettings';
import './App.css';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (token: string, userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/products" element={<Products />} />
            <Route path="/advertising" element={<Advertising />} />
            <Route path="/costs" element={<CostManagement />} />
            <Route path="/shipping-tax" element={<ShippingTax />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/api-settings" element={<APISettings />} />
            <Route path="/settings" element={<APISettings />} />
            
            {/* Redirect old routes to new combined pages */}
            <Route path="/profit" element={<Navigate to="/analytics" replace />} />
            <Route path="/shipping-rules" element={<Navigate to="/shipping-tax" replace />} />
            <Route path="/payment-providers" element={<Navigate to="/costs" replace />} />
            <Route path="/saas-dashboard" element={<Navigate to="/ai-insights" replace />} />
            <Route path="/geographic-map" element={<GeographicMap />} />
            <Route path="/api-settings" element={<APISettings />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
        
        {/* Customer Portal Routes (separate from admin) */}
        <Routes>
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
