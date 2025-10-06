import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Mail,
  CreditCard,
  Truck,
  Receipt,
  Shield,
  Database,
  Bell,
  Palette,
  Key,
  Users,
  FileText,
  Save,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    // General
    siteName: 'Voltmover Shop',
    siteUrl: 'https://voltmover.nl',
    contactEmail: 'info@voltmover.nl',
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
    language: 'nl',
    
    // Email
    emailProvider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    
    // Payments
    paymentProvider: 'stripe',
    stripePublicKey: '',
    stripeSecretKey: '',
    mollieApiKey: '',
    paypalClientId: '',
    
    // Shipping
    shippingProvider: 'dhl',
    dhlApiKey: '',
    freeShippingThreshold: 50,
    defaultShippingCost: 5.95,
    
    // Tax
    taxEnabled: true,
    defaultTaxRate: 21,
    taxIncluded: true,
    
    // Inventory
    lowStockThreshold: 5,
    outOfStockMessage: 'Niet op voorraad',
    backordersAllowed: false,
    
    // Notifications
    orderEmailEnabled: true,
    lowStockAlerts: true,
    customerRegistrationEmail: true,
    
    // Security
    apiKeyEnabled: true,
    apiKey: 'dev-api-key-123',
    sessionTimeout: 30,
    twoFactorAuth: false,
    
    // Analytics
    googleAdsEnabled: false,
    googleAdsClientId: '',
    googleAdsClientSecret: '',
    googleAdsRefreshToken: '',
    facebookAdsEnabled: false,
    facebookAdsAccessToken: '',
    facebookAdsAccountId: '',
    snapchatAdsEnabled: false,
    snapchatAdsApiToken: '',
    snapchatAdsAdAccountId: '',
    clarityEnabled: false,
    clarityProjectId: '',
    merchantCenterEnabled: false,
    merchantCenterAccountId: '',
    merchantCenterApiKey: '',
  });

  const sections: SettingsSection[] = [
    {
      id: 'general',
      title: 'Algemene Instellingen',
      icon: Globe,
      description: 'Website naam, URL, taal en tijdzone'
    },
    {
      id: 'email',
      title: 'Email Configuratie',
      icon: Mail,
      description: 'SMTP en email notificatie instellingen'
    },
    {
      id: 'payments',
      title: 'Betalingen',
      icon: CreditCard,
      description: 'Payment providers en API keys'
    },
    {
      id: 'shipping',
      title: 'Verzending',
      icon: Truck,
      description: 'Verzendmethoden en kosten'
    },
    {
      id: 'tax',
      title: 'Belastingen',
      icon: Receipt,
      description: 'BTW en tax instellingen'
    },
    {
      id: 'inventory',
      title: 'Voorraad',
      icon: Database,
      description: 'Voorraad beheer en alerts'
    },
    {
      id: 'notifications',
      title: 'Notificaties',
      icon: Bell,
      description: 'Email en systeem notificaties'
    },
    {
      id: 'security',
      title: 'Beveiliging',
      icon: Shield,
      description: 'API keys en security instellingen'
    },
    {
      id: 'analytics',
      title: 'Analytics Platforms',
      icon: BarChart3,
      description: 'Google Ads, Facebook Ads, Snapchat, Clarity, Merchant Center'
    },
    {
      id: 'appearance',
      title: 'Uiterlijk',
      icon: Palette,
      description: 'Thema en styling opties'
    },
    {
      id: 'users',
      title: 'Gebruikers',
      icon: Users,
      description: 'Admin accounts en rollen'
    },
  ];

  const handleSave = () => {
    localStorage.setItem('cmsSettings', JSON.stringify(settings));
    alert('✅ Instellingen opgeslagen!');
  };

  const handleReset = () => {
    if (window.confirm('Weet je zeker dat je alle instellingen wilt resetten?')) {
      localStorage.removeItem('cmsSettings');
      window.location.reload();
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Website Gegevens</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website Naam</label>
            <input
              type="text"
              className="input-field"
              value={settings.siteName}
              onChange={(e) => updateSetting('siteName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <input
              type="url"
              className="input-field"
              value={settings.siteUrl}
              onChange={(e) => updateSetting('siteUrl', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              className="input-field"
              value={settings.contactEmail}
              onChange={(e) => updateSetting('contactEmail', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tijdzone</label>
              <select className="input-field" value={settings.timezone} onChange={(e) => updateSetting('timezone', e.target.value)}>
                <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                <option value="Europe/Brussels">Europe/Brussels</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valuta</label>
              <select className="input-field" value={settings.currency} onChange={(e) => updateSetting('currency', e.target.value)}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Provider</h3>
        <select className="input-field mb-4" value={settings.emailProvider} onChange={(e) => updateSetting('emailProvider', e.target.value)}>
          <option value="smtp">SMTP</option>
          <option value="sendgrid">SendGrid</option>
          <option value="mailgun">Mailgun</option>
        </select>
        
        {settings.emailProvider === 'smtp' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                <input type="text" className="input-field" value={settings.smtpHost} onChange={(e) => updateSetting('smtpHost', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                <input type="text" className="input-field" value={settings.smtpPort} onChange={(e) => updateSetting('smtpPort', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
              <input type="text" className="input-field" value={settings.smtpUser} onChange={(e) => updateSetting('smtpUser', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
              <input type="password" className="input-field" value={settings.smtpPass} onChange={(e) => updateSetting('smtpPass', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Provider</h3>
        <select className="input-field mb-4" value={settings.paymentProvider} onChange={(e) => updateSetting('paymentProvider', e.target.value)}>
          <option value="stripe">Stripe</option>
          <option value="mollie">Mollie</option>
          <option value="paypal">PayPal</option>
        </select>

        {settings.paymentProvider === 'stripe' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Public Key</label>
              <input type="text" className="input-field" placeholder="pk_test_..." value={settings.stripePublicKey} onChange={(e) => updateSetting('stripePublicKey', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Secret Key</label>
              <input type="password" className="input-field" placeholder="sk_test_..." value={settings.stripeSecretKey} onChange={(e) => updateSetting('stripeSecretKey', e.target.value)} />
            </div>
          </div>
        )}

        {settings.paymentProvider === 'mollie' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mollie API Key</label>
            <input type="password" className="input-field" placeholder="test_..." value={settings.mollieApiKey} onChange={(e) => updateSetting('mollieApiKey', e.target.value)} />
          </div>
        )}
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verzending Instellingen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verzend Provider</label>
            <select className="input-field" value={settings.shippingProvider} onChange={(e) => updateSetting('shippingProvider', e.target.value)}>
              <option value="dhl">DHL</option>
              <option value="postnl">PostNL</option>
              <option value="ups">UPS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standaard Verzendkosten (€)</label>
            <input type="number" step="0.01" className="input-field" value={settings.defaultShippingCost} onChange={(e) => updateSetting('defaultShippingCost', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gratis Verzending vanaf (€)</label>
            <input type="number" className="input-field" value={settings.freeShippingThreshold} onChange={(e) => updateSetting('freeShippingThreshold', parseInt(e.target.value))} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Belasting Instellingen</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="taxEnabled"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.taxEnabled}
              onChange={(e) => updateSetting('taxEnabled', e.target.checked)}
            />
            <label htmlFor="taxEnabled" className="ml-2 text-sm text-gray-700">BTW berekening inschakelen</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standaard BTW Tarief (%)</label>
            <input type="number" className="input-field" value={settings.defaultTaxRate} onChange={(e) => updateSetting('defaultTaxRate', parseInt(e.target.value))} />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="taxIncluded"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.taxIncluded}
              onChange={(e) => updateSetting('taxIncluded', e.target.checked)}
            />
            <label htmlFor="taxIncluded" className="ml-2 text-sm text-gray-700">Prijzen zijn inclusief BTW</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventorySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Voorraad Beheer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lage Voorraad Drempel</label>
            <input type="number" className="input-field" value={settings.lowStockThreshold} onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))} />
            <p className="text-xs text-gray-500 mt-1">Waarschuwing wanneer voorraad onder dit aantal komt</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Uit Voorraad Bericht</label>
            <input type="text" className="input-field" value={settings.outOfStockMessage} onChange={(e) => updateSetting('outOfStockMessage', e.target.value)} />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="backorders"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.backordersAllowed}
              onChange={(e) => updateSetting('backordersAllowed', e.target.checked)}
            />
            <label htmlFor="backorders" className="ml-2 text-sm text-gray-700">Backorders toestaan</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notificaties</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Nieuwe Bestellingen</p>
              <p className="text-xs text-gray-600">Stuur email bij nieuwe order</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.orderEmailEnabled}
              onChange={(e) => updateSetting('orderEmailEnabled', e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Lage Voorraad Alerts</p>
              <p className="text-xs text-gray-600">Email bij lage voorraad</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.lowStockAlerts}
              onChange={(e) => updateSetting('lowStockAlerts', e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Klant Registratie</p>
              <p className="text-xs text-gray-600">Welkomst email naar nieuwe klanten</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.customerRegistrationEmail}
              onChange={(e) => updateSetting('customerRegistrationEmail', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API & Beveiliging</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div className="flex gap-2">
              <input type="text" className="input-field flex-1" value={settings.apiKey} readOnly />
              <button className="btn-secondary">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Gebruikt voor API authenticatie</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minuten)</label>
            <input type="number" className="input-field" value={settings.sessionTimeout} onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))} />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="2fa"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.twoFactorAuth}
              onChange={(e) => updateSetting('twoFactorAuth', e.target.checked)}
            />
            <label htmlFor="2fa" className="ml-2 text-sm text-gray-700">Twee-Factor Authenticatie (2FA)</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsSettings = () => (
    <div className="space-y-8">
      {/* Google Ads */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Ads</h3>
              <p className="text-sm text-gray-600">Verbind met Google Ads API</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            checked={settings.googleAdsEnabled}
            onChange={(e) => updateSetting('googleAdsEnabled', e.target.checked)}
          />
        </div>
        {settings.googleAdsEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="123456789.apps.googleusercontent.com"
                value={settings.googleAdsClientId} 
                onChange={(e) => updateSetting('googleAdsClientId', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="GOCSPX-..."
                value={settings.googleAdsClientSecret} 
                onChange={(e) => updateSetting('googleAdsClientSecret', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Token</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="1//..."
                value={settings.googleAdsRefreshToken} 
                onChange={(e) => updateSetting('googleAdsRefreshToken', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Facebook Ads */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📘</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Facebook Ads</h3>
              <p className="text-sm text-gray-600">Verbind met Facebook Marketing API</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            checked={settings.facebookAdsEnabled}
            onChange={(e) => updateSetting('facebookAdsEnabled', e.target.checked)}
          />
        </div>
        {settings.facebookAdsEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="EAABsb..."
                value={settings.facebookAdsAccessToken} 
                onChange={(e) => updateSetting('facebookAdsAccessToken', e.target.value)} 
              />
              <p className="text-xs text-gray-500 mt-1">
                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Verkrijg Access Token →
                </a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad Account ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="act_123456789"
                value={settings.facebookAdsAccountId} 
                onChange={(e) => updateSetting('facebookAdsAccountId', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Snapchat Ads */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👻</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Snapchat Ads</h3>
              <p className="text-sm text-gray-600">Verbind met Snapchat Marketing API</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            checked={settings.snapchatAdsEnabled}
            onChange={(e) => updateSetting('snapchatAdsEnabled', e.target.checked)}
          />
        </div>
        {settings.snapchatAdsEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="eyJhb..."
                value={settings.snapchatAdsApiToken} 
                onChange={(e) => updateSetting('snapchatAdsApiToken', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad Account ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="ad-account-id"
                value={settings.snapchatAdsAdAccountId} 
                onChange={(e) => updateSetting('snapchatAdsAdAccountId', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Microsoft Clarity */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Microsoft Clarity</h3>
              <p className="text-sm text-gray-600">Website heatmaps en session recordings</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            checked={settings.clarityEnabled}
            onChange={(e) => updateSetting('clarityEnabled', e.target.checked)}
          />
        </div>
        {settings.clarityEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="abc123def456"
                value={settings.clarityProjectId} 
                onChange={(e) => updateSetting('clarityProjectId', e.target.value)} 
              />
              <p className="text-xs text-gray-500 mt-1">
                <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Vind je Project ID →
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Google Merchant Center */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🛍️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Google Merchant Center</h3>
              <p className="text-sm text-gray-600">Product feed voor Google Shopping</p>
            </div>
          </div>
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            checked={settings.merchantCenterEnabled}
            onChange={(e) => updateSetting('merchantCenterEnabled', e.target.checked)}
          />
        </div>
        {settings.merchantCenterEnabled && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Account ID</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="123456789"
                value={settings.merchantCenterAccountId} 
                onChange={(e) => updateSetting('merchantCenterAccountId', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content API Key</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="AIza..."
                value={settings.merchantCenterApiKey} 
                onChange={(e) => updateSetting('merchantCenterApiKey', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Analytics Dashboard</h4>
            <p className="text-sm text-blue-700 mt-1">
              Nadat je de platforms hebt geconfigureerd, kun je realtime analytics bekijken op de Analytics pagina.
              De integraties worden automatisch gesynchroniseerd elk uur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'email': return renderEmailSettings();
      case 'payments': return renderPaymentSettings();
      case 'shipping': return renderShippingSettings();
      case 'tax': return renderTaxSettings();
      case 'inventory': return renderInventorySettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'analytics': return renderAnalyticsSettings();
      case 'appearance':
        return <div className="text-center py-12 text-gray-500">Thema instellingen komen binnenkort...</div>;
      case 'users':
        return <div className="text-center py-12 text-gray-500">Gebruikersbeheer komt binnenkort...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configureer je CMS systeem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                  activeSection === section.id
                    ? 'bg-primary-100 text-primary-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <section.icon className="h-5 w-5" />
                <span className="text-sm">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {sections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>

            {renderContent()}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
              <button onClick={handleReset} className="btn-secondary text-red-600 hover:bg-red-50">
                Reset naar standaard
              </button>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save className="h-4 w-4" />
                Instellingen Opslaan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


