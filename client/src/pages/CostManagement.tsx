import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  Building,
  Users,
  Zap,
  Shield,
  Briefcase,
  CreditCard,
  Laptop
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StatsCard from '../components/Dashboard/StatsCard';
import { costsApi } from '../services/api';

interface FixedCost {
  id: number;
  name: string;
  description?: string;
  category: string;
  amount: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
}

interface CostSummary {
  category: string;
  cost_items: number;
  monthly_total: number;
  yearly_total: number;
}

const CostManagement: React.FC = () => {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [summary, setSummary] = useState<CostSummary[]>([]);
  const [totals, setTotals] = useState({ total_items: 0, total_monthly: 0, total_yearly: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [activeTab, setActiveTab] = useState<'costs' | 'payments'>('costs');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Huisvesting',
    amount: '',
    billing_cycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  const categories = [
    { name: 'Huisvesting', icon: Building, color: 'blue' },
    { name: 'Personeel', icon: Users, color: 'green' },
    { name: 'Utilities', icon: Zap, color: 'yellow' },
    { name: 'Verzekeringen', icon: Shield, color: 'purple' },
    { name: 'Software', icon: Laptop, color: 'indigo' },
    { name: 'Overig', icon: Briefcase, color: 'gray' }
  ];

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const [costsResponse, summaryResponse] = await Promise.all([
        costsApi.getFixedCosts(),
        costsApi.getFixedCostsSummary()
      ]);
      setCosts(costsResponse.data.fixed_costs || []);
      setSummary(summaryResponse.data.summary || []);
      setTotals(summaryResponse.data.totals || { total_items: 0, total_monthly: 0, total_yearly: 0 });
    } catch (error) {
      console.error('Error fetching costs:', error);
      
      // No mock data - set empty arrays
      setCosts([]);
      setSummary([]);
      setTotals({ total_items: 0, total_monthly: 0, total_yearly: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const costData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingCost) {
        await costsApi.updateFixedCost(editingCost.id, costData);
      } else {
        await costsApi.createFixedCost(costData);
      }
      
      setShowAddModal(false);
      setEditingCost(null);
      setFormData({
        name: '',
        description: '',
        category: 'Huisvesting',
        amount: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      });
      
      await fetchCosts();
    } catch (error) {
      console.error('Error saving cost:', error);
      alert('Er is een fout opgetreden bij het opslaan.');
    }
  };

  const handleEdit = (cost: FixedCost) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      description: cost.description || '',
      category: cost.category,
      amount: cost.amount.toString(),
      billing_cycle: cost.billing_cycle,
      start_date: cost.start_date,
      end_date: cost.end_date || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Weet je zeker dat je deze kost wilt verwijderen?')) {
      try {
        await costsApi.deleteFixedCost(id);
        await fetchCosts();
      } catch (error) {
        console.error('Error deleting cost:', error);
        alert('Er is een fout opgetreden bij het verwijderen.');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Maandelijks';
      case 'quarterly': return 'Kwartaal';
      case 'yearly': return 'Jaarlijks';
      default: return cycle;
    }
  };

  if (loading) {
    return (
      <Layout title="Financiën">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // Mock payment providers data
  const paymentProviders = [
    { id: 1, name: 'Stripe', type: 'Credit Card', fee: '2.9% + €0.30', status: 'active', monthly_volume: 15420 },
    { id: 2, name: 'PayPal', type: 'Digital Wallet', fee: '3.4% + €0.35', status: 'active', monthly_volume: 8950 },
    { id: 3, name: 'iDEAL', type: 'Bank Transfer', fee: '€0.29', status: 'active', monthly_volume: 12300 },
    { id: 4, name: 'Bancontact', type: 'Bank Transfer', fee: '€0.31', status: 'active', monthly_volume: 3200 },
    { id: 5, name: 'SEPA', type: 'Bank Transfer', fee: '€0.23', status: 'inactive', monthly_volume: 0 }
  ];

  return (
    <Layout title="Financiën">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'costs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4 inline mr-2" />
              Kostenbeheer
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Payment Providers
            </button>
          </nav>
        </div>

        {activeTab === 'costs' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Kostenbeheer</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Beheer alle vaste kosten en uitgaven van je bedrijf
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Kost
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Totaal Items"
                value={totals.total_items.toString()}
                icon={Briefcase}
                color="blue"
              />
              <StatsCard
                title="Maandelijkse Kosten"
                value={formatCurrency(totals.total_monthly)}
                icon={Calendar}
                color="green"
              />
              <StatsCard
                title="Jaarlijkse Kosten"
                value={formatCurrency(totals.total_yearly)}
                icon={DollarSign}
                color="purple"
              />
              <StatsCard
                title="Categorieën"
                value={summary.length.toString()}
                icon={Building}
                color="yellow"
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {summary.map((item) => {
                const category = categories.find(c => c.name === item.category) || categories[categories.length - 1];
                const Icon = category.icon;
                
                return (
                  <div key={item.category} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`p-3 rounded-md bg-${category.color}-50 text-${category.color}-600`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {item.category}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {formatCurrency(item.monthly_total)}/maand
                            </dd>
                          </dl>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm text-gray-600">
                          {item.cost_items} items • {formatCurrency(item.yearly_total)}/jaar
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Costs Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Alle Vaste Kosten</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Naam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categorie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bedrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cyclus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Startdatum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cost.name}</div>
                          {cost.description && (
                            <div className="text-sm text-gray-500">{cost.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {cost.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cost.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBillingCycleText(cost.billing_cycle)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(cost.start_date).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cost.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cost.is_active ? 'Actief' : 'Inactief'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(cost)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cost.id)}
                              className="text-red-600 hover:text-red-900"
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
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingCost ? 'Vaste Kost Bewerken' : 'Nieuwe Vaste Kost'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Naam</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Beschrijving</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={2}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Categorie</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bedrag (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Factureringscyclus</label>
                        <select
                          value={formData.billing_cycle}
                          onChange={(e) => setFormData({...formData, billing_cycle: e.target.value as any})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="monthly">Maandelijks</option>
                          <option value="quarterly">Kwartaal</option>
                          <option value="yearly">Jaarlijks</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Startdatum</label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            setEditingCost(null);
                            setFormData({
                              name: '',
                              description: '',
                              category: 'Huisvesting',
                              amount: '',
                              billing_cycle: 'monthly',
                              start_date: new Date().toISOString().split('T')[0],
                              end_date: ''
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Annuleren
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          {editingCost ? 'Bijwerken' : 'Toevoegen'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Totaal Volume"
                value="€39.870"
                icon={CreditCard}
                change="+8.2%"
                changeType="positive"
              />
              <StatsCard
                title="Transacties"
                value="1.247"
                icon={Building}
                change="+12.1%"
                changeType="positive"
              />
              <StatsCard
                title="Gem. Transactie"
                value="€31.97"
                icon={DollarSign}
                change="+2.3%"
                changeType="positive"
              />
              <StatsCard
                title="Totale Fees"
                value="€1.158"
                icon={Briefcase}
                change="-1.2%"
                changeType="negative"
              />
            </div>

            {/* Payment Providers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Payment Providers</h3>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Provider Toevoegen
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fees
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Maandelijks Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentProviders.map((provider) => (
                      <tr key={provider.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.fee}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{provider.monthly_volume.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            provider.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.status === 'active' ? 'Actief' : 'Inactief'}
                          </span>
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

            {/* Payment Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Payment Inzichten</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💳 Performance:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• iDEAL heeft hoogste volume (€12.300)</li>
                    <li>• Stripe heeft beste conversie rate</li>
                    <li>• PayPal heeft hoogste fees (3.4%)</li>
                    <li>• SEPA is momenteel inactief</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🎯 Optimalisatie:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Overweeg SEPA activatie (lagere fees)</li>
                    <li>• Promoot iDEAL voor NL klanten</li>
                    <li>• Monitor PayPal fees vs conversie</li>
                    <li>• Test nieuwe payment providers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CostManagement;