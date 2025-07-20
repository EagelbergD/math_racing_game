// Device Detection Utility
class DeviceDetector {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.isTouchDevice = this.detectTouchDevice();
    this.screenSize = this.getScreenSize();
    this.orientation = this.getOrientation();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.orientation = this.getOrientation();
        this.screenSize = this.getScreenSize();
      }, 100);
    });
  }
  
  detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'android', 'iphone', 'ipod', 'blackberry', 'windows phone',
      'mobile', 'opera mini', 'iemobile'
    ];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
           (window.innerWidth <= 768 && this.detectTouchDevice());
  }
  
  detectTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk'];
    
    return tabletKeywords.some(keyword => userAgent.includes(keyword)) ||
           (window.innerWidth > 768 && window.innerWidth <= 1024 && this.detectTouchDevice());
  }
  
  detectTouchDevice() {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 || 
           navigator.msMaxTouchPoints > 0;
  }
  
  getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  
  getOrientation() {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
  
  // Get recommended UI scale based on device
  getUIScale() {
    const baseWidth = 800;
    const baseHeight = 600;
    
    const scaleX = this.screenSize.width / baseWidth;
    const scaleY = this.screenSize.height / baseHeight;
    
    // Use smaller scale to ensure UI fits
    let scale = Math.min(scaleX, scaleY);
    
    // Adjust for mobile devices
    if (this.isMobile) {
      scale = Math.max(0.6, Math.min(scale, 1.2));
    } else if (this.isTablet) {
      scale = Math.max(0.8, Math.min(scale, 1.5));
    }
    
    return scale;
  }
  
  // Get safe area for UI elements (avoiding notches, etc.)
  getSafeArea() {
    const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
    const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
    const safeAreaLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0');
    const safeAreaRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0');
    
    return {
      top: Math.max(safeAreaTop, this.isMobile ? 20 : 0),
      bottom: Math.max(safeAreaBottom, this.isMobile ? 20 : 0),
      left: Math.max(safeAreaLeft, 0),
      right: Math.max(safeAreaRight, 0)
    };
  }
  
  // Get recommended button size for touch
  getButtonSize() {
    const baseSize = 60;
    const scale = this.getUIScale();
    
    if (this.isMobile) {
      return Math.max(44, baseSize * scale); // iOS HIG minimum
    } else if (this.isTablet) {
      return Math.max(50, baseSize * scale);
    }
    
    return baseSize * scale;
  }
  
  // Check if device should use mobile layout
  shouldUseMobileLayout() {
    return this.isMobile || (this.isTablet && this.orientation === 'portrait');
  }
  
  // Get device info summary
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isTouchDevice: this.isTouchDevice,
      screenSize: this.screenSize,
      orientation: this.orientation,
      uiScale: this.getUIScale(),
      safeArea: this.getSafeArea(),
      buttonSize: this.getButtonSize(),
      shouldUseMobileLayout: this.shouldUseMobileLayout()
    };
  }
}

// Create global instance
const deviceDetector = new DeviceDetector();

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.DeviceDetector = DeviceDetector;
  window.deviceDetector = deviceDetector;
}

// Export for Node.js/CommonJS environments
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DeviceDetector;
} 