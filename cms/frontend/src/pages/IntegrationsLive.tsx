import React, { useEffect, useState } from 'react';
import { Activity, Database, Zap, Server, Clock, Check, X, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:2000';

interface SystemHealth {
  backend: boolean;
  database: boolean;
  websocket: boolean;
  timestamp: Date;
}

interface LiveMetrics {
  products: number;
  orders: number;
  customers: number;
  revenue: number;
}

export default function IntegrationsLive() {
  const [health, setHealth] = useState<SystemHealth>({
    backend: false,
    database: false,
    websocket: false,
    timestamp: new Date()
  });
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
    fetchMetrics();
    
    const healthInterval = setInterval(checkHealth, 5000);
    const metricsInterval = setInterval(fetchMetrics, 10000);
    
    return () => {
      clearInterval(healthInterval);
      clearInterval(metricsInterval);
    };
  }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      setHealth({
        backend: response.status === 200,
        database: true,
        websocket: true,
        timestamp: new Date()
      });
    } catch (error) {
      setHealth({
        backend: false,
        database: false,
        websocket: false,
        timestamp: new Date()
      });
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/stats/overview`, {
        headers: { 'x-api-key': 'dev-api-key-123' }
      });
      
      setMetrics({
        products: response.data.products || 0,
        orders: response.data.orders || 0,
        customers: response.data.customers || 0,
        revenue: response.data.revenue || 0
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  const StatusIndicator = ({ active }: { active: boolean }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-green-600' : 'text-red-600'}`}>
      {active ? (
        <>
          <Check className="w-5 h-5" />
          <span className="font-medium">Active</span>
        </>
      ) : (
        <>
          <X className="w-5 h-5" />
          <span className="font-medium">Offline</span>
        </>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-500" />
          Live Integrations
        </h1>
        <p className="mt-2 text-gray-600">Real-time system status en metrics</p>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${health.backend ? 'bg-green-100' : 'bg-red-100'}`}>
                <Server className={`w-6 h-6 ${health.backend ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Backend API</h3>
                <p className="text-sm text-gray-500">Port 2000</p>
              </div>
            </div>
            <StatusIndicator active={health.backend} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${health.database ? 'bg-green-100' : 'bg-red-100'}`}>
                <Database className={`w-6 h-6 ${health.database ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Database</h3>
                <p className="text-sm text-gray-500">SQLite</p>
              </div>
            </div>
            <StatusIndicator active={health.database} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${health.websocket ? 'bg-green-100' : 'bg-red-100'}`}>
                <Activity className={`w-6 h-6 ${health.websocket ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">WebSocket</h3>
                <p className="text-sm text-gray-500">Real-time</p>
              </div>
            </div>
            <StatusIndicator active={health.websocket} />
          </div>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Live Metrics</h2>
          <button
            onClick={() => fetchMetrics()}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-white/80 text-sm mb-2">Producten</p>
              <p className="text-4xl font-bold">{metrics?.products || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-white/80 text-sm mb-2">Bestellingen</p>
              <p className="text-4xl font-bold">{metrics?.orders || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-white/80 text-sm mb-2">Klanten</p>
              <p className="text-4xl font-bold">{metrics?.customers || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <p className="text-white/80 text-sm mb-2">Omzet</p>
              <p className="text-4xl font-bold">€{((metrics?.revenue || 0) / 100).toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>

      {/* API Endpoints Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-6">API Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Products API', endpoint: '/api/products', method: 'GET' },
            { name: 'Orders API', endpoint: '/api/orders', method: 'GET' },
            { name: 'Customers API', endpoint: '/api/customers', method: 'GET' },
            { name: 'Stats API', endpoint: '/api/stats/overview', method: 'GET' },
            { name: 'Financial API', endpoint: '/api/financial/overview', method: 'GET' },
            { name: 'Analytics API', endpoint: '/api/analytics/all', method: 'GET' },
            { name: 'Bulk Operations', endpoint: '/api/bulk/products/update', method: 'POST' },
            { name: 'Search API', endpoint: '/api/search/global', method: 'GET' },
          ].map((api) => (
            <div key={api.endpoint} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 transition">
              <div>
                <p className="font-medium text-gray-900">{api.name}</p>
                <p className="text-sm text-gray-500">{api.endpoint}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                api.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {api.method}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Update */}
      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
        <Clock className="w-4 h-4" />
        <span>Laatst bijgewerkt: {health.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
