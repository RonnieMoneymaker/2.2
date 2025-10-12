import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Target,
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';

interface ProfitAnalysis {
  period: { start_date: string; end_date: string; days: number };
  summary: {
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    total_fixed_costs: number;
    total_ad_spend: number;
    net_profit: number;
    gross_margin: number;
    net_margin: number;
    break_even_revenue: number;
    orders_count: number;
    avg_order_value: number;
    units_sold: number;
  };
  breakdown: {
    revenue_by_category: Array<{
      category: string;
      revenue: number;
      cogs: number;
      gross_profit: number;
      units_sold: number;
    }>;
    daily_trend: Array<{
      date: string;
      daily_revenue: number;
      daily_cogs: number;
      daily_gross_profit: number;
      orders_count: number;
    }>;
    cost_structure: {
      cogs_percentage: number;
      fixed_costs_percentage: number;
      ad_spend_percentage: number;
    };
  };
}

const ProfitAnalytics: React.FC = () => {
  const [analysis, setAnalysis] = useState<ProfitAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchProfitAnalysis();
  }, [period]);

  const fetchProfitAnalysis = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(`/api/profit/analysis?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        // No mock data - set all zeros
        const emptyAnalysis: ProfitAnalysis = {
          period: { start_date: startDate, end_date: endDate, days: parseInt(period) },
          summary: {
            total_revenue: 0,
            total_cogs: 0,
            gross_profit: 0,
            total_fixed_costs: 0,
            total_ad_spend: 0,
            net_profit: 0,
            gross_margin: 0,
            net_margin: 0,
            break_even_revenue: 0,
            orders_count: 0,
            avg_order_value: 0,
            units_sold: 0
          },
          breakdown: {
            revenue_by_category: [],
            daily_trend: [],
            cost_structure: {
              cogs_percentage: 0,
              fixed_costs_percentage: 0,
              ad_spend_percentage: 0
            }
          }
        };
        setAnalysis(emptyAnalysis);
      }
    } catch (error) {
      console.error('Error fetching profit analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <Layout title="Winst Analyse">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout title="Winst Analyse">
        <div className="text-center py-12">
          <p className="text-gray-500">Kon winst analyse niet laden.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Winst Analyse">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Winst Analyse</h1>
            <p className="mt-1 text-sm text-gray-500">
              Complete financiële analyse van je webshop prestaties
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
            value={formatCurrency(analysis.summary.total_revenue)}
            change={`${analysis.summary.orders_count} bestellingen`}
            changeType="positive"
            icon={DollarSign}
            color="blue"
          />
          <StatsCard
            title="Bruto Winst"
            value={formatCurrency(analysis.summary.gross_profit)}
            change={`${analysis.summary.gross_margin.toFixed(1)}% marge`}
            changeType={analysis.summary.gross_margin > 50 ? "positive" : "negative"}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Netto Winst"
            value={formatCurrency(analysis.summary.net_profit)}
            change={`${analysis.summary.net_margin.toFixed(1)}% marge`}
            changeType={analysis.summary.net_profit > 0 ? "positive" : "negative"}
            icon={analysis.summary.net_profit > 0 ? TrendingUp : TrendingDown}
            color={analysis.summary.net_profit > 0 ? "green" : "yellow"}
          />
          <StatsCard
            title="Break-even Punt"
            value={formatCurrency(analysis.summary.break_even_revenue)}
            change={`${formatCurrency(analysis.summary.break_even_revenue - analysis.summary.total_revenue)} tekort`}
            changeType={analysis.summary.total_revenue >= analysis.summary.break_even_revenue ? "positive" : "negative"}
            icon={Target}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Dagelijkse Winst Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysis.breakdown.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: any) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value: any) => new Date(value).toLocaleDateString('nl-NL')}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'daily_revenue' ? 'Omzet' :
                    name === 'daily_cogs' ? 'Inkoopkosten' : 'Bruto Winst'
                  ]}
                />
                <Line type="monotone" dataKey="daily_revenue" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="daily_cogs" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="daily_gross_profit" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Kostenverdeling
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={[
                    { name: 'Inkoopkosten', value: analysis.summary.total_cogs, percentage: analysis.breakdown.cost_structure.cogs_percentage },
                    { name: 'Vaste Kosten', value: analysis.summary.total_fixed_costs, percentage: analysis.breakdown.cost_structure.fixed_costs_percentage },
                    { name: 'Advertentiekosten', value: analysis.summary.total_ad_spend, percentage: analysis.breakdown.cost_structure.ad_spend_percentage }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }: any) => `${name} (${((percentage || 0)).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0,1,2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Category */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Omzet per Categorie
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.breakdown.revenue_by_category}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3B82F6" />
                <Bar dataKey="gross_profit" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Financieel Overzicht
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Totale Omzet</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(analysis.summary.total_revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Inkoopkosten (COGS)</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(analysis.summary.total_cogs)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700 font-medium">Bruto Winst</span>
                <span className={`font-bold ${analysis.summary.gross_profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.summary.gross_profit > 0 ? '+' : ''}{formatCurrency(analysis.summary.gross_profit)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Vaste Kosten</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(analysis.summary.total_fixed_costs)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Advertentiekosten</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(analysis.summary.total_ad_spend)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Netto Winst</span>
                <span className={`text-lg font-bold ${analysis.summary.net_profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.summary.net_profit > 0 ? '+' : ''}{formatCurrency(analysis.summary.net_profit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Break-even Analysis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Break-even Analyse
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(analysis.summary.break_even_revenue)}
              </div>
              <p className="text-sm text-gray-500">Break-even Omzet</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency((analysis.summary.break_even_revenue - analysis.summary.total_revenue))}
              </div>
              <p className="text-sm text-gray-500">
                {analysis.summary.total_revenue >= analysis.summary.break_even_revenue ? 'Overschot' : 'Tekort'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.ceil((analysis.summary.break_even_revenue - analysis.summary.total_revenue) / analysis.summary.avg_order_value)}
              </div>
              <p className="text-sm text-gray-500">Extra bestellingen nodig</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Huidige omzet</span>
              <span>Break-even punt</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  analysis.summary.total_revenue >= analysis.summary.break_even_revenue 
                    ? 'bg-green-500' 
                    : 'bg-yellow-500'
                }`}
                style={{ 
                  width: `${Math.min((analysis.summary.total_revenue / analysis.summary.break_even_revenue * 100), 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>{formatCurrency(analysis.summary.total_revenue)}</span>
              <span>{((analysis.summary.total_revenue / analysis.summary.break_even_revenue) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfitAnalytics;
