import React, { useEffect, useState } from 'react';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  ShoppingBag,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { analyticsApi } from '../services/api';

interface PlatformData {
  platform: string;
  isConnected: boolean;
  lastSync: string;
  metrics: any;
  campaigns?: any[];
  trends?: any[];
  topPages?: any[];
  topProducts?: any[];
  issues?: any[];
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [overview, setOverview] = useState<any>(null);
  const [googleAds, setGoogleAds] = useState<PlatformData | null>(null);
  const [facebookAds, setFacebookAds] = useState<PlatformData | null>(null);
  const [snapchatAds, setSnapchatAds] = useState<PlatformData | null>(null);
  const [clarity, setClarity] = useState<PlatformData | null>(null);
  const [merchantCenter, setMerchantCenter] = useState<PlatformData | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getAll();
      const data = response.data;
      
      setOverview(data.overview);
      setGoogleAds(data.googleAds);
      setFacebookAds(data.facebookAds);
      setSnapchatAds(data.snapchatAds);
      setClarity(data.clarity);
      setMerchantCenter(data.merchantCenter);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kon analytics data niet laden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('nl-NL');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Analytics laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle size={20} />
          <p className="font-medium">Fout bij laden analytics</p>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={36} />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time inzichten van al je marketing platforms
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Vernieuwen...' : 'Vernieuw Data'}
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Totale Impressies</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(overview.totalImpressions)}</p>
              </div>
              <Eye size={40} className="text-blue-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Totale Clicks</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(overview.totalClicks)}</p>
                <p className="text-green-100 text-sm mt-1">CTR: {formatPercentage(overview.averageCTR)}</p>
              </div>
              <MousePointer size={40} className="text-green-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Totale Spend</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(overview.totalSpend)}</p>
                <p className="text-purple-100 text-sm mt-1">CPC: {formatCurrency(overview.averageCPC)}</p>
              </div>
              <DollarSign size={40} className="text-purple-200 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Totale Conversies</p>
                <p className="text-3xl font-bold mt-2">{formatNumber(overview.totalConversions)}</p>
              </div>
              <Target size={40} className="text-orange-200 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Google Ads Section */}
      {googleAds && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Google Ads</h2>
                  <p className="text-blue-100 text-sm">
                    {googleAds.isConnected ? '✓ Verbonden' : '✗ Niet verbonden'} • 
                    Laatste sync: {new Date(googleAds.lastSync).toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
              <a 
                href="https://ads.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ExternalLink size={18} />
                Open Dashboard
              </a>
            </div>
          </div>

          <div className="p-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard 
                label="Impressies" 
                value={formatNumber(googleAds.metrics.impressions)} 
                icon={<Eye size={20} />}
                color="blue"
              />
              <MetricCard 
                label="Clicks" 
                value={formatNumber(googleAds.metrics.clicks)} 
                icon={<MousePointer size={20} />}
                color="green"
                subtitle={`CTR: ${formatPercentage(googleAds.metrics.ctr)}`}
              />
              <MetricCard 
                label="Spend" 
                value={formatCurrency(googleAds.metrics.spend)} 
                icon={<DollarSign size={20} />}
                color="purple"
                subtitle={`CPC: ${formatCurrency(googleAds.metrics.cpc)}`}
              />
              <MetricCard 
                label="Conversies" 
                value={formatNumber(googleAds.metrics.conversions)} 
                icon={<Target size={20} />}
                color="orange"
                subtitle={`ROAS: ${googleAds.metrics.roas.toFixed(2)}x`}
              />
            </div>

            {/* Campaigns */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actieve Campagnes</h3>
              <div className="space-y-3">
                {googleAds.campaigns?.map((campaign: any, idx: number) => (
                  <CampaignRow key={idx} campaign={campaign} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Ads Section */}
      {facebookAds && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📘</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Facebook Ads</h2>
                  <p className="text-blue-100 text-sm">
                    {facebookAds.isConnected ? '✓ Verbonden' : '✗ Niet verbonden'} • 
                    Laatste sync: {new Date(facebookAds.lastSync).toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
              <a 
                href="https://business.facebook.com/adsmanager" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ExternalLink size={18} />
                Open Dashboard
              </a>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard 
                label="Impressies" 
                value={formatNumber(facebookAds.metrics.impressions)} 
                icon={<Eye size={20} />}
                color="blue"
              />
              <MetricCard 
                label="Clicks" 
                value={formatNumber(facebookAds.metrics.clicks)} 
                icon={<MousePointer size={20} />}
                color="green"
                subtitle={`CTR: ${formatPercentage(facebookAds.metrics.ctr)}`}
              />
              <MetricCard 
                label="Spend" 
                value={formatCurrency(facebookAds.metrics.spend)} 
                icon={<DollarSign size={20} />}
                color="purple"
                subtitle={`CPC: ${formatCurrency(facebookAds.metrics.cpc)}`}
              />
              <MetricCard 
                label="Conversies" 
                value={formatNumber(facebookAds.metrics.conversions)} 
                icon={<Target size={20} />}
                color="orange"
                subtitle={`ROAS: ${facebookAds.metrics.roas.toFixed(2)}x`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actieve Campagnes</h3>
              <div className="space-y-3">
                {facebookAds.campaigns?.map((campaign: any, idx: number) => (
                  <CampaignRow key={idx} campaign={campaign} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapchat Ads Section */}
      {snapchatAds && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👻</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Snapchat Ads</h2>
                  <p className="text-gray-700 text-sm">
                    {snapchatAds.isConnected ? '✓ Verbonden' : '✗ Niet verbonden'} • 
                    Laatste sync: {new Date(snapchatAds.lastSync).toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
              <a 
                href="https://ads.snapchat.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-black/20 rounded-lg transition-colors"
              >
                <ExternalLink size={18} />
                Open Dashboard
              </a>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard 
                label="Impressies" 
                value={formatNumber(snapchatAds.metrics.impressions)} 
                icon={<Eye size={20} />}
                color="blue"
              />
              <MetricCard 
                label="Clicks" 
                value={formatNumber(snapchatAds.metrics.clicks)} 
                icon={<MousePointer size={20} />}
                color="green"
                subtitle={`CTR: ${formatPercentage(snapchatAds.metrics.ctr)}`}
              />
              <MetricCard 
                label="Spend" 
                value={formatCurrency(snapchatAds.metrics.spend)} 
                icon={<DollarSign size={20} />}
                color="purple"
                subtitle={`CPC: ${formatCurrency(snapchatAds.metrics.cpc)}`}
              />
              <MetricCard 
                label="Conversies" 
                value={formatNumber(snapchatAds.metrics.conversions)} 
                icon={<Target size={20} />}
                color="orange"
                subtitle={`ROAS: ${snapchatAds.metrics.roas.toFixed(2)}x`}
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actieve Campagnes</h3>
              <div className="space-y-3">
                {snapchatAds.campaigns?.map((campaign: any, idx: number) => (
                  <CampaignRow key={idx} campaign={campaign} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Microsoft Clarity Section */}
      {clarity && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Microsoft Clarity</h2>
                  <p className="text-indigo-100 text-sm">
                    {clarity.isConnected ? '✓ Verbonden' : '✗ Niet verbonden'} • 
                    Laatste sync: {new Date(clarity.lastSync).toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
              <a 
                href="https://clarity.microsoft.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ExternalLink size={18} />
                Open Dashboard
              </a>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard 
                label="Sessions" 
                value={formatNumber(clarity.metrics.sessions)} 
                icon={<Activity size={20} />}
                color="indigo"
              />
              <MetricCard 
                label="Pageviews" 
                value={formatNumber(clarity.metrics.pageviews)} 
                icon={<Eye size={20} />}
                color="blue"
              />
              <MetricCard 
                label="Avg. Sessie Tijd" 
                value={`${Math.floor(clarity.metrics.avgSessionDuration / 60)}m ${clarity.metrics.avgSessionDuration % 60}s`} 
                icon={<Clock size={20} />}
                color="green"
              />
              <MetricCard 
                label="Bounce Rate" 
                value={formatPercentage(clarity.metrics.bounceRate)} 
                icon={<TrendingDown size={20} />}
                color="red"
              />
            </div>

            {/* User Experience Issues */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Experience Issues</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-900 font-semibold text-2xl">{clarity.metrics.rageClicks}</p>
                  <p className="text-red-700 text-sm">Rage Clicks</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-900 font-semibold text-2xl">{clarity.metrics.deadClicks}</p>
                  <p className="text-orange-700 text-sm">Dead Clicks</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900 font-semibold text-2xl">{clarity.metrics.excessiveScrolling}</p>
                  <p className="text-yellow-700 text-sm">Excessive Scrolling</p>
                </div>
              </div>
            </div>

            {/* Top Pages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pagina's</h3>
              <div className="space-y-2">
                {clarity.topPages?.map((page: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{page.url}</p>
                      <p className="text-sm text-gray-600">{formatNumber(page.sessions)} sessies • Avg {page.avgTime}s</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">{page.rageClicks} rage clicks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Merchant Center Section */}
      {merchantCenter && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🛍️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Google Merchant Center</h2>
                  <p className="text-green-100 text-sm">
                    {merchantCenter.isConnected ? '✓ Verbonden' : '✗ Niet verbonden'} • 
                    Laatste sync: {new Date(merchantCenter.lastSync).toLocaleTimeString('nl-NL')}
                  </p>
                </div>
              </div>
              <a 
                href="https://merchants.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ExternalLink size={18} />
                Open Dashboard
              </a>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard 
                label="Totale Producten" 
                value={formatNumber(merchantCenter.metrics.totalProducts)} 
                icon={<ShoppingBag size={20} />}
                color="green"
              />
              <MetricCard 
                label="Actieve Producten" 
                value={formatNumber(merchantCenter.metrics.activeProducts)} 
                icon={<CheckCircle size={20} />}
                color="blue"
              />
              <MetricCard 
                label="Clicks" 
                value={formatNumber(merchantCenter.metrics.clicks)} 
                icon={<MousePointer size={20} />}
                color="purple"
                subtitle={`CTR: ${formatPercentage(merchantCenter.metrics.ctr)}`}
              />
              <MetricCard 
                label="Impressies" 
                value={formatNumber(merchantCenter.metrics.impressions)} 
                icon={<Eye size={20} />}
                color="orange"
              />
            </div>

            {/* Product Issues */}
            {merchantCenter.issues && merchantCenter.issues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Issues</h3>
                <div className="space-y-2">
                  {merchantCenter.issues.map((issue: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        issue.type === 'error' ? 'bg-red-50 border border-red-200' :
                        issue.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle 
                          size={20} 
                          className={
                            issue.type === 'error' ? 'text-red-600' :
                            issue.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          } 
                        />
                        <p className={`font-medium ${
                          issue.type === 'error' ? 'text-red-900' :
                          issue.type === 'warning' ? 'text-yellow-900' :
                          'text-blue-900'
                        }`}>
                          {issue.message}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        issue.type === 'error' ? 'text-red-700' :
                        issue.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {issue.count} producten
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Products */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
              <div className="space-y-2">
                {merchantCenter.topProducts?.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.title}</p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(product.clicks)} clicks • {formatNumber(product.impressions)} impressies
                      </p>
                    </div>
                    <div className="text-green-600 font-semibold">
                      CTR: {formatPercentage(product.ctr)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
    </div>
  );
};

interface CampaignRowProps {
  campaign: {
    name: string;
    status: string;
    spend: number;
    conversions: number;
    roas: number;
  };
}

const CampaignRow: React.FC<CampaignRowProps> = ({ campaign }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
        <p className="font-medium text-gray-900">{campaign.name}</p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-gray-600">Spend</p>
          <p className="font-semibold text-gray-900">€{(campaign.spend / 100).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Conversies</p>
          <p className="font-semibold text-gray-900">{campaign.conversions}</p>
        </div>
        <div>
          <p className="text-gray-600">ROAS</p>
          <p className={`font-semibold ${
            campaign.roas >= 4 ? 'text-green-600' : 
            campaign.roas >= 2 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {campaign.roas.toFixed(2)}x
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
