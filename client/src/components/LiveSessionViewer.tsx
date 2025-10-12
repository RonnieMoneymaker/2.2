import React, { useState, useEffect } from 'react';
import { Monitor, Eye, Users, Activity, MessageCircle, Video, Phone, AlertCircle, Clock } from 'lucide-react';

interface LiveSession {
  sessionId: string;
  customerName: string;
  customerEmail: string;
  currentPage: string;
  activities: any[];
  screenResolution: string;
  userAgent: string;
  startTime: Date;
  isOnline: boolean;
}

const LiveSessionViewer: React.FC = () => {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [isViewingScreen, setIsViewingScreen] = useState(false);

  useEffect(() => {
    // Mock live sessions data
    generateMockSessions();
    
    // Simulate live updates
    const interval = setInterval(() => {
      updateLiveSessions();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const generateMockSessions = () => {
    const sessions: LiveSession[] = [
      {
        sessionId: 'session_1',
        customerName: 'Piet Bakker',
        customerEmail: 'piet.bakker@email.com',
        currentPage: '/customer-portal/orders',
        activities: [
          { type: 'page_view', page: '/customer-portal', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
          { type: 'click', element: 'Mijn Bestellingen', timestamp: new Date(Date.now() - 5 * 60 * 1000) },
          { type: 'scroll', position: { y: 300 }, timestamp: new Date(Date.now() - 2 * 60 * 1000) }
        ],
        screenResolution: '1920x1080',
        userAgent: 'Chrome 140.0.0.0 / Windows 10',
        startTime: new Date(Date.now() - 15 * 60 * 1000),
        isOnline: true
      },
      {
        sessionId: 'session_2', 
        customerName: 'Maria Jansen',
        customerEmail: 'maria.jansen@email.com',
        currentPage: '/customer-portal/profile',
        activities: [
          { type: 'login', timestamp: new Date(Date.now() - 8 * 60 * 1000) },
          { type: 'navigation', page: '/customer-portal/profile', timestamp: new Date(Date.now() - 3 * 60 * 1000) }
        ],
        screenResolution: '1440x900',
        userAgent: 'Safari 17.0 / macOS',
        startTime: new Date(Date.now() - 8 * 60 * 1000),
        isOnline: true
      }
    ];

    setLiveSessions(sessions);
  };

  const updateLiveSessions = () => {
    // Simulate new activities
    setLiveSessions(prev => prev.map(session => ({
      ...session,
      activities: [
        ...session.activities,
        {
          type: ['click', 'scroll', 'hover'][Math.floor(Math.random() * 3)],
          element: ['Product link', 'Order button', 'Profile tab'][Math.floor(Math.random() * 3)],
          timestamp: new Date()
        }
      ].slice(-10) // Keep last 10 activities
    })));
  };

  const startScreenViewing = (session: LiveSession) => {
    setSelectedSession(session);
    setIsViewingScreen(true);
    console.log('🖥️ Starting live screen view for:', session.customerName);
  };

  const formatDuration = (startTime: Date) => {
    const ms = new Date().getTime() - startTime.getTime();
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Eye className="h-6 w-6 text-indigo-600 mr-3" />
          👀 Live Customer Sessions
        </h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-600">
            {liveSessions.length} LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="space-y-3">
          {liveSessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => setSelectedSession(session)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedSession?.sessionId === session.sessionId
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="font-medium text-gray-900">{session.customerName}</span>
                </div>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{session.customerEmail}</p>
              <p className="text-xs text-blue-600 font-medium mb-2">{session.currentPage}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDuration(session.startTime)}</span>
                <span>{session.activities.length} activities</span>
              </div>
              
              <div className="flex space-x-1 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startScreenViewing(session);
                  }}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                >
                  <Monitor className="h-3 w-3 inline mr-1" />
                  View
                </button>
                <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                  <MessageCircle className="h-3 w-3 inline mr-1" />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Session Details */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedSession.customerName} - Live Session
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Huidige Pagina:</p>
                    <p className="font-medium text-indigo-600">{selectedSession.currentPage}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sessie Duur:</p>
                    <p className="font-medium">{formatDuration(selectedSession.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Scherm:</p>
                    <p className="font-medium">{selectedSession.screenResolution}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Browser:</p>
                    <p className="font-medium">{selectedSession.userAgent.split(' ')[0]}</p>
                  </div>
                </div>
              </div>

              {/* Live Screen View */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Monitor className="h-5 w-5 text-blue-500 mr-2" />
                    Live Screen View
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Recording</span>
                  </div>
                </div>
                
                <div className="p-6">
                  {isViewingScreen ? (
                    <div className="bg-gray-900 rounded-lg p-8 text-center">
                      <div className="bg-gray-800 rounded p-6 mb-4">
                        <h4 className="text-white text-lg font-medium mb-4">
                          🖥️ Live View: {selectedSession.customerName}
                        </h4>
                        <div className="bg-gray-700 rounded p-4 text-left">
                          <div className="text-green-400 text-sm mb-2">🟢 LIVE: Customer Portal - Orders Page</div>
                          <div className="text-blue-400 text-sm mb-2">🖱️ Mouse: Hovering over order #ORD-2024-003</div>
                          <div className="text-purple-400 text-sm mb-2">📄 Scroll Position: 45% down page</div>
                          <div className="text-yellow-400 text-sm">⏱️ Last Activity: 2 seconds ago</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Send Help
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center">
                          <Phone className="h-4 w-4 mr-2" />
                          Start Call
                        </button>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center justify-center">
                          <Video className="h-4 w-4 mr-2" />
                          Video Chat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Screen Share Not Active</p>
                      <p className="text-gray-500 mb-4">Request permission to view customer's screen</p>
                      <button
                        onClick={() => startScreenViewing(selectedSession)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center mx-auto"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Request Screen View
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-green-500 mr-2" />
                    Live Activity Timeline
                  </h4>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {selectedSession.activities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {activity.type === 'page_view' && `Viewed page: ${activity.page}`}
                            {activity.type === 'click' && `Clicked: ${activity.element}`}
                            {activity.type === 'scroll' && `Scrolled to position ${activity.position?.y}`}
                            {activity.type === 'hover' && `Hovered over: ${activity.element}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een Live Sessie</h3>
              <p className="text-gray-600">Kies een actieve customer sessie om live viewing te starten</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSessionViewer;
