import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Calculator, 
  Plus, 
  Edit, 
  Trash2,
  Package,
  Globe,
  DollarSign,
  Percent
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { shippingApi } from '../services/api';

interface ShippingRule {
  id: number;
  name: string;
  country: string;
  min_weight: number;
  max_weight: number;
  min_order_value: number;
  max_order_value: number;
  shipping_cost: number;
  free_shipping_threshold?: number;
}

interface TaxRule {
  id: number;
  name: string;
  country: string;
  tax_rate: number;
  applies_to: string;
  product_category?: string;
}

const ShippingTax: React.FC = () => {
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shipping' | 'tax' | 'rules'>('shipping');
  
  // Calculator states
  const [shippingCalc, setShippingCalc] = useState({
    country: 'Nederland',
    weight: '500',
    orderValue: '75.00'
  });
  const [shippingResult, setShippingResult] = useState<any>(null);
  
  const [taxCalc, setTaxCalc] = useState({
    country: 'Nederland',
    subtotal: '100.00'
  });
  const [taxResult, setTaxResult] = useState<any>(null);

  // No mock data - empty arrays
  const mockShippingRules: ShippingRule[] = [];
  const mockTaxRules: TaxRule[] = [];

  useEffect(() => {
    setShippingRules(mockShippingRules);
    setTaxRules(mockTaxRules);
    setLoading(false);
  }, []);

  const calculateShipping = async () => {
    try {
      const response = await shippingApi.calculateShipping({
        country: shippingCalc.country,
        items: [{ sku: 'TEST-001', quantity: 1 }],
        total_value: parseFloat(shippingCalc.orderValue)
      });

      setShippingResult(response.data);
    } catch (error) {
      console.error('Shipping calculation error:', error);
      
      // Demo calculation fallback
      const weight = parseInt(shippingCalc.weight);
      const orderValue = parseFloat(shippingCalc.orderValue);
      const country = shippingCalc.country;
        
      let cost = 4.95;
      let freeThreshold = 50;
      
      if (country === 'België') { cost = 6.95; freeThreshold = 75; }
      else if (country === 'Duitsland') { cost = 9.95; freeThreshold = 100; }
      
      if (weight > 1000) cost += 2.00;
      if (orderValue >= freeThreshold) cost = 0;
      
      setShippingResult({
        shipping_cost: cost,
        free_shipping: cost === 0,
        shipping_rule: `${country} ${weight > 1000 ? 'Zwaar' : 'Standaard'}`,
        free_shipping_threshold: freeThreshold,
        amount_for_free_shipping: Math.max(0, freeThreshold - orderValue)
      });
    }
  };

  const calculateTax = async () => {
    try {
      const response = await shippingApi.calculateTax({
        country: taxCalc.country,
        items: [{ sku: 'TEST-001', total_price: parseFloat(taxCalc.subtotal) }],
        subtotal: parseFloat(taxCalc.subtotal)
      });

      setTaxResult(response.data);
    } catch (error) {
      console.error('Tax calculation error:', error);
      
      // Demo calculation fallback
      const subtotal = parseFloat(taxCalc.subtotal);
      const country = taxCalc.country;
      
      let taxRate = 21;
      if (country === 'België') taxRate = 21;
      else if (country === 'Duitsland') taxRate = 19;
      else if (country === 'Frankrijk') taxRate = 20;
      
      const taxAmount = (subtotal * taxRate) / 100;
      
      setTaxResult({
        tax_amount: taxAmount,
        tax_rate: taxRate,
        total_with_tax: subtotal + taxAmount,
        country: country
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)} kg`;
    }
    return `${grams} g`;
  };

  if (loading) {
    return (
      <Layout title="Verzending & Belasting">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Verzending">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Verzending & Belasting</h1>
            <p className="mt-1 text-sm text-gray-500">
              Beheer verzendkosten en belastingregels per land
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'shipping' ? 'Nieuwe Verzendregel' : 'Nieuwe Belastingregel'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shipping'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="h-4 w-4 inline mr-2" />
              Verzendregels
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tax'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calculator className="h-4 w-4 inline mr-2" />
              Belastingregels
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Verzendregels
            </button>
          </nav>
        </div>

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {/* Shipping Calculator */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 text-blue-500 mr-2" />
                Verzendkosten Calculator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Land</label>
                  <select 
                    value={shippingCalc.country}
                    onChange={(e) => setShippingCalc({...shippingCalc, country: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Nederland">Nederland</option>
                    <option value="België">België</option>
                    <option value="Duitsland">Duitsland</option>
                    <option value="Frankrijk">Frankrijk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gewicht (gram)</label>
                  <input
                    type="number"
                    value={shippingCalc.weight}
                    onChange={(e) => setShippingCalc({...shippingCalc, weight: e.target.value})}
                    placeholder="500"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bestelwaarde (€)</label>
                  <input
                    type="number"
                    value={shippingCalc.orderValue}
                    onChange={(e) => setShippingCalc({...shippingCalc, orderValue: e.target.value})}
                    placeholder="75.00"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={calculateShipping}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Bereken Verzendkosten
                  </button>
                </div>
              </div>
              {shippingResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-700">
                    <strong className="text-green-800">✅ Berekening Resultaat:</strong>
                    <div className="mt-2 space-y-1">
                      <p><strong>Verzendkosten:</strong> {shippingResult.free_shipping ? '🆓 GRATIS' : formatCurrency(shippingResult.shipping_cost)}</p>
                      <p><strong>Regel:</strong> {shippingResult.shipping_rule}</p>
                      {shippingResult.free_shipping_threshold && (
                        <p><strong>Gratis vanaf:</strong> {formatCurrency(shippingResult.free_shipping_threshold)}</p>
                      )}
                      {shippingResult.amount_for_free_shipping > 0 && (
                        <p className="text-blue-600"><strong>Nog nodig voor gratis:</strong> {formatCurrency(shippingResult.amount_for_free_shipping)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping Rules Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Verzendregels</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Regel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Land
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gewicht Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bestelwaarde Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verzendkosten
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gratis vanaf
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippingRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{rule.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatWeight(rule.min_weight)} - {formatWeight(rule.max_weight)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(rule.min_order_value)} - {formatCurrency(rule.max_order_value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rule.shipping_cost === 0 ? 'GRATIS' : formatCurrency(rule.shipping_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rule.free_shipping_threshold ? formatCurrency(rule.free_shipping_threshold) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-6">
            {/* Tax Calculator */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calculator className="h-5 w-5 text-green-500 mr-2" />
                Belasting Calculator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Land</label>
                  <select 
                    value={taxCalc.country}
                    onChange={(e) => setTaxCalc({...taxCalc, country: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Nederland">Nederland (21%)</option>
                    <option value="België">België (21%)</option>
                    <option value="Duitsland">Duitsland (19%)</option>
                    <option value="Frankrijk">Frankrijk (20%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subtotaal (€)</label>
                  <input
                    type="number"
                    value={taxCalc.subtotal}
                    onChange={(e) => setTaxCalc({...taxCalc, subtotal: e.target.value})}
                    placeholder="100.00"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={calculateTax}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Bereken BTW
                  </button>
                </div>
              </div>
              {taxResult && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-700">
                    <strong className="text-green-800">✅ BTW Berekening:</strong>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <span className="text-gray-600">Subtotaal:</span>
                        <span className="ml-2 font-medium">{formatCurrency(parseFloat(taxCalc.subtotal))}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">BTW ({taxResult.tax_rate}%):</span>
                        <span className="ml-2 font-medium text-blue-600">{formatCurrency(taxResult.tax_amount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Totaal:</span>
                        <span className="ml-2 font-bold text-green-600">{formatCurrency(taxResult.total_with_tax)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tax Rules Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Belastingregels</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Regel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Land
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Belastingpercentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Geldt voor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorie
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{rule.country}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Percent className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{rule.tax_rate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rule.applies_to === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {rule.applies_to === 'all' ? 'Alle producten' : 'Specifieke categorie'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rule.product_category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Advanced Shipping Rules */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Geavanceerde Verzendregels</h3>
                <p className="mt-1 text-sm text-gray-500">Configureer complexe verzendlogica en automatische regels</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Auto Rules */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">📦 Automatische Regels</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Gratis verzending &gt; €50</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actief</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Express verzending weekends</span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Gepland</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Bulk discount &gt; 10 items</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Actief</span>
                      </div>
                    </div>
                  </div>

                  {/* Zone Rules */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">🌍 Zone Regels</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">EU Zone - Standaard</span>
                        <span className="text-sm font-medium text-gray-900">€12.95</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Nederland - Express</span>
                        <span className="text-sm font-medium text-gray-900">€7.95</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Rest van Wereld</span>
                        <span className="text-sm font-medium text-gray-900">€24.95</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule Builder */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">🔧 Regel Builder</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Conditie</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                          <option>Bestelwaarde</option>
                          <option>Gewicht</option>
                          <option>Aantal items</option>
                          <option>Postcode</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Operator</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                          <option>Groter dan</option>
                          <option>Kleiner dan</option>
                          <option>Gelijk aan</option>
                          <option>Tussen</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Waarde</label>
                        <input
                          type="text"
                          placeholder="50.00"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Actie</label>
                        <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                          <option>Gratis verzending</option>
                          <option>Korting %</option>
                          <option>Vaste korting</option>
                          <option>Alternatieve service</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
                        Regel Toevoegen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Actieve Verzendregels</p>
                <p className="text-2xl font-semibold text-gray-900">{shippingRules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calculator className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Belastingregels</p>
                <p className="text-2xl font-semibold text-gray-900">{taxRules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Ondersteunde Landen</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set([...shippingRules.map(r => r.country), ...taxRules.map(r => r.country)]).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingTax;
