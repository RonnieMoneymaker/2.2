import React, { useEffect, useState } from 'react';
import { 
  Package, 
  FolderTree, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Download,
  DollarSign,
  Activity,
  Clock
} from 'lucide-react';
import { statsApi, ordersApi, customersApi, productsApi, categoriesApi } from '../services/api';
import { Stats } from '../types/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsRes, orderStatsRes, ordersRes] = await Promise.all([
        statsApi.getOverview(),
        ordersApi.getStats(),
        ordersApi.getAll({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setOrderStats(orderStatsRes.data);
      setRecentOrders(ordersRes.data.orders);
    } catch (err) {
      setError('Kon statistieken niet laden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (type: 'products' | 'customers' | 'orders' | 'categories') => {
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = '';

      switch (type) {
        case 'products':
          const products = await productsApi.getAll({ limit: 1000 });
          data = products.data.products;
          headers = ['ID', 'Naam', 'SKU', 'Prijs (€)', 'Voorraad', 'Categorie ID'];
          filename = 'producten.csv';
          break;
        case 'customers':
          const customers = await customersApi.getAll({ limit: 1000 });
          data = customers.data.customers;
          headers = ['ID', 'Email', 'Voornaam', 'Achternaam', 'Telefoon', 'Plaats', 'Land'];
          filename = 'klanten.csv';
          break;
        case 'orders':
          const orders = await ordersApi.getAll({ limit: 1000 });
          data = orders.data.orders;
          headers = ['ID', 'Order Nummer', 'Status', 'Totaal (€)', 'Klant ID', 'Datum'];
          filename = 'bestellingen.csv';
          break;
        case 'categories':
          const categories = await categoriesApi.getAll();
          data = categories.data.categories;
          headers = ['ID', 'Naam', 'Slug', 'Parent ID', 'Datum'];
          filename = 'categorieen.csv';
          break;
      }

      // Create CSV content
      let csv = headers.join(',') + '\n';
      
      data.forEach((item) => {
        let row: string[] = [];
        switch (type) {
          case 'products':
            row = [
              item.id,
              `"${item.name}"`,
              item.sku || '',
              (item.priceCents / 100).toFixed(2),
              item.stockQuantity,
              item.categoryId || ''
            ];
            break;
          case 'customers':
            row = [
              item.id,
              item.email,
              `"${item.firstName}"`,
              `"${item.lastName}"`,
              item.phone || '',
              item.city || '',
              item.country || ''
            ];
            break;
          case 'orders':
            row = [
              item.id,
              item.orderNumber,
              item.status,
              (item.totalCents / 100).toFixed(2),
              item.customerId,
              new Date(item.createdAt).toLocaleDateString('nl-NL')
            ];
            break;
          case 'categories':
            row = [
              item.id,
              `"${item.name}"`,
              item.slug,
              item.parentId || '',
              new Date(item.createdAt).toLocaleDateString('nl-NL')
            ];
            break;
        }
        csv += row.join(',') + '\n';
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      alert(`✅ ${data.length} items geëxporteerd naar ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Fout bij exporteren');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const kpis = [
    {
      name: 'Producten',
      value: stats?.products || 0,
      icon: Package,
      color: 'bg-blue-500',
      trend: '+12%',
    },
    {
      name: 'Categorieën',
      value: stats?.categories || 0,
      icon: FolderTree,
      color: 'bg-green-500',
      trend: '+5%',
    },
    {
      name: 'Klanten',
      value: stats?.customers || 0,
      icon: Users,
      color: 'bg-purple-500',
      trend: '+23%',
    },
    {
      name: 'Bestellingen',
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      trend: '+18%',
    },
  ];

  const totalRevenue = orderStats?.revenue || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welkom terug! Hier is een overzicht van je CMS
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                </div>
              </div>
              <div className="text-xs font-medium text-green-600">{kpi.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Totale Omzet</h3>
              <p className="text-xs text-gray-500">Alle niet-geannuleerde bestellingen</p>
            </div>
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <p className="text-4xl font-bold text-green-600">
            €{(totalRevenue / 100).toFixed(2)}
          </p>
          
          {stats?.salesOverTime && stats.salesOverTime.length > 0 && (
            <div className="mt-6">
              <div className="flex items-end space-x-1 h-32">
                {stats.salesOverTime.map((day) => {
                  const maxValue = Math.max(...stats.salesOverTime.map(d => d.totalCents));
                  const height = maxValue > 0 ? Math.max((day.totalCents / maxValue) * 100, 2) : 2;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t hover:from-primary-700 hover:to-primary-500 transition-colors"
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(day.date).getDate()}
                      </div>
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        €{(day.totalCents / 100).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Laatste 14 dagen
              </div>
            </div>
          )}
        </div>

        {/* Order Statistics */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Bestellingen Status</h3>
            <Activity className="h-6 w-6 text-gray-400" />
          </div>
          
          {orderStats && (
            <div className="space-y-3">
              {[
                { label: 'In afwachting', value: orderStats.byStatus?.pending || 0, color: 'bg-yellow-500' },
                { label: 'In behandeling', value: orderStats.byStatus?.processing || 0, color: 'bg-blue-500' },
                { label: 'Verzonden', value: orderStats.byStatus?.shipped || 0, color: 'bg-purple-500' },
                { label: 'Geleverd', value: orderStats.byStatus?.delivered || 0, color: 'bg-green-500' },
                { label: 'Geannuleerd', value: orderStats.byStatus?.cancelled || 0, color: 'bg-red-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
                    <span className="text-sm text-gray-700">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Totaal</span>
              <span className="text-lg font-bold text-gray-900">{orderStats?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recente Bestellingen</h3>
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Klant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.customer?.firstName} {order.customer?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">€{(order.totalCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('nl-NL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Data Exporteren</h3>
            <p className="text-sm text-gray-600 mt-1">Download je data als CSV bestand</p>
          </div>
          <Download className="h-6 w-6 text-primary-600" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => exportToCSV('products')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Package className="h-4 w-4" />
            Producten
          </button>
          <button 
            onClick={() => exportToCSV('categories')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FolderTree className="h-4 w-4" />
            Categorieën
          </button>
          <button 
            onClick={() => exportToCSV('customers')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            Klanten
          </button>
          <button 
            onClick={() => exportToCSV('orders')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Bestellingen
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;