import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Users, ShoppingBag, TrendingUp, Zap, Radio, Eye, DollarSign } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LiveOrder {
  id: number;
  customer: string;
  location: [number, number];
  amount: number;
  timestamp: Date;
  product: string;
  profit: number;
}

interface CustomerLocation {
  id: number;
  name: string;
  location: [number, number];
  orders: number;
  totalSpent: number;
  lastOrder: Date;
  status: 'new' | 'active' | 'vip';
}

const MagicLiveMap: React.FC = () => {
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerLocation[]>([]);
  const [realtimeStats, setRealtimeStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    profitToday: 0,
    activeCustomers: 0
  });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showLiveOrders, setShowLiveOrders] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startLiveUpdates = () => {
    // Fetch real data from API every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchRealData();
    }, 30000); // Update every 30 seconds
  };

  useEffect(() => {
    fetchRealData(); // Initial fetch
    startLiveUpdates();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchRealData = async () => {
    try {
      // Fetch real customers from API
      const customersResponse = await fetch('/api/customers?limit=100');
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        const mappedCustomers: CustomerLocation[] = customersData.customers
          .filter((c: any) => c.city) // Only customers with location data
          .map((c: any) => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            location: getCityCoordinates(c.city),
            orders: c.total_orders || 0,
            totalSpent: parseFloat(c.total_spent) || 0,
            lastOrder: c.last_order_date ? new Date(c.last_order_date) : new Date(),
            status: c.total_spent > 1000 ? 'vip' : c.total_orders > 3 ? 'active' : 'new'
          }));
        setCustomers(mappedCustomers);
      }

      // Fetch real orders from API
      const ordersResponse = await fetch('/api/orders?limit=20&sortBy=order_date&sortOrder=desc');
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const mappedOrders: LiveOrder[] = ordersData.orders.map((o: any) => ({
          id: o.id,
          customer: `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || 'Unknown',
          location: getCityCoordinates(o.shipping_address?.split(',')[1]?.trim() || 'Amsterdam'),
          amount: parseFloat(o.total_amount) || 0,
          timestamp: new Date(o.order_date),
          product: o.order_items?.[0]?.product_name || 'Product',
          profit: (parseFloat(o.total_amount) || 0) * 0.35 - 5.95
        }));
        setLiveOrders(mappedOrders);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/analytics/dashboard');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setRealtimeStats({
          ordersToday: stats.ordersThisMonth?.count || 0,
          revenueToday: parseFloat(stats.revenueThisMonth?.total) || 0,
          profitToday: (parseFloat(stats.revenueThisMonth?.total) || 0) * 0.35,
          activeCustomers: stats.totalCustomers?.count || 0
        });
      }
    } catch (error) {
      console.error('Error fetching real data:', error);
      // Set empty state when no data available
      setCustomers([]);
      setLiveOrders([]);
      setRealtimeStats({
        ordersToday: 0,
        revenueToday: 0,
        profitToday: 0,
        activeCustomers: 0
      });
    }
  };

  const getCityCoordinates = (city: string): [number, number] => {
    const cityCoords: { [key: string]: [number, number] } = {
      'Amsterdam': [52.3676, 4.9041],
      'Rotterdam': [51.9225, 4.47917],
      'Utrecht': [52.0907, 5.1214],
      'Eindhoven': [51.5619, 5.0919],
      'Groningen': [53.2194, 6.5665],
      'Enschede': [52.2097, 6.8936],
      'Almere': [52.5200, 5.7150],
      'Nijmegen': [51.8356, 5.8389],
      'Haarlem': [52.3874, 4.6462],
      'Den Haag': [52.0705, 4.3007],
      'Breda': [51.5719, 4.7683],
      'Tilburg': [51.5555, 5.0913],
      'Maastricht': [50.8514, 5.6909],
      'Arnhem': [51.9851, 5.8987],
      'Zwolle': [52.5168, 6.0830],
      'Apeldoorn': [52.2110, 5.9699],
      'Leeuwarden': [53.2012, 5.8086]
    };
    return cityCoords[city] || [52.3676, 4.9041]; // Default to Amsterdam
  };

  const getCustomerIcon = (status: 'new' | 'active' | 'vip') => {
    const iconColors = {
      'vip': '#FFD700',
      'active': '#10B981',
      'new': '#3B82F6'
    };
    
    return new L.DivIcon({
      html: `<div style="background-color: ${iconColors[status]}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      className: 'custom-marker'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <Layout title="Magic Live Map">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🗺️ Magic Live Map</h1>
          <p className="text-gray-600 mt-1">Real-time klant activiteit en verkoop visualisatie</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Radio className="h-5 w-5 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-600">LIVE</span>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Live Bestellingen Vandaag</p>
              <p className="text-3xl font-bold">{realtimeStats.ordersToday}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Live Omzet Vandaag</p>
              <p className="text-3xl font-bold">{formatCurrency(realtimeStats.revenueToday)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Live Winst Vandaag</p>
              <p className="text-3xl font-bold">{formatCurrency(realtimeStats.profitToday)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Actieve Klanten</p>
              <p className="text-3xl font-bold">{realtimeStats.activeCustomers}</p>
            </div>
            <Users className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">🌍 Live Customer Activity Map</h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Customer Heatmap</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLiveOrders}
                  onChange={(e) => setShowLiveOrders(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Live Orders</span>
              </label>
            </div>
          </div>
          
          <div style={{ height: '500px' }}>
            <MapContainer
              center={[52.1326, 5.2913]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Customer Locations */}
              {showHeatmap && customers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <Marker
                    position={customer.location}
                    icon={getCustomerIcon(customer.status)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                        <p className="text-sm text-gray-600">Status: {customer.status}</p>
                        <p className="text-sm text-gray-600">Orders: {customer.orders}</p>
                        <p className="text-sm text-gray-600">Besteed: {formatCurrency(customer.totalSpent)}</p>
                        <p className="text-sm text-gray-600">Winst: {formatCurrency(customer.totalSpent * 0.35 - customer.orders * 5.95)}</p>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Sales intensity circles */}
                  <Circle
                    center={customer.location}
                    radius={customer.totalSpent * 10}
                    fillColor={customer.status === 'vip' ? '#FFD700' : customer.status === 'active' ? '#10B981' : '#3B82F6'}
                    fillOpacity={0.1}
                    stroke={false}
                  />
                </React.Fragment>
              ))}

              {/* Live Orders Animation */}
              {showLiveOrders && liveOrders.slice(0, 5).map((order) => (
                <Marker
                  key={order.id}
                  position={order.location}
                  icon={new L.DivIcon({
                    html: `<div class="animate-ping bg-red-500 rounded-full w-4 h-4"></div>`,
                    iconSize: [16, 16],
                    className: 'live-order-marker'
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                        LIVE ORDER!
                      </h4>
                      <p className="text-sm text-gray-600">Klant: {order.customer}</p>
                      <p className="text-sm text-gray-600">Product: {order.product}</p>
                      <p className="text-sm text-gray-600">Bedrag: {formatCurrency(order.amount)}</p>
                      <p className="text-sm text-gray-600">Winst: {formatCurrency(order.profit)}</p>
                      <p className="text-xs text-gray-500">{order.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              Live Activity Feed
            </h3>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {liveOrders.map((order) => (
              <div key={order.id} className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    <span className="text-sm font-medium text-gray-900">{order.customer}</span>
                  </div>
                  <span className="text-xs text-gray-500">{order.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{order.product}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(order.amount)}</span>
                  <span className="text-xs text-purple-600">+{formatCurrency(order.profit)} winst</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">🗂️ Map Legend</h4>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">VIP Customers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Active Customers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">New Customers</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping mr-2"></div>
            <span className="text-sm text-gray-600">Live Orders</span>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default MagicLiveMap;
