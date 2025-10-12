// Customer Activity Tracking Service
class CustomerTrackingService {
  private isTracking: boolean = false;
  private sessionId: string | null = null;
  private activities: any[] = [];

  constructor() {
    this.initializeTracking();
  }

  initializeTracking() {
    // Only track if user is a customer (not admin)
    const customerUser = localStorage.getItem('customerUser');
    if (!customerUser) return;

    this.isTracking = true;
    this.sessionId = this.generateSessionId();
    
    console.log('🔍 Customer tracking gestart voor:', JSON.parse(customerUser).email);
    
    this.startPageTracking();
    this.startInteractionTracking();
    this.startMouseTracking();
  }

  generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  startPageTracking() {
    // Track page navigation
    let currentPage = window.location.pathname;
    
    this.logActivity({
      type: 'page_view',
      page: currentPage,
      timestamp: new Date(),
      url: window.location.href
    });

    // Monitor page changes (for SPA)
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPage) {
        currentPage = window.location.pathname;
        this.logActivity({
          type: 'navigation',
          page: currentPage,
          timestamp: new Date(),
          url: window.location.href
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  startInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (event) => {
      this.logActivity({
        type: 'click',
        element: this.getElementDescription(event.target as Element),
        position: { x: event.clientX, y: event.clientY },
        timestamp: new Date()
      });
    });

    // Track form interactions
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type !== 'password') { // Don't track passwords
        this.logActivity({
          type: 'form_input',
          element: this.getElementDescription(target),
          fieldType: target.type,
          timestamp: new Date()
        });
      }
    });

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.logActivity({
          type: 'scroll',
          position: { x: window.scrollX, y: window.scrollY },
          timestamp: new Date()
        });
      }, 150);
    });
  }

  startMouseTracking() {
    let mouseTimeout: NodeJS.Timeout;
    
    document.addEventListener('mousemove', (event) => {
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        // Only log significant mouse movements (not every pixel)
        this.logActivity({
          type: 'mouse_move',
          position: { x: event.clientX, y: event.clientY },
          timestamp: new Date()
        }, false); // Don't send to server immediately
      }, 500);
    });

    // Track hovers on important elements
    document.addEventListener('mouseover', (event) => {
      const target = event.target as Element;
      if (this.isImportantElement(target)) {
        this.logActivity({
          type: 'hover',
          element: this.getElementDescription(target),
          timestamp: new Date()
        });
      }
    });
  }

  getElementDescription(element: Element): string {
    if (!element) return 'unknown';

    // Try to get meaningful description
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    if (element.tagName === 'BUTTON') return `Button: ${element.textContent?.trim() || 'unknown'}`;
    if (element.tagName === 'A') return `Link: ${element.textContent?.trim() || 'unknown'}`;
    if (element.tagName === 'INPUT') return `Input: ${(element as HTMLInputElement).placeholder || (element as HTMLInputElement).type}`;
    
    return `${element.tagName.toLowerCase()}`;
  }

  isImportantElement(element: Element): boolean {
    const importantTags = ['BUTTON', 'A', 'INPUT', 'SELECT'];
    const importantClasses = ['btn', 'button', 'link', 'nav', 'menu'];
    
    if (importantTags.includes(element.tagName)) return true;
    
    const className = element.className.toString().toLowerCase();
    return importantClasses.some(cls => className.includes(cls));
  }

  logActivity(activity: any, sendToServer: boolean = true) {
    if (!this.isTracking) return;

    this.activities.push(activity);
    
    if (sendToServer) {
      this.sendToServer(activity);
    }

    // Keep only last 100 activities in memory
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(-100);
    }
  }

  sendToServer(activity: any) {
    // In real implementation, this would use WebSocket
    console.log('📊 Customer Activity:', activity);
    
    // Mock sending to server
    if (window.location.hostname === 'localhost') {
      // Store in sessionStorage for demo purposes
      const existingActivities = JSON.parse(sessionStorage.getItem('customerActivities') || '[]');
      existingActivities.push(activity);
      sessionStorage.setItem('customerActivities', JSON.stringify(existingActivities.slice(-50)));
    }
  }

  // Get current session data
  getSessionData() {
    const customerUser = JSON.parse(localStorage.getItem('customerUser') || '{}');
    
    return {
      sessionId: this.sessionId,
      customer: customerUser,
      currentPage: window.location.pathname,
      activities: this.activities.slice(-20), // Last 20 activities
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      userAgent: navigator.userAgent,
      startTime: new Date(),
      isTracking: this.isTracking
    };
  }

  // Start screen recording (for admin viewing)
  async startScreenRecording() {
    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      console.log('🎥 Screen recording started');
      return stream;
    } catch (error) {
      console.error('Screen recording failed:', error);
      return null;
    }
  }

  // Stop tracking
  stopTracking() {
    this.isTracking = false;
    console.log('🛑 Customer tracking gestopt');
  }
}

// Initialize tracking service
const customerTracking = new CustomerTrackingService();

// Export for use in components
export default customerTracking;
