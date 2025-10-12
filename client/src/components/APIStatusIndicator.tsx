import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Settings, RefreshCw } from 'lucide-react';

interface APIStatus {
  connected: boolean;
  status: string;
  message: string;
}

interface APIStatuses {
  google_ads: APIStatus;
  meta_ads: APIStatus;
  dhl: APIStatus;
  email_smtp: APIStatus;
}

const APIStatusIndicator: React.FC = () => {
  const [statuses, setStatuses] = useState<APIStatuses | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/settings/status');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching API statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !statuses) return null;

  const apis = [
    { key: 'google_ads', name: 'Google Ads', icon: '🎯' },
    { key: 'meta_ads', name: 'Meta Ads', icon: '📱' },
    { key: 'dhl', name: 'DHL', icon: '📦' },
    { key: 'email_smtp', name: 'Email', icon: '📧' }
  ];

  const connectedCount = Object.values(statuses).filter(s => s.connected).length;
  const totalCount = apis.length;

  return (
    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Settings className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-sm font-semibold text-gray-900">
            API Status
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {connectedCount}/{totalCount} actief
          </span>
          <button
            onClick={fetchStatuses}
            className="p-1 hover:bg-gray-100 rounded"
            title="Ververs status"
          >
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {apis.map(api => {
          const status = statuses[api.key as keyof APIStatuses];
          return (
            <div 
              key={api.key} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{api.icon}</span>
                <span className="text-sm font-medium text-gray-700">{api.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {status.connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Uit</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {connectedCount === 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            💡 Geen API's gekoppeld - Ga naar <a href="/api-settings" className="font-semibold underline">API Instellingen</a> om live data te activeren
          </p>
        </div>
      )}

      {connectedCount > 0 && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-800">
            ✅ {connectedCount} API{connectedCount > 1 ? "'s" : ''} actief - Live data wordt getoond!
          </p>
        </div>
      )}
    </div>
  );
};

export default APIStatusIndicator;

