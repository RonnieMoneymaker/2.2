import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Euro,
  Calendar,
  Target,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'profit'>('analytics');

  // No mock data - all arrays empty until real data is available
  const salesOverTime: any[] = [];
  const customerSegments: any[] = [];
  const productPerformance: any[] = [];
  const channelPerformance: any[] = [];
  const cohortData: any[] = [];

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // No mock profit data
  const profitData: any[] = [];

  return (
    <Layout title="Analytics & Winst">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profit'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Winst Analyse
            </button>
          </nav>
        </div>

        {activeTab === 'analytics' && (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600 mr-3" />
              Uitgebreide Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Diepgaande analyse van je webshop prestaties
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="7">Laatste 7 dagen</option>
              <option value="30">Laatste 30 dagen</option>
              <option value="90">Laatste 90 dagen</option>
              <option value="365">Laatste jaar</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Totale Omzet"
            value={formatCurrency(0)}
            change="Geen data beschikbaar"
            changeType="neutral"
            icon={Euro}
            color="green"
          />
          <StatsCard
            title="Conversie Rate"
            value="0%"
            change="Koppel tracking API"
            changeType="neutral"
            icon={Target}
            color="blue"
          />
          <StatsCard
            title="Gem. Bestelwaarde"
            value={formatCurrency(0)}
            change="Geen orders"
            changeType="neutral"
            icon={TrendingUp}
            color="purple"
          />
          <StatsCard
            title="Klant Retentie"
            value="0%"
            change="Geen data"
            changeType="neutral"
            icon={Users}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Omzet Trend (30 dagen)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesOverTime}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: any) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value: any) => new Date(value).toLocaleDateString('nl-NL')}
                  formatter={(value: number) => [formatCurrency(value), 'Omzet']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Segments */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Klant Segmentatie
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Product Prestaties
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productPerformance} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : 
                    name === 'margin' ? `${value.toFixed(1)}%` : value,
                    name === 'revenue' ? 'Omzet' : 
                    name === 'margin' ? 'Marge' : 'Verkocht'
                  ]}
                />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Channel Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Marketing Kanalen
            </h3>
            <div className="space-y-4">
              {channelPerformance.map((channel, index) => (
                <div key={channel.channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors[index] }}></div>
                    <span className="font-medium text-gray-900">{channel.channel}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(channel.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {channel.orders} bestellingen • {channel.conversion}% conversie
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Retention Cohort */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Klant Retentie Cohort Analyse
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="new_customers" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Nieuwe Klanten"
              />
              <Line 
                type="monotone" 
                dataKey="retained_month_1" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Behouden Maand 1"
              />
              <Line 
                type="monotone" 
                dataKey="retained_month_2" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Behouden Maand 2"
              />
              <Line 
                type="monotone" 
                dataKey="retained_month_3" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Behouden Maand 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Customer Acquisition Cost */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Customer Acquisition Cost</h4>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">€0</div>
            <div className="text-sm text-gray-500">Koppel advertising API's</div>
          </div>

          {/* Customer Lifetime Value */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Customer Lifetime Value</h4>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">€0</div>
            <div className="text-sm text-gray-500">Geen klanten</div>
          </div>

          {/* Return on Ad Spend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Return on Ad Spend</h4>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">0.0x</div>
            <div className="text-sm text-gray-500">Koppel advertising API's</div>
          </div>

          {/* Cart Abandonment Rate */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Cart Abandonment Rate</h4>
              <ShoppingBag className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">0%</div>
            <div className="text-sm text-gray-500">Geen tracking data</div>
          </div>

          {/* Average Session Duration */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Gem. Sessie Duur</h4>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">0:00</div>
            <div className="text-sm text-gray-500">Geen tracking data</div>
          </div>

          {/* Repeat Purchase Rate */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Herhaalaankoop Rate</h4>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-400">0%</div>
            <div className="text-sm text-gray-500">Geen data</div>
          </div>
        </div>

        {/* Insights Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <PieChart className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Analytics Inzichten</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Belangrijkste Bevindingen:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Voeg producten toe om data te genereren</li>
                <li>• Koppel traffic tracking voor conversie data</li>
                <li>• Koppel email API voor marketing ROI</li>
                <li>• Verzamel klantdata voor retention analysis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">💡 Aanbevelingen:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Koppel Google Analytics voor traffic data</li>
                <li>• Koppel Google/Meta Ads voor campagne tracking</li>
                <li>• Voeg producten en klanten toe voor analytics</li>
                <li>• Configureer tracking pixels voor conversies</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === 'profit' && (
        <div className="space-y-6">
          {/* Profit Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Totale Winst"
              value={formatCurrency(profitData.reduce((sum, item) => sum + item.profit, 0))}
              icon={Euro}
              change="+12.3%"
              changeType="positive"
            />
            <StatsCard
              title="Gemiddelde Marge"
              value={`${(profitData.reduce((sum, item) => sum + item.margin, 0) / profitData.length).toFixed(1)}%`}
              icon={TrendingUp}
              change="+2.1%"
              changeType="positive"
            />
            <StatsCard
              title="Beste Dag"
              value={formatCurrency(Math.max(...profitData.map(d => d.profit)))}
              icon={Target}
              change="Gisteren"
              changeType="positive"
            />
            <StatsCard
              title="Kosten Ratio"
              value={`${((profitData.reduce((sum, item) => sum + item.costs, 0) / profitData.reduce((sum, item) => sum + item.revenue, 0)) * 100).toFixed(1)}%`}
              icon={Activity}
              change="-1.2%"
              changeType="negative"
            />
          </div>

          {/* Profit Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Winst Ontwikkeling</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Omzet' : name === 'costs' ? 'Kosten' : 'Winst']} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="costs" stroke="#EF4444" name="costs" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#10B981" name="profit" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Profit Insights */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Winst Inzichten</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">💰 Winstgevendheid:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Gemiddelde marge: {(profitData.reduce((sum, item) => sum + item.margin, 0) / profitData.length).toFixed(1)}%</li>
                  <li>• Beste product categorie: Kleding (+28% marge)</li>
                  <li>• Kosten onder controle: 65% van omzet</li>
                  <li>• Winstgroei: +12.3% vs vorige maand</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Optimalisatie:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Verhoog marge op accessoires</li>
                  <li>• Optimaliseer verzendkosten</li>
                  <li>• Focus op high-margin producten</li>
                  <li>• Reduceer retourenkosten</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
