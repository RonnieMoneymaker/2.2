import React, { useEffect, useState } from 'react';
import {
  Plug,
  ShoppingCart,
  ShoppingBag,
  MessageSquare,
  CreditCard,
  Mail,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Trash2,
  Play,
  ExternalLink,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { integrationsApi } from '../services/api';

interface Integration {
  id: number;
  platform: string;
  name: string;
  isActive: boolean;
  syncStatus: string;
  lastSync: string | null;
  lastError: string | null;
  createdAt: string;
  syncLogs?: any[];
}

const PLATFORM_CONFIG = {
  woocommerce: {
    name: 'WooCommerce',
    icon: '🛒',
    color: 'purple',
    description: 'Sync products, orders, and customers from WooCommerce',
    fields: [
      { name: 'url', label: 'Store URL', type: 'url', placeholder: 'https://yourstore.com' },
      { name: 'consumerKey', label: 'Consumer Key', type: 'text', placeholder: 'ck_...' },
      { name: 'consumerSecret', label: 'Consumer Secret', type: 'password', placeholder: 'cs_...' }
    ]
  },
  shopify: {
    name: 'Shopify',
    icon: '🛍️',
    color: 'green',
    description: 'Connect your Shopify store for product sync',
    fields: [
      { name: 'shopName', label: 'Shop Name', type: 'text', placeholder: 'mystore' },
      { name: 'apiKey', label: 'API Key', type: 'text', placeholder: 'shpat_...' },
      { name: 'password', label: 'API Password', type: 'password', placeholder: 'shppa_...' }
    ]
  },
  crisp: {
    name: 'Crisp Chat',
    icon: '💬',
    color: 'blue',
    description: 'Live chat and customer support',
    fields: [
      { name: 'websiteId', label: 'Website ID', type: 'text', placeholder: '...' },
      { name: 'identifier', label: 'Identifier', type: 'text', placeholder: '...' },
      { name: 'key', label: 'API Key', type: 'password', placeholder: '...' }
    ]
  },
  mollie: {
    name: 'Mollie',
    icon: '💳',
    color: 'indigo',
    description: 'Payment processing with Mollie',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'test_...' }
    ]
  },
  stripe: {
    name: 'Stripe',
    icon: '💰',
    color: 'violet',
    description: 'Accept payments with Stripe',
    fields: [
      { name: 'publicKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_...' },
      { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_...' }
    ]
  },
  sendgrid: {
    name: 'SendGrid',
    icon: '📧',
    color: 'cyan',
    description: 'Email delivery and marketing',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG....' },
      { name: 'fromEmail', label: 'From Email', type: 'email', placeholder: 'noreply@domain.com' },
      { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Store' }
    ]
  },
  mailchimp: {
    name: 'Mailchimp',
    icon: '🐵',
    color: 'yellow',
    description: 'Email marketing and automation',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: '...' },
      { name: 'server', label: 'Server', type: 'text', placeholder: 'us1' },
      { name: 'listId', label: 'Audience/List ID', type: 'text', placeholder: '...' }
    ]
  }
};

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [formData, setFormData] = useState<any>({});
  const [syncing, setSyncing] = useState<number | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getAll();
      setIntegrations(response.data.integrations);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    try {
      const config = PLATFORM_CONFIG[selectedPlatform as keyof typeof PLATFORM_CONFIG];
      if (!config) return;

      const data = {
        platform: selectedPlatform,
        name: formData.name || `${config.name} Integration`,
        config: formData
      };

      await integrationsApi.create(data);
      setShowAddModal(false);
      setSelectedPlatform('');
      setFormData({});
      fetchIntegrations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create integration');
    }
  };

  const handleTestConnection = async (id: number) => {
    try {
      const response = await integrationsApi.test(id);
      alert(response.data.success ? '✅ Connection successful!' : `❌ ${response.data.message}`);
    } catch (err: any) {
      alert(`❌ Connection failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      setSyncing(integration.id);
      
      if (integration.platform === 'woocommerce') {
        await integrationsApi.syncWooCommerce(integration.id);
      } else if (integration.platform === 'shopify') {
        await integrationsApi.syncShopify(integration.id);
      }
      
      alert('✅ Sync completed successfully!');
      fetchIntegrations();
    } catch (err: any) {
      alert(`❌ Sync failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    
    try {
      await integrationsApi.delete(id);
      fetchIntegrations();
    } catch (err: any) {
      alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
    }
  };

  const toggleActive = async (integration: Integration) => {
    try {
      await integrationsApi.update(integration.id, { isActive: !integration.isActive });
      fetchIntegrations();
    } catch (err: any) {
      alert(`Failed to update: ${err.response?.data?.error || err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'idle': 'gray',
      'syncing': 'blue',
      'success': 'green',
      'error': 'red'
    };
    return colors[status] || 'gray';
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      'idle': Clock,
      'syncing': RefreshCw,
      'success': CheckCircle2,
      'error': XCircle
    };
    return icons[status] || Clock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Plug className="text-blue-600" size={36} />
            Integrations
          </h1>
          <p className="text-gray-600 mt-1">
            Connect your store with e-commerce platforms, payment providers, and marketing tools
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Integration
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium">Total Integrations</p>
          <p className="text-3xl font-bold mt-2">{integrations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-green-100 text-sm font-medium">Active</p>
          <p className="text-3xl font-bold mt-2">{integrations.filter(i => i.isActive).length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-purple-100 text-sm font-medium">Syncing</p>
          <p className="text-3xl font-bold mt-2">{integrations.filter(i => i.syncStatus === 'syncing').length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <p className="text-red-100 text-sm font-medium">Errors</p>
          <p className="text-3xl font-bold mt-2">{integrations.filter(i => i.syncStatus === 'error').length}</p>
        </div>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Plug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No integrations yet</h3>
          <p className="text-gray-600 mb-4">Connect your first platform to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => {
            const config = PLATFORM_CONFIG[integration.platform as keyof typeof PLATFORM_CONFIG];
            if (!config) return null;
            
            const StatusIcon = getStatusIcon(integration.syncStatus);
            const statusColor = getStatusColor(integration.syncStatus);
            
            return (
              <div key={integration.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl">
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{integration.name}</h3>
                        <p className="text-xs opacity-90">{config.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`text-${statusColor}-600`} size={18} />
                      <span className={`text-sm font-medium text-${statusColor}-700`}>
                        {integration.syncStatus.charAt(0).toUpperCase() + integration.syncStatus.slice(1)}
                      </span>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.isActive}
                        onChange={() => toggleActive(integration)}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Last Sync */}
                  {integration.lastSync && (
                    <p className="text-xs text-gray-600">
                      Last sync: {new Date(integration.lastSync).toLocaleString('nl-NL')}
                    </p>
                  )}

                  {/* Error Message */}
                  {integration.lastError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-700">{integration.lastError}</p>
                    </div>
                  )}

                  {/* Recent Logs */}
                  {integration.syncLogs && integration.syncLogs.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-700">Recent Syncs:</p>
                      {integration.syncLogs.slice(0, 3).map((log: any) => (
                        <div key={log.id} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'completed' ? 'bg-green-500' : 
                            log.status === 'failed' ? 'bg-red-500' : 
                            'bg-blue-500'
                          }`}></span>
                          <span>{log.entity}: {log.recordsSuccess}/{log.recordsTotal}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleTestConnection(integration.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      <CheckCircle2 size={14} />
                      Test
                    </button>
                    
                    {(integration.platform === 'woocommerce' || integration.platform === 'shopify') && (
                      <button
                        onClick={() => handleSync(integration)}
                        disabled={syncing === integration.id}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                      >
                        <Play size={14} className={syncing === integration.id ? 'animate-spin' : ''} />
                        Sync
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add Integration</h2>
              <p className="text-gray-600 mt-1">Connect a new platform to your store</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Platform Selection */}
              {!selectedPlatform ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPlatform(key)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{config.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{config.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedPlatform('');
                      setFormData({});
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Back to platforms
                  </button>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Integration Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={`My ${PLATFORM_CONFIG[selectedPlatform as keyof typeof PLATFORM_CONFIG].name}`}
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {PLATFORM_CONFIG[selectedPlatform as keyof typeof PLATFORM_CONFIG].fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        className="input-field"
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlatform('');
                  setFormData({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              {selectedPlatform && (
                <button
                  onClick={handleAddIntegration}
                  className="btn-primary"
                >
                  Add Integration
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
