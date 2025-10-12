import React, { useState, useEffect } from 'react';
import { Settings, Key, TestTube, CheckCircle, XCircle, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { apiSettingsApi } from '../services/api';

interface APICredentials {
  [key: string]: {
    configured: boolean;
    value: string | null;
    id?: number;
  };
}

interface PlatformSettings {
  [platform: string]: APICredentials;
}

const APISettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('google_ads');
  const [testResults, setTestResults] = useState<{[key: string]: any}>({});
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({});
  const [formData, setFormData] = useState<{[key: string]: any}>({});

  const platforms = [
    {
      id: 'google_ads',
      name: 'Google Ads',
      icon: '🎯',
      description: 'Google Ads campaigns en performance tracking',
      fields: [
        { key: 'developer_token', label: 'Developer Token', type: 'password', required: true },
        { key: 'client_id', label: 'Client ID', type: 'text', required: true },
        { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
        { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true },
        { key: 'customer_id', label: 'Customer ID', type: 'text', required: true, placeholder: '123-456-7890' }
      ]
    },
    {
      id: 'meta_ads',
      name: 'Meta Ads',
      icon: '📱',
      description: 'Facebook en Instagram advertising',
      fields: [
        { key: 'access_token', label: 'Access Token', type: 'password', required: true },
        { key: 'ad_account_id', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_1234567890' },
        { key: 'app_id', label: 'App ID', type: 'text', required: false },
        { key: 'app_secret', label: 'App Secret', type: 'password', required: false }
      ]
    },
    {
      id: 'dhl',
      name: 'DHL Shipping',
      icon: '📦',
      description: 'DHL shipping labels en tracking',
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'api_secret', label: 'API Secret', type: 'password', required: true },
        { key: 'account_number', label: 'Account Number', type: 'text', required: true },
        { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['sandbox', 'production'] }
      ]
    },
    {
      id: 'postnl',
      name: 'PostNL',
      icon: '📮',
      description: 'PostNL shipping alternative',
      fields: [
        { key: 'api_key', label: 'API Key', type: 'password', required: true },
        { key: 'customer_code', label: 'Customer Code', type: 'text', required: true },
        { key: 'customer_number', label: 'Customer Number', type: 'text', required: true },
        { key: 'environment', label: 'Environment', type: 'select', required: true, options: ['sandbox', 'production'] }
      ]
    },
    {
      id: 'email_smtp',
      name: 'Email SMTP',
      icon: '📧',
      description: 'SMTP email service (Gmail, Outlook, etc.)',
      fields: [
        { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
        { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
        { key: 'user', label: 'Username/Email', type: 'email', required: true },
        { key: 'pass', label: 'Password/App Password', type: 'password', required: true },
        { key: 'secure', label: 'Use SSL/TLS', type: 'select', required: true, options: ['false', 'true'] }
      ]
    },
    {
      id: 'email_sendgrid',
      name: 'SendGrid Email',
      icon: '📬',
      description: 'SendGrid email service alternative',
      fields: [
        { key: 'api_key', label: 'SendGrid API Key', type: 'password', required: true },
        { key: 'from_email', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' }
      ]
    }
  ];

  useEffect(() => {
    fetchAPISettings();
  }, []);

  const fetchAPISettings = async () => {
    try {
      const response = await apiSettingsApi.getSettings();
      setSettings(response.data.settings || {});
      
      // Initialize form data
      const initialFormData: {[key: string]: any} = {};
      platforms.forEach(platform => {
        initialFormData[platform.id] = {};
        platform.fields.forEach(field => {
          initialFormData[platform.id][field.key] = '';
        });
      });
      setFormData(initialFormData);
      
    } catch (error) {
      console.error('Error fetching API settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (platform: string) => {
    try {
      const platformData = formData[platform];
      const promises = [];

      for (const [key, value] of Object.entries(platformData)) {
        if (value) {
          promises.push(
            apiSettingsApi.updateSetting(platform, key, value as string)
          );
        }
      }

      await Promise.all(promises);
      
      alert(`${platforms.find(p => p.id === platform)?.name} credentials opgeslagen!`);
      await fetchAPISettings();
      setEditMode(prev => ({ ...prev, [platform]: false }));
      
    } catch (error) {
      console.error('Error saving credentials:', error);
      alert('Fout bij opslaan credentials: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTestConnection = async (platform: string) => {
    try {
      const platformData = formData[platform];
      const response = await apiSettingsApi.testConnection(platform, platformData);
      
      setTestResults(prev => ({
        ...prev,
        [platform]: { ...response.data, timestamp: new Date() }
      }));
      
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults(prev => ({
        ...prev,
        [platform]: { 
          success: false, 
          error: error.response?.data?.error || error.message,
          timestamp: new Date()
        }
      }));
    }
  };

  const handleDeleteCredentials = async (platform: string, key: string) => {
    if (window.confirm(`Weet je zeker dat je ${key} wilt verwijderen?`)) {
      try {
        await apiSettingsApi.deleteSetting(platform, key);
        alert('Credentials verwijderd');
        await fetchAPISettings();
      } catch (error) {
        alert('Fout bij verwijderen: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const togglePasswordVisibility = (platform: string, field: string) => {
    const key = `${platform}_${field}`;
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleEditMode = (platform: string) => {
    setEditMode(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const updateFormData = (platform: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  const handleOAuthLogin = (platform: string) => {
    const oauthUrl = `/api/oauth/${platform === 'google_ads' ? 'google' : 'meta'}/start`;
    const popup = window.open(
      oauthUrl,
      'OAuth Login',
      'width=600,height=700,left=200,top=100'
    );
    
    // Reload settings when popup closes
    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        fetchAPISettings();
        alert('API gekoppeld! Ververs de pagina om live data te zien.');
      }
    }, 1000);
  };

  const getConnectionStatus = (platform: string) => {
    const platformSettings = settings[platform];
    if (!platformSettings) return 'not_configured';
    
    const requiredFields = platforms.find(p => p.id === platform)?.fields.filter(f => f.required) || [];
    const configuredFields = requiredFields.filter(field => 
      platformSettings[field.key]?.configured
    );
    
    if (configuredFields.length === 0) return 'not_configured';
    if (configuredFields.length < requiredFields.length) return 'partially_configured';
    return 'configured';
  };

  const getStatusBadge = (platform: string) => {
    const status = getConnectionStatus(platform);
    const testResult = testResults[platform];
    
    if (testResult) {
      if (testResult.success) {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Test Failed
          </span>
        );
      }
    }
    
    switch (status) {
      case 'configured':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Key className="h-3 w-3 mr-1" />
            Configured
          </span>
        );
      case 'partially_configured':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Settings className="h-3 w-3 mr-1" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Not Configured
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout title="API Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="API Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 text-indigo-600 mr-3" />
              API & Platform Instellingen
            </h1>
            <p className="text-gray-600 mt-1">
              Beheer je API credentials voor Google Ads, Meta Ads, Shipping providers en Email services
            </p>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setActiveTab(platform.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === platform.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{platform.icon}</span>
                {platform.name}
                <span className="ml-2">{getStatusBadge(platform.id)}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Platform Configuration */}
        {platforms.map((platform) => (
          <div key={platform.id} className={activeTab === platform.id ? 'block' : 'hidden'}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <span className="mr-2 text-2xl">{platform.icon}</span>
                      {platform.name} Configuration
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleEditMode(platform.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        editMode[platform.id]
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {editMode[platform.id] ? 'Annuleren' : 'Bewerken'}
                    </button>
                    {getConnectionStatus(platform.id) !== 'not_configured' && (
                      <button
                        onClick={() => handleTestConnection(platform.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Verbinding
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* OAuth Quick Connect */}
                {(platform.id === 'google_ads' || platform.id === 'meta_ads') && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">🚀 Snel Koppelen met OAuth</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Klik hieronder om in te loggen met je {platform.name} account - credentials worden automatisch opgehaald!
                    </p>
                    <button
                      onClick={() => handleOAuthLogin(platform.id)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Login met {platform.name} voor Auto-Koppeling
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Of vul hieronder handmatig je credentials in
                    </p>
                  </div>
                )}

                {/* Test Results */}
                {testResults[platform.id] && (
                  <div className={`mb-4 p-4 rounded-lg ${
                    testResults[platform.id].success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {testResults[platform.id].success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <p className={`font-medium ${
                          testResults[platform.id].success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResults[platform.id].message || testResults[platform.id].error}
                        </p>
                        <p className="text-xs text-gray-500">
                          Getest: {testResults[platform.id].timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {platform.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      <div className="relative">
                        {field.type === 'select' ? (
                          <select
                            value={editMode[platform.id] 
                              ? (formData[platform.id]?.[field.key] || '') 
                              : (settings[platform.id]?.[field.key]?.configured ? '***CONFIGURED***' : '')
                            }
                            onChange={(e) => updateFormData(platform.id, field.key, e.target.value)}
                            disabled={!editMode[platform.id]}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                          >
                            <option value="">Selecteer...</option>
                            {field.options?.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <input
                              type={
                                field.type === 'password' && !showPasswords[`${platform.id}_${field.key}`]
                                  ? 'password'
                                  : field.type === 'password'
                                  ? 'text'
                                  : field.type
                              }
                              value={editMode[platform.id] 
                                ? (formData[platform.id]?.[field.key] || '') 
                                : (settings[platform.id]?.[field.key]?.configured ? '***CONFIGURED***' : '')
                              }
                              onChange={(e) => updateFormData(platform.id, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              disabled={!editMode[platform.id]}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                            />
                            {field.type === 'password' && (
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(platform.id, field.key)}
                                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                              >
                                {showPasswords[`${platform.id}_${field.key}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {settings[platform.id]?.[field.key]?.configured && !editMode[platform.id] && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Geconfigureerd
                          </span>
                          <button
                            onClick={() => handleDeleteCredentials(platform.id, field.key)}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                {editMode[platform.id] && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setEditMode(prev => ({ ...prev, [platform.id]: false }))}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={() => handleSaveCredentials(platform.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Opslaan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Platform Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Platform Overzicht</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platforms.map((platform) => {
                const status = getConnectionStatus(platform.id);
                const testResult = testResults[platform.id];
                
                return (
                  <div key={platform.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{platform.icon}</span>
                        <span className="font-medium text-gray-900">{platform.name}</span>
                      </div>
                      {getStatusBadge(platform.id)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                    
                    {status === 'configured' && testResult?.success && (
                      <div className="text-xs text-green-600">
                        ✅ Laatste test: {testResult.timestamp.toLocaleString()}
                      </div>
                    )}
                    
                    {status === 'not_configured' && (
                      <button
                        onClick={() => {
                          setActiveTab(platform.id);
                          setEditMode(prev => ({ ...prev, [platform.id]: true }));
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        → Configureer nu
                      </button>
                    )}
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

export default APISettings;
