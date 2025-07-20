// Mobile Controls for touch-based UI elements
class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.deviceInfo = deviceDetector.getDeviceInfo();
    
    // Input state that will be read by InputManager
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      enter: false,
      escape: false
    };
    
    // UI elements
    this.buttons = {};
    this.sliders = {};
    this.uiContainer = null;
    
    // Button size and styling
    this.buttonSize = this.deviceInfo.buttonSize;
    this.buttonStyle = {
      normal: {
        backgroundColor: 0x2c3e50,
        borderColor: 0xff6b35,
        borderWidth: 3,
        alpha: 0.8
      },
      pressed: {
        backgroundColor: 0xff6b35,
        borderColor: 0x2c3e50,
        borderWidth: 3,
        alpha: 1.0
      }
    };
    
    // Create UI container if on mobile
    if (this.deviceInfo.shouldUseMobileLayout) {
      this.createUIContainer();
    }
  }
  
  createUIContainer() {
    // Create a container for all mobile UI elements
    this.uiContainer = this.scene.add.container(0, 0);
    this.uiContainer.setDepth(1000); // Very high depth to be above everything
  }
  
  // Create a touch button
  createButton(id, x, y, width, height, text, callback) {
    if (!this.deviceInfo.shouldUseMobileLayout) return null;
    
    const button = {
      id: id,
      x: x,
      y: y,
      width: width || this.buttonSize,
      height: height || this.buttonSize,
      callback: callback,
      isPressed: false,
      isEnabled: true
    };
    
    // Create button background
    button.background = this.scene.add.graphics();
    this.updateButtonAppearance(button);
    
    // Create button text if provided
    if (text) {
      button.text = this.scene.add.text(x, y, text, {
        fontSize: Math.floor(this.buttonSize * 0.3) + 'px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    
    // Make button interactive
    button.hitArea = this.scene.add.rectangle(x, y, button.width, button.height, 0x000000, 0);
    button.hitArea.setInteractive();
    
    // Touch events
    button.hitArea.on('pointerdown', () => {
      if (!button.isEnabled) return;
      button.isPressed = true;
      this.updateButtonAppearance(button);
      if (button.callback) button.callback('down');
    });
    
    button.hitArea.on('pointerup', () => {
      if (!button.isEnabled) return;
      button.isPressed = false;
      this.updateButtonAppearance(button);
      if (button.callback) button.callback('up');
    });
    
    button.hitArea.on('pointerout', () => {
      if (!button.isEnabled) return;
      button.isPressed = false;
      this.updateButtonAppearance(button);
      if (button.callback) button.callback('out');
    });
    
    // Add to container
    if (this.uiContainer) {
      this.uiContainer.add([button.background, button.hitArea]);
      if (button.text) {
        this.uiContainer.add(button.text);
      }
    }
    
    this.buttons[id] = button;
    return button;
  }
  
  updateButtonAppearance(button) {
    // Use button-specific style if available, otherwise fall back to default
    const buttonStyle = button.style || this.buttonStyle;
    const style = button.isPressed ? buttonStyle.pressed : buttonStyle.normal;
    
    button.background.clear();
    button.background.fillStyle(style.backgroundColor, style.alpha);
    button.background.fillRoundedRect(
      button.x - button.width/2,
      button.y - button.height/2,
      button.width,
      button.height,
      10
    );
    button.background.lineStyle(style.borderWidth, style.borderColor, style.alpha);
    button.background.strokeRoundedRect(
      button.x - button.width/2,
      button.y - button.height/2,
      button.width,
      button.height,
      10
    );
  }
  
  // Alias for backward compatibility with existing code
  createDirectionalButtons() {
    this.createGameDirectionalButtons();
  }
  
  // Legacy method for backward compatibility
  createValueButtons(id, x, y, currentValue, minValue, maxValue, callback) {
    const estimatedTextWidth = 200; // Reasonable estimate for menu text width
    return this.createValueButtonsOutside(id, x, y, estimatedTextWidth, currentValue, minValue, maxValue, callback);
  }
  
  // Create a slider for value adjustment
  createSlider(id, x, y, width, minValue, maxValue, initialValue, callback) {
    if (!this.deviceInfo.shouldUseMobileLayout) return null;
    
    const slider = {
      id: id,
      x: x,
      y: y,
      width: width || 200,
      height: 40,
      minValue: minValue,
      maxValue: maxValue,
      value: initialValue,
      callback: callback,
      isDragging: false
    };
    
    // Create slider track
    slider.track = this.scene.add.graphics();
    slider.track.fillStyle(0x34495e, 0.8);
    slider.track.fillRoundedRect(x - width/2, y - 20, width, 40, 20);
    slider.track.lineStyle(2, 0xff6b35, 1);
    slider.track.strokeRoundedRect(x - width/2, y - 20, width, 40, 20);
    
    // Create slider handle
    const handleX = this.valueToPosition(slider, slider.value);
    slider.handle = this.scene.add.graphics();
    slider.handle.fillStyle(0xff6b35, 1);
    slider.handle.fillCircle(handleX, y, 25);
    slider.handle.lineStyle(3, 0x2c3e50, 1);
    slider.handle.strokeCircle(handleX, y, 25);
    
    // Make handle interactive
    slider.hitArea = this.scene.add.rectangle(x, y, width + 50, 80, 0x000000, 0);
    slider.hitArea.setInteractive();
    
    // Touch events
    slider.hitArea.on('pointerdown', (pointer) => {
      slider.isDragging = true;
      this.updateSliderValue(slider, pointer.x);
    });
    
    slider.hitArea.on('pointermove', (pointer) => {
      if (slider.isDragging) {
        this.updateSliderValue(slider, pointer.x);
      }
    });
    
    slider.hitArea.on('pointerup', () => {
      slider.isDragging = false;
    });
    
    // Add to container
    if (this.uiContainer) {
      this.uiContainer.add([slider.track, slider.handle, slider.hitArea]);
    }
    
    this.sliders[id] = slider;
    return slider;
  }
  
  valueToPosition(slider, value) {
    const range = slider.maxValue - slider.minValue;
    const normalizedValue = (value - slider.minValue) / range;
    return slider.x - slider.width/2 + (normalizedValue * slider.width);
  }
  
  positionToValue(slider, position) {
    const relativePos = position - (slider.x - slider.width/2);
    const normalizedPos = Math.max(0, Math.min(1, relativePos / slider.width));
    return Math.round(slider.minValue + (normalizedPos * (slider.maxValue - slider.minValue)));
  }
  
  updateSliderValue(slider, pointerX) {
    const newValue = this.positionToValue(slider, pointerX);
    if (newValue !== slider.value) {
      slider.value = newValue;
      
      // Update handle position
      const handleX = this.valueToPosition(slider, slider.value);
      slider.handle.clear();
      slider.handle.fillStyle(0xff6b35, 1);
      slider.handle.fillCircle(handleX, slider.y, 25);
      slider.handle.lineStyle(3, 0x2c3e50, 1);
      slider.handle.strokeCircle(handleX, slider.y, 25);
      
      // Call callback
      if (slider.callback) {
        slider.callback(slider.value);
      }
    }
  }
  
  // Create a simple direct action button (not navigation-based)
  createDirectButton(id, x, y, width, height, text, callback, style = {}) {
    
    if (!this.deviceInfo.shouldUseMobileLayout) {
      return null;
    }
    
    const buttonWidth = width || this.buttonSize * 2;
    const buttonHeight = height || this.buttonSize;
    
    const button = {
      id: id,
      x: x,
      y: y,
      width: buttonWidth,
      height: buttonHeight,
      callback: callback,
      isPressed: false,
      isEnabled: true,
      style: { ...this.buttonStyle, ...style }
    };
    
    // Create button background
    button.background = this.scene.add.graphics();
    this.updateButtonAppearance(button);
    
    // Create button text if provided
    if (text) {
      const fontSize = style.fontSize || Math.floor(buttonHeight * 0.3);
      button.text = this.scene.add.text(x, y, text, {
        fontSize: fontSize + 'px',
        color: style.textColor || '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    
    // Make button interactive
    button.hitArea = this.scene.add.rectangle(x, y, buttonWidth, buttonHeight, 0x000000, 0);
    button.hitArea.setInteractive();
    
    // Touch events - single action, not continuous press
    button.hitArea.on('pointerdown', () => {
      if (!button.isEnabled) return;
      button.isPressed = true;
      this.updateButtonAppearance(button);
    });
    
    button.hitArea.on('pointerup', () => {
      if (!button.isEnabled) return;
      if (button.isPressed && button.callback) {
        button.callback(); // Single action callback
      }
      button.isPressed = false;
      this.updateButtonAppearance(button);
    });
    
    button.hitArea.on('pointerout', () => {
      if (!button.isEnabled) return;
      button.isPressed = false;
      this.updateButtonAppearance(button);
    });
    
    // Add to container
    if (this.uiContainer) {
      this.uiContainer.add([button.background, button.hitArea]);
      if (button.text) {
        this.uiContainer.add(button.text);
      }
    }
    
    this.buttons[id] = button;
    
    return button;
  }
  
  // Create a large primary action button (like Start Game)
  createPrimaryButton(id, x, y, text, callback) {
    const buttonWidth = this.buttonSize * 4; // Wider for better touch
    const buttonHeight = this.buttonSize * 1.2; // Taller for better touch
    
    return this.createDirectButton(id, x, y, buttonWidth, buttonHeight, text, callback, {
      normal: {
        backgroundColor: 0xff6b35,
        borderColor: 0x2c3e50,
        borderWidth: 4,
        alpha: 0.9
      },
      pressed: {
        backgroundColor: 0xe74c3c,
        borderColor: 0xff6b35,
        borderWidth: 4,
        alpha: 1.0
      },
      fontSize: Math.floor(buttonHeight * 0.4),
      textColor: '#ffffff'
    });
  }
  
  // Create secondary action buttons (like Resume, Main Menu)
  createSecondaryButton(id, x, y, text, callback) {
    const buttonWidth = this.buttonSize * 3; // Wider for better touch
    const buttonHeight = this.buttonSize; // Standard height for good touch
    
    return this.createDirectButton(id, x, y, buttonWidth, buttonHeight, text, callback, {
      normal: {
        backgroundColor: 0x2c3e50,
        borderColor: 0xff6b35,
        borderWidth: 3,
        alpha: 0.8
      },
      pressed: {
        backgroundColor: 0x34495e,
        borderColor: 0xe74c3c,
        borderWidth: 3,
        alpha: 1.0
      },
      fontSize: Math.floor(buttonHeight * 0.4),
      textColor: '#ffffff'
    });
  }
  
  // Create directional buttons for game controls - extra large buttons for car control
  createGameDirectionalButtons() {
    if (!this.deviceInfo.shouldUseMobileLayout) return;
    
    const safeArea = this.deviceInfo.safeArea;
    const carButtonSize = this.buttonSize * 2.2; // Make car control buttons much larger (120% bigger)
    const spacing = carButtonSize * 0.08; // Slightly reduced spacing for the larger buttons
    
    // Position both buttons in bottom left corner, side by side
    const leftX = safeArea.left + carButtonSize/2 + 20;
    const rightX = leftX + carButtonSize + spacing;
    const buttonsY = this.scene.scale.height - safeArea.bottom - carButtonSize/2 - 20;
    
    // Left button - extra large for excellent car control
    const leftButton = this.createButton('left', leftX, buttonsY, carButtonSize, carButtonSize, '◀', (state) => {
      this.inputState.left = (state === 'down');
    });
    
    // Right button - extra large for excellent car control
    const rightButton = this.createButton('right', rightX, buttonsY, carButtonSize, carButtonSize, '▶', (state) => {
      this.inputState.right = (state === 'down');
    });
    
    // Update font size for larger buttons
    if (leftButton && leftButton.text) {
      leftButton.text.setFontSize(Math.floor(carButtonSize * 0.4));
    }
    if (rightButton && rightButton.text) {
      rightButton.text.setFontSize(Math.floor(carButtonSize * 0.4));
    }
    
    // Pause button (top right) - moved down to avoid UI panel overlap
    const pauseButtonSize = this.buttonSize; // Keep pause button normal size
    const pauseX = this.scene.scale.width - safeArea.right - pauseButtonSize/2 - 20;
    const pauseY = safeArea.top + pauseButtonSize/2 + 140; // Moved down from 20 to 140 to clear UI panel
    
    this.createButton('pause', pauseX, pauseY, pauseButtonSize, pauseButtonSize, '⏸', (state) => {
      if (state === 'down') {
        this.inputState.escape = true;
      }
    });
  }
  
  // Create menu navigation buttons
  createMenuButtons() {
    if (!this.deviceInfo.shouldUseMobileLayout) return;
    
    const safeArea = this.deviceInfo.safeArea;
    const buttonSize = this.buttonSize;
    const spacing = buttonSize * 0.3;
    
    // Up/Down buttons for menu navigation
    const navX = this.scene.scale.width - safeArea.right - buttonSize/2 - 20;
    const centerY = this.scene.scale.height / 2;
    
    this.createButton('up', navX, centerY - buttonSize - spacing, buttonSize, buttonSize, '▲', (state) => {
      this.inputState.up = (state === 'down');
    });
    
    this.createButton('down', navX, centerY + buttonSize + spacing, buttonSize, buttonSize, '▼', (state) => {
      this.inputState.down = (state === 'down');
    });
    
    // Enter button
    const enterX = this.scene.scale.width / 2;
    const enterY = this.scene.scale.height - safeArea.bottom - buttonSize - 20;
    
    this.createButton('enter', enterX, enterY, buttonSize * 2, buttonSize, 'SELECT', (state) => {
      if (state === 'down') {
        this.inputState.enter = true;
      }
    });
  }
  
  // Create value adjustment buttons positioned outside the text (not overlapping)
  createValueButtonsOutside(id, textX, textY, textWidth, getCurrentValue, minValue, maxValue, callback) {
    if (!this.deviceInfo.shouldUseMobileLayout) return null;
    
    const buttonSize = this.buttonSize * 1.1; // Larger buttons for better touch
    const spacing = textWidth/2 + buttonSize/2 + 25; // Position outside the text width with more space
    
    // Decrease button (left side of text)
    this.createButton(id + '_decrease', textX - spacing, textY, buttonSize, buttonSize, '−', (state) => {
      if (state === 'down') {
        const currentValue = typeof getCurrentValue === 'function' ? getCurrentValue() : getCurrentValue;
        const newValue = Math.max(minValue, currentValue - 1);
        if (newValue !== currentValue) {
          callback(newValue);
        }
      }
    });
    
    // Increase button (right side of text)
    this.createButton(id + '_increase', textX + spacing, textY, buttonSize, buttonSize, '+', (state) => {
      if (state === 'down') {
        const currentValue = typeof getCurrentValue === 'function' ? getCurrentValue() : getCurrentValue;
        const newValue = Math.min(maxValue, currentValue + 1);
        if (newValue !== currentValue) {
          callback(newValue);
        }
      }
    });
    
    return {
      decreaseButton: this.buttons[id + '_decrease'],
      increaseButton: this.buttons[id + '_increase']
    };
  }
  
  // Get current input state for InputManager
  getInputState() {
    return { ...this.inputState };
  }
  
  // Update mobile controls (call this in scene update)
  update() {
    // Reset one-time inputs
    this.inputState.enter = false;
    this.inputState.escape = false;
  }
  
  // Enable/disable button
  setButtonEnabled(id, enabled) {
    if (this.buttons[id]) {
      this.buttons[id].isEnabled = enabled;
      this.updateButtonAppearance(this.buttons[id]);
    }
  }
  
  // Show/hide all mobile controls
  setVisible(visible) {
    if (this.uiContainer) {
      this.uiContainer.setVisible(visible);
    }
  }
  
  // Update slider value programmatically
  setSliderValue(id, value) {
    if (this.sliders[id]) {
      this.sliders[id].value = value;
      this.updateSliderValue(this.sliders[id], this.valueToPosition(this.sliders[id], value));
    }
  }
  
  // Cleanup
  destroy() {
    if (this.uiContainer) {
      this.uiContainer.destroy();
    }
    this.buttons = {};
    this.sliders = {};
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.MobileControls = MobileControls;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileControls;
} 