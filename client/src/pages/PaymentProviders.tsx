import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Globe,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import Layout from '../components/Layout/Layout';

interface PaymentProvider {
  id: number;
  provider_name: string;
  provider_type: string;
  is_active: boolean;
  test_mode: boolean;
  monthly_volume: number;
  transaction_count: number;
  fees_paid: number;
  success_rate: number;
}

const PaymentProviders: React.FC = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // No mock payment providers - empty array
  const mockProviders: PaymentProvider[] = [];

  useEffect(() => {
    setProviders(mockProviders);
    setLoading(false);
  }, []);

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'stripe': return '💳';
      case 'mollie': return '🇳🇱';
      case 'paypal': return '💙';
      case 'adyen': return '🌍';
      default: return '💰';
    }
  };

  const getProviderColor = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'stripe': return 'from-blue-400 to-purple-600';
      case 'mollie': return 'from-orange-400 to-red-500';
      case 'paypal': return 'from-blue-600 to-blue-800';
      case 'adyen': return 'from-green-400 to-teal-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const availableProviders = [
    {
      name: 'Stripe',
      description: 'Wereldwijde betalingen, subscriptions, marketplace',
      features: ['Creditcards', 'iDEAL', 'SEPA', 'Apple Pay', 'Google Pay'],
      fees: '2.9% + €0.25 per transactie',
      setup_time: '5 minuten',
      countries: '40+ landen'
    },
    {
      name: 'Mollie',
      description: 'Nederlandse betaalspecialist',
      features: ['iDEAL', 'Bancontact', 'SOFORT', 'Creditcards'],
      fees: '2.8% + €0.25 per transactie',
      setup_time: '10 minuten',
      countries: 'Europa'
    },
    {
      name: 'PayPal',
      description: 'Vertrouwde wereldwijde betaalprovider',
      features: ['PayPal', 'PayPal Credit', 'Buy Now Pay Later'],
      fees: '3.4% + €0.35 per transactie',
      setup_time: '2 minuten',
      countries: 'Wereldwijd'
    },
    {
      name: 'Adyen',
      description: 'Enterprise payment platform',
      features: ['Alle betaalmethoden', 'Fraud protection', 'Reporting'],
      fees: 'Custom pricing',
      setup_time: '1-2 weken',
      countries: 'Wereldwijd'
    }
  ];

  if (loading) {
    return (
      <Layout title="Payment Providers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payment Providers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-8 w-8 text-primary-600 mr-3" />
              💳 Payment Providers
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Beheer betalingsproviders voor je webshops
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Provider Toevoegen
          </button>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Maandelijks Volume</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(providers.reduce((sum, p) => sum + p.monthly_volume, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Transacties</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {providers.reduce((sum, p) => sum + p.transaction_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Totale Fees</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(providers.reduce((sum, p) => sum + p.fees_paid, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Gem. Succes Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(providers.reduce((sum, p) => sum + p.success_rate, 0) / providers.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Providers */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actieve Payment Providers</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {providers.map((provider) => (
              <div key={provider.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getProviderColor(provider.provider_name)} flex items-center justify-center text-white text-lg`}>
                      {getProviderIcon(provider.provider_name)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{provider.provider_name}</h4>
                      <p className="text-sm text-gray-500 capitalize">{provider.provider_type.replace('_', ' ')}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {provider.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Actief
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactief
                            </>
                          )}
                        </span>
                        {provider.test_mode && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            🧪 Test Mode
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Volume</p>
                        <p className="font-bold text-gray-900">{formatCurrency(provider.monthly_volume)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Transacties</p>
                        <p className="font-bold text-gray-900">{provider.transaction_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fees</p>
                        <p className="font-bold text-red-600">{formatCurrency(provider.fees_paid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Succes Rate</p>
                        <p className={`font-bold ${provider.success_rate > 98 ? 'text-green-600' : provider.success_rate > 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {provider.success_rate}%
                        </p>
                      </div>
                    </div>
                    <button className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Settings className="h-4 w-4 mr-2" />
                      Configureren
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Providers Marketplace */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Globe className="h-5 w-5 text-blue-500 mr-2" />
            🛍️ Payment Provider Marketplace
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableProviders.map((provider) => (
              <div key={provider.name} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getProviderColor(provider.name)} flex items-center justify-center text-white text-lg`}>
                      {getProviderIcon(provider.name)}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                    <Zap className="h-4 w-4 mr-2" />
                    Activeren
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Ondersteunde Betaalmethoden:</h5>
                    <div className="flex flex-wrap gap-1">
                      {provider.features.map((feature, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Kosten</p>
                      <p className="font-medium text-gray-900">{provider.fees}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Setup Tijd</p>
                      <p className="font-medium text-gray-900">{provider.setup_time}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Landen</p>
                      <p className="font-medium text-gray-900">{provider.countries}</p>
                    </div>
                  </div>

                  {provider.name === 'Stripe' && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <Shield className="h-4 w-4 inline mr-1" />
                        <strong>Aanbevolen:</strong> Beste voor subscriptions en internationale verkopen
                      </p>
                    </div>
                  )}
                  
                  {provider.name === 'Mollie' && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <Globe className="h-4 w-4 inline mr-1" />
                        <strong>Nederlands:</strong> Specialist in lokale betaalmethoden
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Analytics */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">📊 Payment Analytics Inzichten</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">💡 OPTIMALISATIE KANSEN:</h4>
              <div className="space-y-2">
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-green-800">✅ Mollie presteert best</p>
                  <p className="text-xs text-green-600">99.4% succes rate - focus op iDEAL</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-yellow-800">⚡ PayPal fees hoog</p>
                  <p className="text-xs text-yellow-600">3.4% vs 2.8% - overweeg Stripe voor cards</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-blue-800">🌍 Adyen voor enterprise</p>
                  <p className="text-xs text-blue-600">Activeer voor klanten {'>'} €10k/maand</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-2">🎯 AANBEVELINGEN:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-sm"><strong>iDEAL als hoofdmethode</strong> - 60% Nederlandse voorkeur</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-sm"><strong>Stripe voor subscriptions</strong> - Beste recurring billing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-sm"><strong>PayPal voor vertrouwen</strong> - Hogere conversie</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-700">
              <strong>💳 Payment Conclusie:</strong> Je verwerkt <strong>{formatCurrency(providers.reduce((sum, p) => sum + p.monthly_volume, 0))}/maand</strong> via {providers.filter(p => p.is_active).length} providers. 
              Optimalisatie kan <strong>€50-100/maand</strong> aan fees besparen door slimmere routing.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentProviders;
