import React, { useState, useEffect } from 'react';
import { Eye, Users, Monitor, MousePointer, Activity, MessageCircle, Phone, Video, AlertCircle, Clock, Globe, Zap } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import LiveSessionViewer from '../components/LiveSessionViewer';

interface CustomerSession {
  customerId: number;
  customerEmail: string;
  customerName: string;
  socketId: string;
  startTime: Date;
  currentPage: string;
  userAgent: string;
  screenResolution: string;
  activities: CustomerActivity[];
  isOnline: boolean;
  sessionDuration: number;
}

interface CustomerActivity {
  type: string;
  page?: string;
  element?: string;
  position?: { x: number; y: number };
  timestamp: Date;
}

const LiveCustomerView: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<CustomerSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CustomerSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveActivities, setLiveActivities] = useState<CustomerActivity[]>([]);
  const [screenShareActive, setScreenShareActive] = useState(false);

  useEffect(() => {
    // No mock data - set empty arrays
    setActiveSessions([]);
    setLiveActivities([]);
  }, []);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'navigation': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'click': return <MousePointer className="h-4 w-4 text-green-500" />;
      case 'scroll': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'hover': return <Eye className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const requestScreenShare = (sessionId: string) => {
    setScreenShareActive(true);
    console.log('🖥️ Screen share requested for session:', sessionId);
    // In real implementation, this would send WebSocket message to customer
  };

  const sendHelpMessage = (sessionId: string, message: string) => {
    console.log('💬 Help message sent to customer:', message);
    // In real implementation, this would send message via WebSocket
  };

  return (
    <Layout title="Live Customer View">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Eye className="h-8 w-8 text-indigo-600 mr-3" />
              👀 Live Customer View
            </h1>
            <p className="text-gray-600 mt-1">Real-time inzicht in wat klanten op hun scherm zien</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'LIVE CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {activeSessions.length} actieve sessies
            </div>
          </div>
        </div>

        {/* Live Session Viewer Component */}
        <LiveSessionViewer />

        {/* Real-time Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 text-blue-500 mr-2" />
                  Actieve Klanten
                </h3>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {activeSessions.map((session) => (
                  <div
                    key={session.socketId}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSession?.socketId === session.socketId 
                        ? 'bg-indigo-50 border-indigo-300' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-sm font-medium text-gray-900">{session.customerName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDuration(session.sessionDuration)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{session.customerEmail}</p>
                    <p className="text-xs text-blue-600 font-medium">{session.currentPage}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{session.screenResolution}</span>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestScreenShare(session.socketId);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Request screen share"
                        >
                          <Monitor className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sendHelpMessage(session.socketId, 'Kan ik je helpen?');
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Send help message"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Session Detail */}
          <div className="lg:col-span-3">
            {selectedSession ? (
              <div className="space-y-6">
                {/* Session Header */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedSession.customerName}</h3>
                      <p className="text-gray-600">{selectedSession.customerEmail}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Sessie gestart: {selectedSession.startTime.toLocaleTimeString()} 
                        ({formatDuration(selectedSession.sessionDuration)} geleden)
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => requestScreenShare(selectedSession.socketId)}
                        className={`flex items-center px-4 py-2 rounded-lg ${
                          screenShareActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        {screenShareActive ? 'Screen Share Active' : 'Request Screen Share'}
                      </button>
                      <button className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-lg font-bold text-blue-600">{selectedSession.currentPage}</p>
                      <p className="text-sm text-gray-600">Huidige Pagina</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-lg font-bold text-green-600">{selectedSession.activities.length}</p>
                      <p className="text-sm text-gray-600">Activiteiten</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-lg font-bold text-purple-600">{selectedSession.screenResolution}</p>
                      <p className="text-sm text-gray-600">Scherm Resolutie</p>
                    </div>
                  </div>
                </div>

                {/* Live Screen View */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Monitor className="h-5 w-5 text-blue-500 mr-2" />
                      Live Screen View
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Recording</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {screenShareActive ? (
                      <div className="bg-gray-900 rounded-lg p-8 text-center">
                        <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-white text-lg font-medium mb-2">Live Screen Share Active</p>
                        <p className="text-gray-400">Viewing {selectedSession.customerName}'s screen in real-time</p>
                        <div className="mt-4 p-4 bg-gray-800 rounded">
                          <p className="text-green-400 text-sm">🟢 LIVE: Customer is viewing order details page</p>
                          <p className="text-blue-400 text-sm">🖱️ Mouse at position: (450, 320)</p>
                          <p className="text-purple-400 text-sm">📄 Page: /customer-portal/orders</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg font-medium mb-2">Screen Share Not Active</p>
                        <p className="text-gray-500">Request screen share to view customer's screen live</p>
                        <button
                          onClick={() => requestScreenShare(selectedSession.socketId)}
                          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          Request Screen Share
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Activity className="h-5 w-5 text-green-500 mr-2" />
                      Live Activity Timeline
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {[...selectedSession.activities, ...liveActivities].map((activity, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded animate-fadeIn">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.type === 'navigation' && `Navigated to ${activity.page}`}
                              {activity.type === 'click' && `Clicked on ${activity.element}`}
                              {activity.type === 'scroll' && `Scrolled to position ${activity.position?.y}`}
                              {activity.type === 'hover' && `Hovered over ${activity.element}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een Customer Sessie</h3>
                <p className="text-gray-600">Klik op een actieve customer sessie om live viewing te starten</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 text-green-500 mr-2" />
              🔴 Live Activity Feed - Alle Klanten
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveActivities.slice(0, 6).map((activity, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border animate-slideIn">
                  <div className="flex items-center space-x-2 mb-2">
                    {getActivityIcon(activity.type)}
                    <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                    <span className="text-xs text-gray-500">{activity.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{activity.element}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Zap className="h-6 w-6 mr-3" />
            🚀 Quick Customer Support Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-white bg-opacity-20 p-4 rounded-lg hover:bg-opacity-30 transition-all">
              <Phone className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Start Call</p>
            </button>
            <button className="bg-white bg-opacity-20 p-4 rounded-lg hover:bg-opacity-30 transition-all">
              <MessageCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Send Message</p>
            </button>
            <button className="bg-white bg-opacity-20 p-4 rounded-lg hover:bg-opacity-30 transition-all">
              <Monitor className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Screen Share</p>
            </button>
            <button className="bg-white bg-opacity-20 p-4 rounded-lg hover:bg-opacity-30 transition-all">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Send Alert</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveCustomerView;
