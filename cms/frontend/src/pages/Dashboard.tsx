import React, { useEffect, useState } from 'react';
import { Package, FolderTree, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { statsApi } from '../services/api';
import { Stats } from '../types/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsApi.getOverview();
        setStats(response.data);
      } catch (err) {
        setError('Kon statistieken niet laden');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
    },
    {
      name: 'Categorieën',
      value: stats?.categories || 0,
      icon: FolderTree,
      color: 'bg-green-500',
    },
    {
      name: 'Klanten',
      value: stats?.customers || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Bestellingen',
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: 'bg-orange-500',
    },
  ];

  const totalRevenue = stats?.salesOverTime?.reduce((sum, day) => sum + day.totalCents, 0) || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Overzicht van je CMS statistieken
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.name} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${kpi.color}`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Omzet (14 dagen)</h3>
            <p className="text-3xl font-bold text-green-600">
              €{(totalRevenue / 100).toFixed(2)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        {stats?.salesOverTime && stats.salesOverTime.length > 0 && (
          <div className="mt-6">
            <div className="flex items-end space-x-1 h-32">
              {stats.salesOverTime.map((day, index) => {
                const height = Math.max((day.totalCents / Math.max(...stats.salesOverTime.map(d => d.totalCents))) * 100, 2);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${day.date}: €${(day.totalCents / 100).toFixed(2)}`}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(day.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Snelle acties</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">
            Nieuw product
          </button>
          <button className="btn-secondary">
            Nieuwe categorie
          </button>
          <button className="btn-secondary">
            Exporteer data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

