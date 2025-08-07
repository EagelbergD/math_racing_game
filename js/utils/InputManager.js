// Input Manager for unified desktop and mobile input handling
class InputManager {
  constructor(scene, devDetector = { getDeviceInfo: () => ({ isMobile: false, shouldUseMobileLayout: false }) }) {
    this.scene = scene;
    this.deviceInfo = devDetector.getDeviceInfo();
    
    // Input state
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      enter: false,
      escape: false,
      space: false,
      justPressed: {
        up: false,
        down: false,
        left: false,
        right: false,
        enter: false,
        escape: false,
        space: false
      }
    };
    
    // Previous frame state for "just pressed" detection
    this.prevInputState = { ...this.inputState };
    
    // Desktop keyboard setup
    this.setupDesktopInput();
    
    // Mobile controls will be added by MobileControls class
    this.mobileControls = null;
  }
  
  setupDesktopInput() {
    if (!this.scene.input) return;
    
    // Create cursor keys
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    // WASD keys as alternative
    this.wasdKeys = this.scene.input.keyboard.addKeys('W,S,A,D');
    
    // Space bar as alternative to Enter
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }
  
  // Set mobile controls reference
  setMobileControls(mobileControls) {
    this.mobileControls = mobileControls;
  }
  
  // Update input state - call this in scene's update method
  update() {
    // Store previous state for "just pressed" detection
    this.prevInputState = {
      up: this.inputState.up,
      down: this.inputState.down,
      left: this.inputState.left,
      right: this.inputState.right,
      enter: this.inputState.enter,
      escape: this.inputState.escape,
      space: this.inputState.space
    };
    
    // Update current state from desktop input
    this.updateDesktopInput();
    
    // Update from mobile controls if available
    if (this.mobileControls) {
      this.updateMobileInput();
    }
    
    // Calculate "just pressed" states
    this.inputState.justPressed = {
      up: this.inputState.up && !this.prevInputState.up,
      down: this.inputState.down && !this.prevInputState.down,
      left: this.inputState.left && !this.prevInputState.left,
      right: this.inputState.right && !this.prevInputState.right,
      enter: this.inputState.enter && !this.prevInputState.enter,
      escape: this.inputState.escape && !this.prevInputState.escape,
      space: this.inputState.space && !this.prevInputState.space
    };
  }
  
  updateDesktopInput() {
    if (!this.cursors) return;
    
    this.inputState.up = this.cursors.up.isDown || (this.wasdKeys.W && this.wasdKeys.W.isDown);
    this.inputState.down = this.cursors.down.isDown || (this.wasdKeys.S && this.wasdKeys.S.isDown);
    this.inputState.left = this.cursors.left.isDown || (this.wasdKeys.A && this.wasdKeys.A.isDown);
    this.inputState.right = this.cursors.right.isDown || (this.wasdKeys.D && this.wasdKeys.D.isDown);
    this.inputState.enter = this.enterKey.isDown || (this.spaceKey && this.spaceKey.isDown);
    this.inputState.escape = this.escapeKey.isDown;
    this.inputState.space = this.spaceKey.isDown;
  }
  
  updateMobileInput() {
    const mobileState = this.mobileControls.getInputState();
    
    // Combine desktop and mobile input (OR logic)
    this.inputState.up = this.inputState.up || mobileState.up;
    this.inputState.down = this.inputState.down || mobileState.down;
    this.inputState.left = this.inputState.left || mobileState.left;
    this.inputState.right = this.inputState.right || mobileState.right;
    this.inputState.enter = this.inputState.enter || mobileState.enter;
    this.inputState.escape = this.inputState.escape || mobileState.escape;
    this.inputState.space = this.inputState.space || mobileState.space;
  }
  
  // Convenience methods for common input checks
  isPressed(key) {
    return this.inputState[key] || false;
  }
  
  isJustPressed(key) {
    return this.inputState.justPressed[key] || false;
  }
  
  // Legacy compatibility methods for existing code
  isUpPressed() { return this.isPressed('up'); }
  isDownPressed() { return this.isPressed('down'); }
  isLeftPressed() { return this.isPressed('left'); }
  isRightPressed() { return this.isPressed('right'); }
  isEnterPressed() { return this.isPressed('enter'); }
  isEscapePressed() { return this.isPressed('escape'); }
  isSpacePressed() { return this.isPressed('space'); }
  
  isUpJustPressed() { return this.isJustPressed('up'); }
  isDownJustPressed() { return this.isJustPressed('down'); }
  isLeftJustPressed() { return this.isJustPressed('left'); }
  isRightJustPressed() { return this.isJustPressed('right'); }
  isEnterJustPressed() { return this.isJustPressed('enter'); }
  isEscapeJustPressed() { return this.isJustPressed('escape'); }
  isSpaceJustPressed() { return this.isJustPressed('space'); }
  
  // Get device info
  getDeviceInfo() {
    return this.deviceInfo;
  }
  
  // Check if should use mobile layout
  shouldUseMobileLayout() {
    return this.deviceInfo.shouldUseMobileLayout;
  }
  
  // Cleanup
  destroy() {
    if (this.mobileControls) {
      this.mobileControls.destroy();
    }
    
    // Phaser will handle keyboard cleanup automatically
  }
}

// Input event types for custom events
const INPUT_EVENTS = {
  UP_PRESSED: 'up_pressed',
  DOWN_PRESSED: 'down_pressed',
  LEFT_PRESSED: 'left_pressed',
  RIGHT_PRESSED: 'right_pressed',
  ENTER_PRESSED: 'enter_pressed',
  ESCAPE_PRESSED: 'escape_pressed'
};

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
  window.INPUT_EVENTS = INPUT_EVENTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputManager, INPUT_EVENTS };
} 