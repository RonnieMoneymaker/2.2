import React, { useState, useEffect } from 'react';
import { Activity, Users, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Eye, Clock, MapPin } from 'lucide-react';
import realtimeService from '../services/realtime';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LiveStats {
  realtime: {
    activeVisitors: number;
    adminUsers: number;
    visitors: Array<{
      sessionId: string;
      currentPage: string;
      pageViews: number;
      cartValue: number;
      duration: number;
      country: string;
    }>;
  };
  today: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  total: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  alerts: {
    lowStockProducts: number;
  };
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    totalCents: number;
    status: string;
    createdAt: string;
  }>;
  chartData: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  timestamp: string;
}

export default function LiveDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Connect to real-time server
    realtimeService.connect(1, 'Admin');
    setConnected(true);

    // Listen for live stats
    const handleLiveStats = (data: LiveStats) => {
      setStats(data);
      setLastUpdate(new Date());
    };

    const handleNewOrder = (data: any) => {
      toast.success(`🎉 Nieuwe bestelling: ${data.order.orderNumber} - €${(data.order.totalCents / 100).toFixed(2)}`, {
        position: 'top-right',
        autoClose: 5000,
      });
      
      // Play sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHAU4kNbxzHksBSN2x+/ekEAKE1605+uoVRQKRp/g8r5sIQUqgM3x2Ik2CBlouzvsm00MDlCk4fC3YxwEOI/W8cx5KwUidsbv3o8/ChJctOXqqVQTCkWe4PG+bCAFKX/M8tiINQgYZ7zy5Zq/vJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHAU4kNbxzHksBSN2x+/ekEAKE1605+uoVRQKRp/g8r5sIQUqgM3x2Ik2CBlouzvsm00MDlCk4fC3YxwEOI/W8cx5KwUidsbv3o8/ChJctOXqqVQTCkWe4PG+bCAFKX/M8tiINQgYZ7zy5Zq/vJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHAU4kNbxzHksBSN2x+/ekEAKE1605+uoVRQKRp/g8r5sIQUqgM3x2Ik2CBlouzvsm00MDlCk4fC3YxwEOI/W8cx5KwUidsbv3o8/ChJctOXqqVQTCkWe4PG+bCAFKX/M8tiINQgYZ7zy5Zq/vJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHAU4kNbxzHksBSN2x+/ekEAKE1605+uoVRQKRp/g8r5sIQUqgM3x2Ik2CBlouzvsm00MDlCk4fC3YxwEOI/W8cx5KwUidsbv3o8/ChJctOXqqVQTCkWe4PG+bCAFKX/M8tiINQgYZ7zy5Zq/');
      audio.play().catch(() => {});
    };

    const handleNewVisitor = (data: any) => {
      toast.info(`👤 Nieuwe bezoeker op: ${data.currentPage}`, {
        position: 'bottom-right',
        autoClose: 3000,
      });
    };

    const handleLowStock = (data: any) => {
      toast.warning(`⚠️ Lage voorraad: ${data.product.name} (${data.product.stockQuantity} stuks)`, {
        position: 'top-right',
        autoClose: 7000,
      });
    };

    realtimeService.on('stats:live', handleLiveStats);
    realtimeService.on('order:new', handleNewOrder);
    realtimeService.on('visitor:new', handleNewVisitor);
    realtimeService.on('alert:lowstock', handleLowStock);

    // Cleanup
    return () => {
      realtimeService.off('stats:live', handleLiveStats);
      realtimeService.off('order:new', handleNewOrder);
      realtimeService.off('visitor:new', handleNewVisitor);
      realtimeService.off('alert:lowstock', handleLowStock);
    };
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Verbinden met live server...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            Live Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time statistieken en bezoekersmonitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Live verbonden' : 'Verbinding verbroken'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <Clock className="inline w-4 h-4 mr-1" />
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Actieve Bezoekers</p>
              <h3 className="text-4xl font-bold mt-2">{stats.realtime.activeVisitors}</h3>
              <p className="text-blue-100 text-xs mt-1">Live op de website</p>
            </div>
            <Eye className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Vandaag Bestellingen</p>
              <h3 className="text-4xl font-bold mt-2">{stats.today.orders}</h3>
              <p className="text-green-100 text-xs mt-1">{formatCurrency(stats.today.revenue)}</p>
            </div>
            <ShoppingCart className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Gemiddelde Bestelling</p>
              <h3 className="text-4xl font-bold mt-2">{formatCurrency(stats.today.averageOrderValue)}</h3>
              <p className="text-amber-100 text-xs mt-1">Vandaag</p>
            </div>
            <DollarSign className="w-12 h-12 text-amber-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Lage Voorraad</p>
              <h3 className="text-4xl font-bold mt-2">{stats.alerts.lowStockProducts}</h3>
              <p className="text-red-100 text-xs mt-1">Producten</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Bestellingen (30 dagen)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Omzet (30 dagen)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Visitors & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Visitors */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Live Bezoekers ({stats.realtime.activeVisitors})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.realtime.visitors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Geen actieve bezoekers</p>
            ) : (
              stats.realtime.visitors.map((visitor) => (
                <div key={visitor.sessionId} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{visitor.country}</span>
                        <span className="text-xs text-gray-500">• {formatDuration(visitor.duration)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{visitor.currentPage}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{visitor.pageViews} pagina's</span>
                        {visitor.cartValue > 0 && (
                          <span className="text-green-600 font-medium">
                            🛒 {formatCurrency(visitor.cartValue)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-500" />
            Recente Bestellingen
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(order.totalCents)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
