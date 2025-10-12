import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Store, Crown, Zap } from 'lucide-react';

interface Webshop {
  id: number;
  name: string;
  domain: string;
  subscription_plan: string;
  is_active: boolean;
  customers_count: number;
  monthly_revenue: number;
}

interface WebshopSwitcherProps {
  currentWebshop: Webshop | null;
  onWebshopChange: (webshop: Webshop) => void;
}

const WebshopSwitcher: React.FC<WebshopSwitcherProps> = ({ currentWebshop, onWebshopChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [webshops, setWebshops] = useState<Webshop[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchWebshops = async () => {
    try {
      const response = await fetch('/api/webshops');
      if (response.ok) {
        const data = await response.json();
        setWebshops(data.webshops || []);
        if (!currentWebshop && data.webshops.length > 0) {
          onWebshopChange(data.webshops[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching webshops:', error);
      // No mock data - keep empty
      setWebshops([]);
    }
  };

  useEffect(() => {
    fetchWebshops();
  }, []);

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'professional': return <Zap className="h-4 w-4 text-blue-600" />;
      case 'starter': return <Store className="h-4 w-4 text-green-600" />;
      default: return <Store className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'starter': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <div className="flex items-center space-x-2">
          {getPlanIcon(currentWebshop?.subscription_plan || 'starter')}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">
              {currentWebshop?.name || 'Selecteer Webshop'}
            </p>
            <p className="text-xs text-gray-500">
              {currentWebshop?.domain || 'Geen webshop geselecteerd'}
            </p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Jouw Webshops</h3>
            <p className="text-xs text-gray-500">Schakel tussen je verschillende webshops</p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {webshops.map((webshop) => (
              <button
                key={webshop.id}
                onClick={() => {
                  onWebshopChange(webshop);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${
                  currentWebshop?.id === webshop.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getPlanIcon(webshop.subscription_plan)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{webshop.name}</p>
                      <p className="text-xs text-gray-500">{webshop.domain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(webshop.subscription_plan)}`}>
                      {webshop.subscription_plan}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{webshop.customers_count} klanten</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  💰 {formatCurrency(webshop.monthly_revenue)}/maand omzet
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button 
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
            >
              <Plus className="h-4 w-4" />
              <span>Nieuwe Webshop Toevoegen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebshopSwitcher;
