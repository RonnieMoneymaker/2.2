import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:2000';

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(userId?: number, username?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to real-time server');
      
      // Register as admin
      this.socket?.emit('admin:connect', {
        userId: userId || 1,
        username: username || 'Admin'
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time server');
    });

    this.socket.on('reconnect', () => {
      console.log('🔄 Reconnected to real-time server');
    });

    // Listen to all events and forward to registered listeners
    this.setupEventForwarding();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    // Stats updates
    this.socket.on('stats:live', (data) => this.emit('stats:live', data));
    this.socket.on('stats:update', (data) => this.emit('stats:update', data));

    // Order events
    this.socket.on('order:new', (data) => this.emit('order:new', data));
    this.socket.on('order:status', (data) => this.emit('order:status', data));

    // Visitor events
    this.socket.on('visitor:new', (data) => this.emit('visitor:new', data));
    this.socket.on('visitor:left', (data) => this.emit('visitor:left', data));
    this.socket.on('visitor:activity', (data) => this.emit('visitor:activity', data));
    this.socket.on('visitor:cart', (data) => this.emit('visitor:cart', data));

    // Alerts
    this.socket.on('alert:lowstock', (data) => this.emit('alert:lowstock', data));
    this.socket.on('notification:sound', (data) => this.emit('notification:sound', data));

    // Admin
    this.socket.on('admin:count', (count) => this.emit('admin:count', count));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Emit visitor events (for testing)
  emitVisitorStart(sessionId: string, data: any) {
    this.socket?.emit('visitor:start', { sessionId, ...data });
  }

  emitVisitorPageView(sessionId: string, page: string) {
    this.socket?.emit('visitor:pageview', { sessionId, page });
  }

  emitVisitorCart(sessionId: string, cartValue: number, itemCount: number) {
    this.socket?.emit('visitor:cart', { sessionId, cartValue, itemCount });
  }
}

const realtimeService = new RealtimeService();
export default realtimeService;
