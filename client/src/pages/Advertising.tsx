import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  MousePointer, 
  Eye, 
  DollarSign,
  Plus,
  ExternalLink,
  BarChart3,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';

interface Campaign {
  id: number;
  name: string;
  platform: 'google' | 'meta';
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
}

interface AdOverview {
  totalCampaigns: { count: number };
  activeCampaigns: { count: number };
  totalSpend: { total: number };
  totalConversions: { total: number };
  platformPerformance: Array<{
    platform: string;
    campaigns: number;
    spent: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
  }>;
  dailyPerformance: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spent: number;
    conversions: number;
    revenue: number;
  }>;
  topCampaigns: Campaign[];
}

const Advertising: React.FC = () => {
  const [overview, setOverview] = useState<AdOverview | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  useEffect(() => {
    fetchAdvertisingData();
  }, []);

  const fetchAdvertisingData = async () => {
    try {
      setLoading(true);
      // No mock data - set empty values
      const emptyOverview: AdOverview = {
        totalCampaigns: { count: 0 },
        activeCampaigns: { count: 0 },
        totalSpend: { total: 0 },
        totalConversions: { total: 0 },
        platformPerformance: [],
        dailyPerformance: [],
        topCampaigns: []
      };

      setOverview(emptyOverview);
      setCampaigns([]);
    } catch (error) {
      console.error('Error fetching advertising data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google':
        return '🔍';
      case 'meta':
        return '📘';
      default:
        return '📊';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout title="Advertising">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Advertising">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Advertising Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Beheer je Google Ads en Meta Ads campagnes
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Zap className="h-4 w-4 mr-2" />
              Sync Google Ads
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Zap className="h-4 w-4 mr-2" />
              Sync Meta Ads
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Campagne
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Totaal Campagnes"
              value={overview.totalCampaigns.count}
              change={`${overview.activeCampaigns.count} actief`}
              changeType="positive"
              icon={Target}
              color="blue"
            />
            <StatsCard
              title="Totaal Uitgegeven"
              value={formatCurrency(overview.totalSpend.total || 0)}
              icon={DollarSign}
              color="green"
            />
            <StatsCard
              title="Conversies"
              value={overview.totalConversions.total || 0}
              icon={TrendingUp}
              color="purple"
            />
            <StatsCard
              title="Gemiddelde CPA"
              value={`€${((overview.totalSpend.total || 0) / (overview.totalConversions.total || 1)).toFixed(2)}`}
              icon={Target}
              color="yellow"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Prestaties laatste 7 dagen
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overview?.dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('nl-NL')}
                  formatter={(value: number, name: string) => [
                    name === 'spent' ? formatCurrency(value) : 
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'spent' ? 'Uitgegeven' :
                    name === 'revenue' ? 'Omzet' :
                    name === 'impressions' ? 'Impressies' :
                    name === 'clicks' ? 'Clicks' : 'Conversies'
                  ]}
                />
                <Line type="monotone" dataKey="spent" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Platform Prestaties
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview?.platformPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="platform" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value === 'google' ? 'Google' : 'Meta'}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'spent' ? formatCurrency(value) : value,
                    name === 'spent' ? 'Uitgegeven' :
                    name === 'conversions' ? 'Conversies' : name
                  ]}
                />
                <Bar dataKey="spent" fill="#3B82F6" />
                <Bar dataKey="conversions" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {overview?.platformPerformance.map((platform) => (
            <div key={platform.platform} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                  <h3 className="text-lg font-medium text-gray-900">
                    {platform.platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                  </h3>
                </div>
                <button className="text-primary-600 hover:text-primary-800">
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">
                      {platform.impressions.toLocaleString('nl-NL')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Impressies</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <MousePointer className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">
                      {platform.clicks.toLocaleString('nl-NL')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Clicks</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(platform.spent)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Uitgegeven</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-gray-900">
                      {platform.conversions}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Conversies</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CTR:</span>
                  <span className="font-medium">{platform.ctr}%</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">CPC:</span>
                  <span className="font-medium">{formatCurrency(platform.cpc)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Campaigns */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Presterende Campagnes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uitgegeven
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversies
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getPlatformIcon(campaign.platform)}</span>
                        <span className="text-sm text-gray-900 capitalize">
                          {campaign.platform === 'google' ? 'Google' : 'Meta'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(campaign.budget)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(campaign.spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.conversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(campaign.cpa)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.ctr}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Advertising;
