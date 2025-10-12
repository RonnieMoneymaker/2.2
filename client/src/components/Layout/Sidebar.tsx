import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  ShoppingBag,
  Home,
  Settings,
  Package,
  DollarSign,
  TrendingUp,
  Target,
  Brain,
  Truck,
  CreditCard,
  MapPin,
  Rocket,
  Zap
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Klanten', href: '/customers', icon: Users },
  { name: 'Bestellingen', href: '/orders', icon: ShoppingBag },
  { name: 'Producten', href: '/products', icon: Package },
  { name: 'Analytics & Winst', href: '/analytics', icon: BarChart3 },
  { name: 'Geografische Kaart', href: '/geographic-map', icon: MapPin },
  { name: 'Marketing', href: '/advertising', icon: Target },
  { name: 'Financiën', href: '/costs', icon: DollarSign },
  { name: 'Verzending', href: '/shipping-tax', icon: Truck },
  { name: 'Advanced', href: '/ai-insights', icon: Brain },
  { name: 'API Instellingen', href: '/api-settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col w-64 bg-gray-900">
      <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Webshop CRM</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Instellingen
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
