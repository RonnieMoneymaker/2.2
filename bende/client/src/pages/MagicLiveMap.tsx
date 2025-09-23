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
    // Simulate live orders every 5-15 seconds
    intervalRef.current = setInterval(() => {
      addLiveOrder();
      updateStats();
    }, Math.random() * 10000 + 5000);
  };

  useEffect(() => {
    generateMockData();
    startLiveUpdates();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const addLiveOrder = () => {
    const mockProducts = ['Premium T-Shirt', 'Jeans Classic', 'Sneakers Sport', 'Hoodie Deluxe', 'Jacket Premium'];
    const mockCustomers = ['Jan de Vries', 'Maria Jansen', 'Piet Bakker', 'Anna Smit', 'Tom van der Berg'];
    const mockLocations: [number, number][] = [
      [52.3676, 4.9041], // Amsterdam
      [51.9225, 4.47917], // Rotterdam  
      [52.0907, 5.1214], // Utrecht
      [51.5619, 5.0919], // Eindhoven
      [53.2194, 6.5665], // Groningen
      [52.2097, 6.8936], // Enschede
      [52.5200, 5.7150], // Almere
      [51.8356, 5.8389], // Nijmegen
    ];

    const amount = 29.99 + Math.random() * 200;
    const profit = amount * 0.35 - 5.95;

    const newOrder: LiveOrder = {
      id: Date.now(),
      customer: mockCustomers[Math.floor(Math.random() * mockCustomers.length)],
      location: mockLocations[Math.floor(Math.random() * mockLocations.length)],
      amount: amount,
      timestamp: new Date(),
      product: mockProducts[Math.floor(Math.random() * mockProducts.length)],
      profit: profit
    };

    setLiveOrders(prev => [newOrder, ...prev.slice(0, 19)]); // Keep last 20 orders
  };

  const updateStats = () => {
    setRealtimeStats(prev => ({
      ordersToday: prev.ordersToday + 1,
      revenueToday: prev.revenueToday + (29.99 + Math.random() * 200),
      profitToday: prev.profitToday + ((29.99 + Math.random() * 200) * 0.35 - 5.95),
      activeCustomers: prev.activeCustomers + (Math.random() > 0.8 ? 1 : 0)
    }));
  };

  const generateMockData = () => {
    const mockCustomers: CustomerLocation[] = [
      { id: 1, name: 'Piet Bakker', location: [52.3676, 4.9041], orders: 12, totalSpent: 1299.99, lastOrder: new Date(), status: 'vip' },
      { id: 2, name: 'Jan de Vries', location: [51.9225, 4.47917], orders: 8, totalSpent: 850.50, lastOrder: new Date(), status: 'active' },
      { id: 3, name: 'Maria Jansen', location: [52.0907, 5.1214], orders: 3, totalSpent: 299.97, lastOrder: new Date(), status: 'active' },
      { id: 4, name: 'Anna Smit', location: [51.5619, 5.0919], orders: 15, totalSpent: 2100.75, lastOrder: new Date(), status: 'vip' },
      { id: 5, name: 'Tom van der Berg', location: [53.2194, 6.5665], orders: 1, totalSpent: 89.99, lastOrder: new Date(), status: 'new' },
      { id: 6, name: 'Lisa de Jong', location: [52.2097, 6.8936], orders: 6, totalSpent: 650.30, lastOrder: new Date(), status: 'active' },
      { id: 7, name: 'Erik Visser', location: [52.5200, 5.7150], orders: 9, totalSpent: 1050.80, lastOrder: new Date(), status: 'active' },
      { id: 8, name: 'Sophie Mulder', location: [51.8356, 5.8389], orders: 4, totalSpent: 420.60, lastOrder: new Date(), status: 'active' }
    ];

    setCustomers(mockCustomers);
    setRealtimeStats({
      ordersToday: 23,
      revenueToday: 2847.50,
      profitToday: 856.20,
      activeCustomers: 156
    });
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
