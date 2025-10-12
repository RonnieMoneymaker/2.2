import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  ShoppingBag,
  Globe,
  Zap,
  Star,
  CreditCard,
  BarChart3,
  Target,
  Rocket,
  Euro
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';

interface SaaSMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  total_customers: number;
  new_customers_month: number;
  churned_customers: number;
  arpu: number; // Average Revenue Per User
  churn_rate: number;
  ltv: number; // Customer Lifetime Value
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  customers: number;
  mrr_contribution: number;
}

const SaaSDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SaaSMetrics | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // No mock SaaS metrics - all zeros
  const mockMetrics: SaaSMetrics = {
    mrr: 0,
    arr: 0,
    total_customers: 0,
    new_customers_month: 0,
    churned_customers: 0,
    arpu: 0,
    churn_rate: 0,
    ltv: 0
  };

  const mockPlans: SubscriptionPlan[] = [];

  const revenueGrowth: any[] = [];
  const integrationStats: any[] = [];

  useEffect(() => {
    setMetrics(mockMetrics);
    setPlans(mockPlans);
    setLoading(false);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <Layout title="SaaS Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="SaaS Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Rocket className="h-8 w-8 text-primary-600 mr-3" />
              🚀 CRM Platform - SaaS Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Verkoop je CRM systeem aan andere webshops - Monitor je SaaS business
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              🎯 MRR: {formatCurrency(metrics?.mrr || 0)}
            </div>
          </div>
        </div>

        {/* SaaS Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(metrics?.mrr || 0)}
            change={`+€2.340 deze maand (+23%)`}
            changeType="positive"
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Totaal Klanten"
            value={metrics?.total_customers || 0}
            change={`+${metrics?.new_customers_month || 0} nieuwe klanten`}
            changeType="positive"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Average Revenue Per User"
            value={formatCurrency(metrics?.arpu || 0)}
            change={`LTV: ${formatCurrency(metrics?.ltv || 0)}`}
            changeType="positive"
            icon={Target}
            color="purple"
          />
          <StatsCard
            title="Churn Rate"
            value={`${metrics?.churn_rate || 0}%`}
            change="Gezond onder 5%"
            changeType="positive"
            icon={TrendingUp}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MRR Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📈 MRR Groei (Laatste 12 maanden)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'mrr' ? formatCurrency(value) : value,
                    name === 'mrr' ? 'MRR' : name === 'customers' ? 'Klanten' : 'ARPU'
                  ]}
                />
                <Line type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Plan Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              💎 Plan Verdeling
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={plans as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, customers }: any) => `${name}: ${customers}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="customers"
                >
                  {plans.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Klanten']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Plans Performance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">💰 Subscription Plan Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prijs/Maand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klanten
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRR Bijdrage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % van Totaal MRR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ARPU
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan, index) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: colors[index] }}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                          {plan.name === 'Enterprise' && <div className="text-xs text-purple-600">⭐ Premium</div>}
                          {plan.name === 'Free Trial' && <div className="text-xs text-blue-600">🆓 Gratis</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.price_monthly === 0 ? 'Gratis' : formatCurrency(plan.price_monthly)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {plan.customers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      {formatCurrency(plan.mrr_contribution)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((plan.mrr_contribution / (metrics?.mrr || 1)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.customers > 0 ? formatCurrency(plan.mrr_contribution / plan.customers) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Integrations Marketplace */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            🔌 API Integrations Marketplace
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* E-commerce Platforms */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">E-commerce</h4>
                  <p className="text-sm text-gray-500">Platform koppelingen</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Shopify</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">67 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">WooCommerce</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">45 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Magento</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">23 actief</span>
                </div>
              </div>
            </div>

            {/* Payment Providers */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Payments</h4>
                  <p className="text-sm text-gray-500">Betaal providers</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Stripe</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">89 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mollie</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">76 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">PayPal</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">54 actief</span>
                </div>
              </div>
            </div>

            {/* Marketing Tools */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Marketing</h4>
                  <p className="text-sm text-gray-500">Marketing tools</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Google Ads</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">134 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Meta Ads</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">98 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mailchimp</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">67 actief</span>
                </div>
              </div>
            </div>

            {/* Analytics & Tools */}
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Analytics</h4>
                  <p className="text-sm text-gray-500">Data & rapportage</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Google Analytics</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">145 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hotjar</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">34 actief</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Klaviyo</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">23 actief</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            💰 SaaS Revenue Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(metrics?.mrr || 0)}
              </div>
              <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-xs text-gray-500">Voorspelbare maandelijkse inkomsten</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(metrics?.arr || 0)}
              </div>
              <p className="text-sm text-gray-600">Annual Recurring Revenue</p>
              <p className="text-xs text-gray-500">Jaarlijkse terugkerende omzet</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(metrics?.ltv || 0)}
              </div>
              <p className="text-sm text-gray-600">Customer Lifetime Value</p>
              <p className="text-xs text-gray-500">Gemiddelde waarde per klant</p>
            </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">🎯 SaaS Business Inzichten</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">🚀 GROEI STRATEGIE:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-sm"><strong>Professional plan promoten</strong> - Hoogste ARPU (€79/maand)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-sm"><strong>Free trial conversie</strong> - 45 trials → betaalde plannen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span className="text-sm"><strong>Enterprise upsells</strong> - Starter → Professional upgrades</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-2">💡 REVENUE KANSEN:</h4>
              <div className="space-y-2">
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-green-800">💰 MRR Potentieel: €18.675</p>
                  <p className="text-xs text-green-600">Als alle trials converteren naar Starter</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-blue-800">🎯 Upsell Kans: €4.450/maand</p>
                  <p className="text-xs text-blue-600">50% Starter → Professional upgrade</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-purple-800">🚀 API Add-ons: €2.980/maand</p>
                  <p className="text-xs text-purple-600">Premium integraties €15/maand extra</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-700">
              <strong>🎯 SaaS Conclusie:</strong> Je CRM platform genereert <strong>{formatCurrency(metrics?.mrr || 0)} MRR</strong> met gezonde groei. 
              Focus op trial conversie en Professional plan upsells kan MRR naar <strong>€25.000+</strong> brengen binnen 6 maanden.
            </p>
          </div>
        </div>

        {/* Payment Providers Integration Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">💳 Payment Providers Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900">Stripe</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">Creditcards, iDEAL, SEPA</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">89 webshops</span>
                  <span className="text-xs text-gray-500">2.9% + €0.25</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-orange-50">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                    <Euro className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900">Mollie</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">iDEAL, Bancontact, SOFORT</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">76 webshops</span>
                  <span className="text-xs text-gray-500">2.8% + €0.25</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-gray-900">PayPal</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">PayPal, PayPal Credit</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">54 webshops</span>
                  <span className="text-xs text-gray-500">3.4% + €0.35</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">💡 Payment Provider Voordelen voor Klanten:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Stripe:</strong> Beste voor internationale verkopen + subscriptions</li>
                <li>• <strong>Mollie:</strong> Specialist in Nederlandse/Europese betaalmethoden</li>
                <li>• <strong>PayPal:</strong> Vertrouwd door consumenten, hoge conversie</li>
                <li>• <strong>iDEAL:</strong> Must-have voor Nederlandse webshops (60% marktaandeel)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SaaSDashboard;
