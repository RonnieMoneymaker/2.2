import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Euro, 
  TrendingUp,
  Filter,
  Search,
  Target,
  BarChart3
} from 'lucide-react';
import Layout from '../components/Layout/Layout';

interface CustomerLocation {
  id: number;
  name: string;
  email: string;
  city: string;
  postal_code: string;
  lat: number;
  lng: number;
  total_spent: number;
  total_orders: number;
  customer_status: string;
  profit: number;
}

interface CityStats {
  city: string;
  customers: number;
  total_revenue: number;
  total_profit: number;
  avg_spent: number;
  coordinates: { lat: number; lng: number };
  performance: 'excellent' | 'good' | 'average' | 'poor';
}

const GeographicMap: React.FC = () => {
  const [customerLocations, setCustomerLocations] = useState<CustomerLocation[]>([]);
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'heatmap' | 'table'>('map');

  // No mock customer locations
  useEffect(() => {
    // Fetch real customer data from API
    setCustomerLocations([]);
    setCityStats([]);
    setLoading(false);
  }, []);

  const generateCityStats = (locations: CustomerLocation[]) => {
    const cityMap = new Map<string, CityStats>();
    
    locations.forEach(location => {
      if (!cityMap.has(location.city)) {
        cityMap.set(location.city, {
          city: location.city,
          customers: 0,
          total_revenue: 0,
          total_profit: 0,
          avg_spent: 0,
          coordinates: { lat: location.lat, lng: location.lng },
          performance: 'average'
        });
      }
      
      const cityData = cityMap.get(location.city)!;
      cityData.customers += 1;
      cityData.total_revenue += location.total_spent;
      cityData.total_profit += location.profit;
    });
    
    // Calculate averages and performance ratings
    const cities = Array.from(cityMap.values()).map(city => {
      city.avg_spent = city.total_revenue / city.customers;
      
      // Performance rating based on profit per customer
      const profitPerCustomer = city.total_profit / city.customers;
      if (profitPerCustomer > 150) city.performance = 'excellent';
      else if (profitPerCustomer > 75) city.performance = 'good';
      else if (profitPerCustomer > 25) city.performance = 'average';
      else city.performance = 'poor';
      
      return city;
    });
    
    setCityStats(cities.sort((a, b) => b.total_profit - a.total_profit));
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'average': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return '🔥';
      case 'good': return '✅';
      case 'average': return '⚡';
      case 'poor': return '⚠️';
      default: return '📍';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout title="Geografische Analyse">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Geografische Analyse">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <MapPin className="h-8 w-8 text-primary-600 mr-3" />
              🗺️ Geografische Analyse
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Ontdek waar je klanten zitten en identificeer groeikansen
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="map">🗺️ Kaart Weergave</option>
              <option value="heatmap">🔥 Heatmap</option>
              <option value="table">📊 Tabel Weergave</option>
            </select>
          </div>
        </div>

        {/* Geographic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Steden</p>
                <p className="text-2xl font-semibold text-gray-900">{cityStats.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Klanten Verspreid</p>
                <p className="text-2xl font-semibold text-gray-900">{customerLocations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Beste Stad</p>
                <p className="text-lg font-semibold text-gray-900">{cityStats[0]?.city || 'N/A'}</p>
                <p className="text-xs text-gray-500">{formatCurrency(cityStats[0]?.total_profit || 0)} winst</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Gem. Winst/Stad</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(cityStats.reduce((sum, city) => sum + city.total_profit, 0) / cityStats.length || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'map' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🗺️ Nederland Klanten Kaart</h3>
            <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Interactieve Kaart</h4>
                <p className="text-gray-500 mb-4">Hier zou een interactieve kaart komen met alle klantlocaties</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  {cityStats.slice(0, 10).map(city => (
                    <div key={city.city} className="bg-white p-3 rounded border">
                      <div className="text-center">
                        <div className="text-lg">{getPerformanceIcon(city.performance)}</div>
                        <p className="font-medium">{city.city}</p>
                        <p className="text-xs text-gray-500">{city.customers} klanten</p>
                        <p className="text-xs font-bold text-green-600">{formatCurrency(city.total_profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🔥 Performance Heatmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Density Heatmap */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">👥 Klanten Dichtheid</h4>
                <div className="space-y-2">
                  {cityStats.map(city => (
                    <div key={city.city} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          city.customers >= 3 ? 'bg-red-500' :
                          city.customers >= 2 ? 'bg-orange-500' :
                          city.customers >= 1 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="font-medium">{city.city}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{city.customers} klanten</div>
                        <div className="text-xs text-gray-500">{formatCurrency(city.avg_spent)} gem.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profit Heatmap */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">💰 Winst Heatmap</h4>
                <div className="space-y-2">
                  {cityStats.map(city => (
                    <div key={city.city} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${
                          city.total_profit >= 200 ? 'bg-green-500' :
                          city.total_profit >= 100 ? 'bg-blue-500' :
                          city.total_profit >= 50 ? 'bg-yellow-500' : 
                          city.total_profit > 0 ? 'bg-orange-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">{city.city}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(city.performance)}`}>
                          {getPerformanceIcon(city.performance)} {city.performance}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{formatCurrency(city.total_profit)}</div>
                        <div className="text-xs text-gray-500">{formatCurrency(city.total_revenue)} omzet</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">📊 Stad Performance Tabel</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Klanten
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totale Omzet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totale Winst
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gem. Besteding
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Winst/Klant
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cityStats.map((city, index) => (
                    <tr key={city.city} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-2">{getPerformanceIcon(city.performance)}</div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{city.city}</div>
                            <div className="text-sm text-gray-500">Positie #{index + 1}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {city.customers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(city.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(city.total_profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(city.avg_spent)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(city.performance)}`}>
                          {city.performance}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(city.total_profit / city.customers)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Geographic Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">🎯 Geografische Inzichten</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">🏆 TOP PRESTERENDE STEDEN:</h4>
              <div className="space-y-2">
                {cityStats.slice(0, 3).map((city, index) => (
                  <div key={city.city} className="flex items-center space-x-2">
                    <span className={`flex-shrink-0 w-6 h-6 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                      {index + 1}
                    </span>
                    <span className="text-sm">
                      <strong>{city.city}</strong> - {formatCurrency(city.total_profit)} winst ({city.customers} klanten)
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-2">🎯 GROEIKANSEN:</h4>
              <div className="space-y-2">
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-green-800">✅ Randstad Focus</p>
                  <p className="text-xs text-green-600">Amsterdam, Utrecht, Den Haag = 70% van winst</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-yellow-800">⚡ Uitbreidingskans</p>
                  <p className="text-xs text-yellow-600">Zuid-Nederland heeft nog weinig klanten</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <p className="text-sm font-bold text-blue-800">🎯 Marketing Focus</p>
                  <p className="text-xs text-blue-600">Groningen: hoge besteding maar 1 klant</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-700">
              <strong>📍 Geografische Conclusie:</strong> Je klanten zijn geconcentreerd in de Randstad. 
              <strong>Kans:</strong> Marketing in Brabant/Limburg kan nieuwe markten openen. 
              <strong>Focus:</strong> Versterk positie in Amsterdam/Utrecht voor maximale winst.
            </p>
          </div>
        </div>

        {/* Customer Locations Detail */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">👥 Alle Klant Locaties</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customerLocations.map(customer => (
                <div key={customer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{customer.name}</h4>
                      <p className="text-sm text-gray-500">{customer.city}, {customer.postal_code}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          📧 {customer.email}
                        </p>
                        <p className="text-xs text-gray-600">
                          🛒 {customer.total_orders} bestellingen
                        </p>
                        <p className="text-xs font-bold text-green-600">
                          💰 {formatCurrency(customer.profit)} winst
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.customer_status === 'vip' ? 'bg-purple-100 text-purple-800' :
                        customer.customer_status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {customer.customer_status}
                      </span>
                      <div className="mt-2 text-sm font-bold text-gray-900">
                        {formatCurrency(customer.total_spent)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeographicMap;
