import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShoppingBag, Euro, TrendingUp, Target, Eye, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import APIStatusIndicator from '../components/APIStatusIndicator';
import { analyticsApi } from '../services/api';
import { DashboardStats } from '../types';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        try {
          const [dashboardResponse, salesResponse] = await Promise.all([
            analyticsApi.getDashboard(),
            analyticsApi.getSalesOverTime({ period: '30', interval: 'day' })
          ]);
          
          setStats(dashboardResponse.data);
          setSalesData(salesResponse.data.data);
        } catch (apiError) {
          console.log('API not available - showing empty state');
          
          // No mock data - set everything to empty/zero
          setStats({
            totalCustomers: { count: 0 },
            newCustomersThisMonth: { count: 0 },
            totalOrders: { count: 0 },
            ordersThisMonth: { count: 0 },
            totalRevenue: { total: 0 },
            revenueThisMonth: { total: 0 },
            avgOrderValue: { avg: 0 },
            topCustomers: [],
            recentOrders: [],
            orderStatusDistribution: []
          });
          setSalesData([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod]);

  // No fake visitor data - keep at 0 unless real data is available
  // TODO: Fetch real visitor data from analytics API when connected

  // Removed generateMockDataForPeriod - no fake data anymore!

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Dashboard">
        <div className="text-center py-12">
          <p className="text-gray-500">Kon dashboard gegevens niet laden.</p>
        </div>
      </Layout>
    );
  }

  const statusColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getPeriodLabel = (period: string) => {
    const labels = {
      'today': 'Vandaag',
      'yesterday': 'Gister', 
      'week': 'Afgelopen week',
      'month': 'Afgelopen maand',
      'quarter': 'Afgelopen kwartaal',
      'year': 'Afgelopen jaar',
      'decade': 'Afgelopen decennium'
    };
    return labels[period as keyof typeof labels] || 'Onbekend';
  };

  return (
    <Layout title="Dashboard">
      <div className="space-y-4">
        {/* Header with Period Selector */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overzicht van {getPeriodLabel(selectedPeriod).toLowerCase()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Periode:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="today">📅 Vandaag</option>
              <option value="yesterday">⏮️ Gister</option>
              <option value="week">📊 Afgelopen week</option>
              <option value="month">📈 Afgelopen maand</option>
              <option value="quarter">📊 Afgelopen kwartaal</option>
              <option value="year">🗓️ Afgelopen jaar</option>
              <option value="decade">🏛️ Afgelopen decennium</option>
            </select>
          </div>
        </div>

        {/* API Status Indicator */}
        <div className="mb-4">
          <APIStatusIndicator />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={`Klanten ${getPeriodLabel(selectedPeriod)}`}
            value={stats.totalCustomers?.count || 0}
            change={selectedPeriod === 'today' ? 'Vandaag geregistreerd' : selectedPeriod === 'yesterday' ? 'Gister geregistreerd' : `+${stats.newCustomersThisMonth?.count || 0} nieuwe klanten`}
            changeType="positive"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title={`Bestellingen ${getPeriodLabel(selectedPeriod)}`}
            value={stats.totalOrders?.count || 0}
            change={selectedPeriod === 'today' ? 'Vandaag geplaatst' : selectedPeriod === 'yesterday' ? 'Gister geplaatst' : `${stats.ordersThisMonth?.count || 0} orders`}
            changeType="positive"
            icon={ShoppingBag}
            color="green"
          />
          <StatsCard
            title={`Omzet ${getPeriodLabel(selectedPeriod)}`}
            value={`€${(stats.totalRevenue?.total || 0).toFixed(2)}`}
            change={`Echte winst: €${((stats.totalRevenue?.total || 0) * 0.35).toFixed(2)}`}
            changeType="positive"
            icon={Euro}
            color="yellow"
          />
          <StatsCard
            title={`Netto Winst ${getPeriodLabel(selectedPeriod)}`}
            value={`€${((stats.totalRevenue?.total || 0) * 0.35).toFixed(2)}`}
            change={`Na alle kosten (${getPeriodLabel(selectedPeriod).toLowerCase()})`}
            changeType={(((stats.totalRevenue?.total || 0) * 0.35) > 0) ? "positive" : "negative"}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Uitgebreide Periode Vergelijking */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">📊 Periode Vergelijking - {getPeriodLabel(selectedPeriod)}</h3>
            <span className="text-sm text-gray-500">vs Vorige periode</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue?.total || 0)}
              </div>
              <p className="text-sm font-medium text-gray-900">Omzet (Excl. BTW)</p>
              <p className="text-xs text-gray-500">Live data</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(((stats.totalRevenue?.total || 0) * 0.21))}
              </div>
              <p className="text-sm font-medium text-gray-900">BTW Ontvangen</p>
              <p className="text-xs text-blue-600">21% van omzet</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(((stats.totalRevenue?.total || 0) * 0.35))}
              </div>
              <p className="text-sm font-medium text-gray-900">Bruto Winst</p>
              <p className="text-xs text-green-600">35% marge</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(((stats.totalRevenue?.total || 0) * 0.35) - ((stats.totalOrders?.count || 0) * 5.95))}
              </div>
              <p className="text-sm font-medium text-gray-900">Netto Winst</p>
              <p className="text-xs text-purple-600">Na alle kosten</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">📈 OMZET VERGELIJKING:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Huidige periode:</span>
                  <span className="font-bold text-green-600">{formatCurrency(stats.totalRevenue?.total || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vorige periode:</span>
                  <span className="font-medium text-gray-400">Geen data</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-gray-500">Verschil:</span>
                  <span className="font-medium text-gray-400">-</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-2">💰 WINST VERGELIJKING:</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Huidige winst:</span>
                  <span className="font-bold text-green-600">{formatCurrency(((stats.totalRevenue?.total || 0) * 0.35) - ((stats.totalOrders?.count || 0) * 5.95))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vorige winst:</span>
                  <span className="font-medium text-gray-400">Geen data</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-gray-500">Winst groei:</span>
                  <span className="font-medium text-gray-400">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Financieel Overzicht */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            💰 Complete Financiële Breakdown - {getPeriodLabel(selectedPeriod)}
          </h3>
          
          {/* Inkomsten */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 text-green-700">📈 INKOMSTEN</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  +€{(stats.totalRevenue?.total || 0).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">Totale Omzet</p>
                <p className="text-xs text-gray-500">Excl. BTW</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  +€{((stats.totalRevenue?.total || 0) * 0.21).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">BTW Ontvangen</p>
                <p className="text-xs text-gray-500">(21% van omzet)</p>
              </div>
            </div>
          </div>

          {/* Kosten */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 text-red-700">📉 KOSTEN</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  -€{((stats.totalRevenue?.total || 0) * 0.65).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">Inkoopkosten</p>
                <p className="text-xs text-gray-500">(65% van omzet)</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  -€{((stats.totalOrders?.count || 0) * 5.95).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">Verzendkosten</p>
                <p className="text-xs text-gray-500">(€5.95 × {stats.totalOrders?.count || 0} orders)</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  -€0
                </div>
                <p className="text-sm text-gray-600">Marketing Kosten</p>
                <p className="text-xs text-gray-500">(Google + Meta Ads)</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">
                  -€0
                </div>
                <p className="text-sm text-gray-600">Vaste Kosten</p>
                <p className="text-xs text-gray-500">(Huur, salaris, etc.)</p>
              </div>
            </div>
          </div>

          {/* Winst Berekening */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 text-green-700">💎 NETTO WINST BEREKENING</h4>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Totale Omzet (excl. BTW):</span>
                  <span className="font-medium text-green-600">+€{(stats.totalRevenue?.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inkoopkosten:</span>
                  <span className="font-medium text-red-600">-€{((stats.totalRevenue?.total || 0) * 0.65).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verzendkosten:</span>
                  <span className="font-medium text-orange-600">-€{((stats.totalOrders?.count || 0) * 5.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marketing kosten:</span>
                  <span className="font-medium text-purple-600">-€0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Vaste kosten:</span>
                  <span className="font-medium text-gray-600">-€0.00</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>NETTO WINST:</span>
                  <span className={`${((stats.totalRevenue?.total || 0) * 0.35 - ((stats.totalOrders?.count || 0) * 5.95)) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {((stats.totalRevenue?.total || 0) * 0.35 - ((stats.totalOrders?.count || 0) * 5.95)) > 0 ? '+' : ''}€{((stats.totalRevenue?.total || 0) * 0.35 - ((stats.totalOrders?.count || 0) * 5.95)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BTW Overzicht */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 text-blue-700">🧾 BTW OVERZICHT</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xl font-bold text-blue-600">
                  +€{((stats.totalRevenue?.total || 0) * 0.21).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">BTW Ontvangen</p>
                <p className="text-xs text-gray-500">(21% van klanten)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600">
                  -€0
                </div>
                <p className="text-sm text-gray-600">BTW Betaald</p>
                <p className="text-xs text-gray-500">(21% van kosten)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl font-bold text-green-600">
                  +€{(((stats.totalRevenue?.total || 0) * 0.21)).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">BTW Saldo</p>
                <p className="text-xs text-gray-500">(Naar belastingdienst)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Kosten Detail */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-purple-500 mr-2" />
            📢 Marketing Kosten Breakdown - {getPeriodLabel(selectedPeriod)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-400">
                -€0
              </div>
              <p className="text-sm text-gray-600">Google Ads</p>
              <p className="text-xs text-gray-500">Koppel Google Ads API</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-400">
                -€0
              </div>
              <p className="text-sm text-gray-600">Meta Ads</p>
              <p className="text-xs text-gray-500">Koppel Meta Ads API</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-400">
                -€0
              </div>
              <p className="text-sm text-gray-600">Totaal Marketing</p>
              <p className="text-xs text-gray-500">Alle advertising kanalen</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-medium text-gray-900">ROAS (Return on Ad Spend)</p>
                <p className="text-lg font-bold text-gray-400">
                  0.0x
                </p>
                <p className="text-xs text-gray-500">Koppel Google/Meta Ads API</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Marketing % van Omzet</p>
                <p className="text-lg font-bold text-gray-400">
                  0.0%
                </p>
                <p className="text-xs text-gray-500">Koppel advertising platforms</p>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Cost per Acquisition</p>
                <p className="text-lg font-bold text-gray-400">
                  €0
                </p>
                <p className="text-xs text-gray-500">Per nieuwe klant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Winst per Product */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">💎 Winst per Product</h3>
          <div className="text-center py-8">
            <p className="text-gray-400">Geen producten beschikbaar</p>
            <p className="text-sm text-gray-500 mt-2">Voeg producten toe via de Producten pagina</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📈 Verkopen Trend - {getPeriodLabel(selectedPeriod)}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: any) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value: any) => new Date(value).toLocaleDateString('nl-NL')}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `€${value.toFixed(2)}` : value,
                    name === 'revenue' ? 'Omzet' : 'Bestellingen'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Status Verdeling
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.orderStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {stats.orderStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers with Profit */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Klanten (naar winst)</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.topCustomers?.slice(0, 5).map((customer) => {
                const customerProfit = customer.total_spent * 0.35 - (customer.total_orders * 5.95);
                return (
                  <div 
                    key={customer.id} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {customer.first_name} {customer.last_name} →
                      </p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{customer.total_spent.toFixed(2)} omzet
                      </p>
                      <p className={`text-sm font-bold ${customerProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {customerProfit > 0 ? '+' : ''}€{customerProfit.toFixed(2)} winst
                      </p>
                      <p className="text-xs text-gray-400">
                        {customer.total_orders} bestellingen
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recente Bestellingen</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentOrders?.slice(0, 5).map((order) => {
                const orderProfit = order.total_amount * 0.35 - 5.95; // 35% marge minus verzendkosten
                return (
                  <div 
                    key={order.id} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-primary-600">
                        {order.order_number} →
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.first_name} {order.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{order.total_amount.toFixed(2)} omzet
                      </p>
                      <p className={`text-sm font-bold ${orderProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {orderProfit > 0 ? '+' : ''}€{orderProfit.toFixed(2)} winst
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
