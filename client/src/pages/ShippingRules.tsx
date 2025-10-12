import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Truck, 
  Package,
  Globe,
  Calculator,
  Save,
  X
} from 'lucide-react';
import Layout from '../components/Layout/Layout';

interface ShippingRule {
  id?: number;
  name: string;
  country: string;
  min_weight: number;
  max_weight: number;
  min_order_value: number;
  max_order_value: number;
  shipping_cost: number;
  free_shipping_threshold?: number;
  description?: string;
}

const ShippingRules: React.FC = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [formData, setFormData] = useState<ShippingRule>({
    name: '',
    country: 'Nederland',
    min_weight: 0,
    max_weight: 1000,
    min_order_value: 0,
    max_order_value: 999999,
    shipping_cost: 4.95,
    free_shipping_threshold: 50,
    description: ''
  });

  // No mock shipping rules - empty array
  const mockRules: ShippingRule[] = [];

  useEffect(() => {
    // In real app: fetchShippingRules();
    setRules(mockRules);
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        // Update existing rule
        const response = await fetch(`/api/shipping/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          setRules(rules.map(rule => 
            rule.id === editingRule.id ? { ...formData, id: editingRule.id } : rule
          ));
          alert('✅ Verzendregel succesvol bijgewerkt!');
        } else {
          alert('❌ Fout bij bijwerken verzendregel');
        }
      } else {
        // Add new rule
        const response = await fetch('/api/shipping/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          const newRule = { ...formData, id: data.ruleId };
          setRules([...rules, newRule]);
          alert('✅ Nieuwe verzendregel succesvol toegevoegd!');
        } else {
          alert('❌ Fout bij toevoegen verzendregel');
        }
      }
      
      setShowAddModal(false);
      setEditingRule(null);
      resetForm();
      
    } catch (error) {
      console.error('Error saving shipping rule:', error);
      // Demo mode fallback
      if (editingRule) {
        setRules(rules.map(rule => 
          rule.id === editingRule.id ? { ...formData, id: editingRule.id } : rule
        ));
        alert('✅ Demo: Verzendregel bijgewerkt!');
      } else {
        const newRule = { ...formData, id: Date.now() };
        setRules([...rules, newRule]);
        alert('✅ Demo: Nieuwe verzendregel toegevoegd!');
      }
      
      setShowAddModal(false);
      setEditingRule(null);
      resetForm();
    }
  };

  const handleEdit = (rule: ShippingRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Weet je zeker dat je deze verzendregel wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`/api/shipping/rules/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setRules(rules.filter(rule => rule.id !== id));
        alert('✅ Verzendregel succesvol verwijderd!');
      } else {
        alert('❌ Fout bij verwijderen verzendregel');
      }
    } catch (error) {
      console.error('Error deleting shipping rule:', error);
      // Demo mode fallback
      setRules(rules.filter(rule => rule.id !== id));
      alert('✅ Demo: Verzendregel verwijderd!');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      country: 'Nederland',
      min_weight: 0,
      max_weight: 1000,
      min_order_value: 0,
      max_order_value: 999999,
      shipping_cost: 4.95,
      free_shipping_threshold: 50,
      description: ''
    });
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

  const testShippingRule = () => {
    const testWeight = 750; // grams
    const testOrderValue = 35; // euros
    const testCountry = 'Nederland';

    const applicableRules = rules.filter(rule => 
      rule.country === testCountry &&
      testWeight >= rule.min_weight &&
      testWeight <= rule.max_weight &&
      testOrderValue >= rule.min_order_value &&
      testOrderValue <= rule.max_order_value
    ).sort((a, b) => a.shipping_cost - b.shipping_cost);

    const bestRule = applicableRules[0];
    
    if (bestRule) {
      const finalCost = bestRule.free_shipping_threshold && testOrderValue >= bestRule.free_shipping_threshold 
        ? 0 : bestRule.shipping_cost;
      
      alert(`Test resultaat:\nGewicht: ${formatWeight(testWeight)}\nBestelwaarde: ${formatCurrency(testOrderValue)}\nLand: ${testCountry}\n\nToepasselijke regel: ${bestRule.name}\nVerzendkosten: ${formatCurrency(finalCost)}`);
    } else {
      alert('Geen toepasselijke verzendregel gevonden voor deze test parameters');
    }
  };

  if (loading) {
    return (
      <Layout title="Verzendregels">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Verzendregels">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Verzendregels Beheer</h1>
            <p className="mt-1 text-sm text-gray-500">
              Stel verzendkosten in voor verschillende pakkettypes en landen
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={testShippingRule}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Test Regels
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Regel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Totaal Regels</p>
                <p className="text-2xl font-semibold text-gray-900">{rules.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Landen</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(rules.map(r => r.country)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Kleine Pakketten</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {rules.filter(r => r.max_weight <= 500).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Grote Pakketten</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {rules.filter(r => r.max_weight > 2000).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Rules Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actieve Verzendregels</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regel Naam
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
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-gray-500">{rule.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{rule.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <span>{formatWeight(rule.min_weight)} - {formatWeight(rule.max_weight)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(rule.min_order_value)} - {rule.max_order_value >= 999999 ? '∞' : formatCurrency(rule.max_order_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${rule.shipping_cost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {rule.shipping_cost === 0 ? 'GRATIS' : formatCurrency(rule.shipping_cost)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.free_shipping_threshold ? formatCurrency(rule.free_shipping_threshold) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Bewerken"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Verwijderen"
                        >
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

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingRule ? 'Verzendregel Bewerken' : 'Nieuwe Verzendregel'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Regel Naam *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="bijv. Nederland - Kleine pakketten"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Land *</label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="Nederland">Nederland</option>
                        <option value="België">België</option>
                        <option value="Duitsland">Duitsland</option>
                        <option value="Frankrijk">Frankrijk</option>
                        <option value="EU">EU (Overig)</option>
                        <option value="Internationaal">Internationaal</option>
                      </select>
                    </div>
                  </div>

                  {/* Weight Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gewicht Range (gram)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Minimum gewicht</label>
                        <input
                          type="number"
                          value={formData.min_weight}
                          onChange={(e) => setFormData({...formData, min_weight: parseInt(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Maximum gewicht</label>
                        <input
                          type="number"
                          value={formData.max_weight}
                          onChange={(e) => setFormData({...formData, max_weight: parseInt(e.target.value) || 1000})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          min="1"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Huidige range: {formatWeight(formData.min_weight)} - {formatWeight(formData.max_weight)}
                    </p>
                  </div>

                  {/* Order Value Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bestelwaarde Range (€)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Minimum bestelwaarde</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.min_order_value}
                          onChange={(e) => setFormData({...formData, min_order_value: parseFloat(e.target.value) || 0})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Maximum bestelwaarde</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.max_order_value >= 999999 ? '' : formData.max_order_value}
                          onChange={(e) => setFormData({...formData, max_order_value: parseFloat(e.target.value) || 999999})}
                          placeholder="Onbeperkt"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Verzendkosten (€) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.shipping_cost}
                        onChange={(e) => setFormData({...formData, shipping_cost: parseFloat(e.target.value) || 0})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gratis verzending vanaf (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.free_shipping_threshold || ''}
                        onChange={(e) => setFormData({...formData, free_shipping_threshold: parseFloat(e.target.value) || undefined})}
                        placeholder="Optioneel"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      placeholder="Optionele beschrijving van deze verzendregel"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Regel Preview:</h4>
                    <p className="text-sm text-gray-700">
                      <strong>{formData.name || 'Nieuwe regel'}</strong> geldt voor pakketten van{' '}
                      <strong>{formatWeight(formData.min_weight)}</strong> tot{' '}
                      <strong>{formatWeight(formData.max_weight)}</strong> naar{' '}
                      <strong>{formData.country}</strong> bij bestellingen van{' '}
                      <strong>{formatCurrency(formData.min_order_value)}</strong> tot{' '}
                      <strong>{formData.max_order_value >= 999999 ? '∞' : formatCurrency(formData.max_order_value)}</strong>.
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Verzendkosten: <strong className={formData.shipping_cost === 0 ? 'text-green-600' : 'text-gray-900'}>
                        {formData.shipping_cost === 0 ? 'GRATIS' : formatCurrency(formData.shipping_cost)}
                      </strong>
                      {formData.free_shipping_threshold && (
                        <span> (gratis vanaf {formatCurrency(formData.free_shipping_threshold)})</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingRule(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingRule ? 'Bijwerken' : 'Toevoegen'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShippingRules;
