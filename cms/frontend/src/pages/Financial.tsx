import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  PieChart,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:2000/api';
const API_KEY = process.env.REACT_APP_API_KEY || 'dev-api-key-123';

const Financial: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [overview, setOverview] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);
  const [profitTimeline, setProfitTimeline] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [overviewRes, productsRes, revenueRes, profitRes, categoriesRes, stockRes] = await Promise.all([
        axios.get(`${API_BASE}/financial/overview?period=${period}`, {
          headers: { 'x-api-key': API_KEY }
        }),
        axios.get(`${API_BASE}/financial/profit-by-product?limit=10`, {
          headers: { 'x-api-key': API_KEY }
        }),
        axios.get(`${API_BASE}/financial/revenue-over-time?days=30`, {
          headers: { 'x-api-key': API_KEY }
        }),
        axios.get(`${API_BASE}/financial/profit-over-time?days=30`, {
          headers: { 'x-api-key': API_KEY }
        }),
        axios.get(`${API_BASE}/financial/category-performance`, {
          headers: { 'x-api-key': API_KEY }
        }),
        axios.get(`${API_BASE}/financial/low-stock`, {
          headers: { 'x-api-key': API_KEY }
        })
      ]);

      setOverview(overviewRes.data);
      setTopProducts(productsRes.data.products || []);
      setRevenueTimeline(revenueRes.data.timeline || []);
      setProfitTimeline(profitRes.data.timeline || []);
      setCategoryPerformance(categoriesRes.data.categories || []);
      setLowStock(stockRes.data.products || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading financial data...</p>
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
            <DollarSign className="text-green-600" size={36} />
            Financieel Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Complete winst & omzet analyse in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Vandaag</option>
            <option value="week">Deze Week</option>
            <option value="month">Deze Maand</option>
            <option value="year">Dit Jaar</option>
            <option value="all">Altijd</option>
          </select>
          <button
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={18} />
            Vernieuw
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      {overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gross Profit */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={24} />
                  <p className="text-green-100 text-sm font-medium">BRUTO WINST</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(overview.profit.grossProfitCents)}</p>
              <p className="text-green-100 text-sm mt-2">
                Winstmarge: {formatPercentage(overview.profit.marginPercentage)}
              </p>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={24} />
                  <p className="text-blue-100 text-sm font-medium">OMZET</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(overview.revenue.totalCents)}</p>
              <p className="text-blue-100 text-sm mt-2">
                {overview.orderCount} bestellingen
              </p>
            </div>

            {/* Costs */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={24} />
                  <p className="text-orange-100 text-sm font-medium">KOSTEN</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(overview.costs.productCostCents)}</p>
              <p className="text-orange-100 text-sm mt-2">
                Productkosten
              </p>
            </div>

            {/* Average Order */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 size={24} />
                  <p className="text-purple-100 text-sm font-medium">GEM. BESTELLING</p>
                </div>
              </div>
              <p className="text-4xl font-bold">{formatCurrency(overview.averages.orderValueCents)}</p>
              <p className="text-purple-100 text-sm mt-2">
                Gem. winst: {formatCurrency(overview.averages.profitPerOrderCents)}
              </p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Omzet Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotaal (excl. BTW)</span>
                  <span className="font-semibold">{formatCurrency(overview.revenue.totalCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">BTW (21%)</span>
                  <span className="font-semibold text-gray-700">+{formatCurrency(overview.revenue.taxCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verzendkosten</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(overview.revenue.shippingCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kortingen</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(overview.revenue.discountCents)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Totaal Incl. BTW</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(overview.revenue.withTax + overview.revenue.shippingCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profit Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Winst Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Omzet (excl. BTW)</span>
                  <span className="font-semibold">{formatCurrency(overview.revenue.totalCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Productkosten (Inkoop)</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(overview.costs.productCostCents)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Bruto Winst</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(overview.profit.grossProfitCents)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kortingen gegeven</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(overview.revenue.discountCents)}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Netto Winst</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(overview.profit.netProfitCents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Top Performing Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            Top 10 Meest Winstgevende Producten
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">#</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Verkocht</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Omzet</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Kosten</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Winst</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Marge</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{item.product.name}</div>
                      <div className="text-xs text-gray-500">{item.product.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium">{item.quantitySold}x</td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-blue-600">
                      {formatCurrency(item.revenueCents)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {formatCurrency(item.costCents)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                      {formatCurrency(item.profitCents)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.profitMargin >= 40 ? 'bg-green-100 text-green-800' :
                        item.profitMargin >= 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(item.profitMargin)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Performance */}
      {categoryPerformance.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="text-purple-600" size={20} />
            Prestaties per Categorie
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPerformance.slice(0, 6).map((cat) => (
              <div key={cat.category.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{cat.category.name}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Omzet:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(cat.revenueCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winst:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(cat.profitCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marge:</span>
                    <span className={`font-semibold ${
                      cat.profitMargin >= 40 ? 'text-green-600' :
                      cat.profitMargin >= 20 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {formatPercentage(cat.profitMargin)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Verkocht:</span>
                    <span className="font-medium">{cat.quantitySold} items</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={20} />
            Lage Voorraad Waarschuwing ({lowStock.length} producten)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStock.slice(0, 6).map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    product.stockQuantity === 0 ? 'bg-red-100 text-red-800' :
                    product.stockQuantity <= 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {product.stockQuantity === 0 ? 'Uitverkocht' : `${product.stockQuantity} op voorraad`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 mt-2">
                  <span>Drempel: {product.lowStockThreshold}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(product.priceCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
