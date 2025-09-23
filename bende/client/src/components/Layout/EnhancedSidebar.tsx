import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, ShoppingBag, Package, BarChart3, DollarSign, 
  TrendingUp, Target, Brain, Truck, CreditCard, MapPin, Rocket, 
  Zap, Globe, Settings, Radio, Eye, ChevronDown, ChevronRight 
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const EnhancedSidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [expandedSections, setExpandedSections] = React.useState<string[]>(['main']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const menuSections = [
    {
      id: 'main',
      title: '📊 Hoofdmenu',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home, badge: null },
        { name: 'Magic Live Map', href: '/magic-live-map', icon: Zap, badge: 'LIVE', badgeColor: 'bg-red-500 animate-pulse' }
      ]
    },
    {
      id: 'customers',
      title: '👥 Klanten & Orders',
      items: [
        { name: 'Klanten', href: '/customers', icon: Users },
        { name: 'Bestellingen', href: '/orders', icon: ShoppingBag },
        { name: 'Geografische Kaart', href: '/geographic-map', icon: MapPin }
      ]
    },
    {
      id: 'products',
      title: '🛍️ Producten & Winst',
      items: [
        { name: 'Producten', href: '/products', icon: Package },
        { name: 'Winst Analyse', href: '/profit', icon: TrendingUp },
        { name: 'Kosten Beheer', href: '/costs', icon: DollarSign }
      ]
    },
    {
      id: 'marketing',
      title: '🎯 Marketing & AI',
      items: [
        { name: 'Advertising', href: '/advertising', icon: Target },
        { name: 'AI Inzichten', href: '/ai-insights', icon: Brain, badge: 'SMART', badgeColor: 'bg-purple-500' }
      ]
    },
    {
      id: 'fulfillment',
      title: '🚚 Verzending & Logistiek',
      items: [
        { name: 'Verzending & BTW', href: '/shipping-tax', icon: Truck },
        { name: 'Verzendregels', href: '/shipping-rules', icon: Settings }
      ]
    },
    {
      id: 'business',
      title: '🏢 Business & SaaS',
      items: [
        { name: 'SaaS Dashboard', href: '/saas-dashboard', icon: Rocket },
        { name: 'Payment Providers', href: '/payment-providers', icon: CreditCard },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 }
      ]
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        {!isCollapsed ? (
          <div className="text-white font-bold text-lg">🚀 CRM Pro</div>
        ) : (
          <div className="text-white font-bold text-xl">🚀</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2 space-y-2">
        {menuSections.map((section) => (
          <div key={section.id}>
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span>{section.title}</span>
                {expandedSections.includes(section.id) ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </button>
            )}
            
            {(isCollapsed || expandedSections.includes(section.id)) && (
              <div className={`${!isCollapsed ? 'ml-4 mt-2' : ''} space-y-1`}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-500'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} mr-3 flex-shrink-0`} />
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${item.badgeColor || 'bg-indigo-500'}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 left-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Live Status Indicator */}
      {!isCollapsed && (
        <div className="absolute bottom-16 left-4 right-4">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Radio className="h-4 w-4 text-green-500 animate-pulse mr-2" />
                <span className="text-sm font-medium text-green-700">System Live</span>
              </div>
              <div className="text-xs text-green-600">
                All APIs Connected
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSidebar;
