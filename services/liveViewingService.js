const { Server } = require('socket.io');

class LiveViewingService {
  constructor() {
    this.io = null;
    this.activeSessions = new Map();
    this.customerSessions = new Map();
    this.screenRecordings = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    console.log('✅ Live Viewing Service geïnitialiseerd');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔗 New connection:', socket.id);

      // Customer session tracking
      socket.on('customer-session-start', (data) => {
        const sessionData = {
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          socketId: socket.id,
          startTime: new Date(),
          currentPage: data.currentPage,
          userAgent: data.userAgent,
          screenResolution: data.screenResolution,
          activities: []
        };

        this.customerSessions.set(socket.id, sessionData);
        
        // Notify all admin users about new customer session
        this.io.emit('admin-notification', {
          type: 'customer-online',
          message: `${data.customerName} is nu online`,
          customer: sessionData
        });

        console.log('👥 Customer session started:', data.customerName);
      });

      // Track customer page navigation
      socket.on('customer-page-change', (data) => {
        const session = this.customerSessions.get(socket.id);
        if (session) {
          session.currentPage = data.page;
          session.activities.push({
            type: 'navigation',
            page: data.page,
            timestamp: new Date()
          });

          // Notify admins about customer navigation
          this.io.emit('admin-customer-activity', {
            sessionId: socket.id,
            customer: session,
            activity: {
              type: 'navigation',
              page: data.page,
              timestamp: new Date()
            }
          });
        }
      });

      // Track customer interactions
      socket.on('customer-interaction', (data) => {
        const session = this.customerSessions.get(socket.id);
        if (session) {
          const activity = {
            type: data.type, // 'click', 'scroll', 'form_fill', 'hover'
            element: data.element,
            position: data.position,
            timestamp: new Date()
          };

          session.activities.push(activity);

          // Send to admins for live viewing
          this.io.emit('admin-customer-activity', {
            sessionId: socket.id,
            customer: session,
            activity: activity
          });
        }
      });

      // Screen sharing request from admin
      socket.on('admin-request-screen-share', (data) => {
        const customerSession = this.customerSessions.get(data.customerSessionId);
        if (customerSession) {
          // Ask customer for permission to share screen
          this.io.to(data.customerSessionId).emit('screen-share-request', {
            adminName: data.adminName,
            requestId: data.requestId
          });
        }
      });

      // Customer responds to screen share request
      socket.on('customer-screen-share-response', (data) => {
        if (data.accepted) {
          // Start screen sharing session
          this.activeSessions.set(data.requestId, {
            customerId: socket.id,
            adminId: data.adminId,
            startTime: new Date()
          });

          this.io.to(data.adminId).emit('screen-share-accepted', {
            requestId: data.requestId,
            customerSessionId: socket.id
          });
        } else {
          this.io.to(data.adminId).emit('screen-share-denied', {
            requestId: data.requestId
          });
        }
      });

      // Live screen data from customer
      socket.on('customer-screen-data', (data) => {
        const session = Array.from(this.activeSessions.values())
          .find(s => s.customerId === socket.id);
        
        if (session) {
          // Forward screen data to admin
          this.io.to(session.adminId).emit('live-screen-update', {
            sessionId: socket.id,
            screenData: data
          });
        }
      });

      // Customer mouse movements and clicks
      socket.on('customer-mouse-data', (data) => {
        const session = this.customerSessions.get(socket.id);
        if (session) {
          this.io.emit('admin-customer-mouse', {
            sessionId: socket.id,
            customer: session,
            mouseData: data
          });
        }
      });

      // Admin joins live viewing
      socket.on('admin-join-viewing', (data) => {
        socket.join('admin-viewers');
        console.log('👨‍💼 Admin joined live viewing:', data.adminName);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        const session = this.customerSessions.get(socket.id);
        if (session) {
          this.io.emit('admin-notification', {
            type: 'customer-offline',
            message: `${session.customerName} is offline gegaan`,
            customer: session
          });

          this.customerSessions.delete(socket.id);
          console.log('👋 Customer session ended:', session.customerName);
        }

        // Clean up active screen sharing sessions
        for (const [requestId, activeSession] of this.activeSessions.entries()) {
          if (activeSession.customerId === socket.id || activeSession.adminId === socket.id) {
            this.activeSessions.delete(requestId);
          }
        }
      });
    });
  }

  // Get all active customer sessions
  getActiveCustomerSessions() {
    return Array.from(this.customerSessions.values()).map(session => ({
      ...session,
      activities: session.activities.slice(-10), // Last 10 activities
      isOnline: true,
      sessionDuration: new Date().getTime() - session.startTime.getTime()
    }));
  }

  // Get customer session by ID
  getCustomerSession(sessionId) {
    return this.customerSessions.get(sessionId);
  }

  // Send message to specific customer
  sendMessageToCustomer(sessionId, message) {
    this.io.to(sessionId).emit('admin-message', message);
  }

  // Send live help to customer
  sendLiveHelp(sessionId, helpData) {
    this.io.to(sessionId).emit('live-help', helpData);
  }
}

module.exports = new LiveViewingService();



