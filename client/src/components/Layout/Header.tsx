import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  ChevronRight,
  Settings,
  Activity,
  Zap
} from 'lucide-react';
import WebshopSwitcher from '../WebshopSwitcher';

interface HeaderProps {
  title: string;
}

// Breadcrumb mapping voor betere navigatie
const breadcrumbMap: { [key: string]: string[] } = {
  '/': ['Dashboard'],
  '/analytics': ['Dashboard', 'Analytics & Winst'],
  '/products': ['E-commerce', 'Producten'],
  '/orders': ['E-commerce', 'Bestellingen'],
  '/customers': ['E-commerce', 'Klanten'],
  '/geographic-map': ['Business Intelligence', 'Live Kaart'],
  '/advertising': ['Business Intelligence', 'Marketing'],
  '/ai-insights': ['Business Intelligence', 'AI Insights'],
  '/costs': ['Financiën', 'Kosten Beheer'],
  '/shipping-tax': ['Operations', 'Verzending'],
  '/api-settings': ['Systeem', 'API Instellingen'],
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const location = useLocation();
  const [currentWebshop, setCurrentWebshop] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3); // Mock notifications

  // Get breadcrumb path
  const breadcrumbPath = breadcrumbMap[location.pathname] || [title];

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200/60 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left: Title and Breadcrumbs */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 mt-1">
                {breadcrumbPath.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
                    <span className={`text-sm ${
                      index === breadcrumbPath.length - 1 
                        ? 'text-blue-600 font-semibold' 
                        : 'text-gray-500'
                    }`}>
                      {crumb}
                    </span>
                  </div>
                ))}
              </nav>
            </div>
            <WebshopSwitcher 
              currentWebshop={currentWebshop}
              onWebshopChange={setCurrentWebshop}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Enhanced Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Zoek producten, klanten, bestellingen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-96 pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white sm:text-sm transition-all duration-200"
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded border">
                  Enter
                </kbd>
              </div>
            )}
          </div>
          
          {/* Action Icons */}
          <div className="flex items-center space-x-3">
            {/* System Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Activity className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
            
            {/* Notifications */}
            <button className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Profile Dropdown */}
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-gray-900">Admin</div>
                <div className="text-xs text-gray-500">Universal CRM</div>
              </div>
              <Settings className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </div>
            
            {/* Logout */}
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
              title="Uitloggen"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;