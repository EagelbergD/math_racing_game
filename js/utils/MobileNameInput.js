// Mobile Name Input utility for mobile-friendly text input
class MobileNameInput {
  constructor(scene) {
    this.scene = scene;
    this.deviceInfo = deviceDetector.getDeviceInfo();
    this.inputElement = null;
    this.overlayElement = null;
    this.isActive = false;
    this.callback = null;
    this.maxLength = 15;
    this.currentValue = '';
  }
  
  // Show the mobile name input
  show(prompt, initialValue = '', callback) {
    if (this.isActive) {
      return;
    }
    
    this.isActive = true;
    this.callback = callback;
    this.currentValue = initialValue;
    
    // Create overlay
    this.createOverlay(prompt);
    
    // Create input element
    this.createInputElement();
    
    // Show mobile keyboard
    this.showMobileKeyboard();
  }
  
  createOverlay(prompt) {
    // Create overlay div
    this.overlayElement = document.createElement('div');
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    
    // Create prompt text
    const promptElement = document.createElement('div');
    promptElement.textContent = prompt;
    promptElement.style.cssText = `
      color: white;
      font-size: ${this.deviceInfo.isMobile ? '24px' : '20px'};
      font-weight: bold;
      margin-bottom: 20px;
      text-align: center;
    `;
    
    // Create input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      background: #2c3e50;
      padding: 20px;
      border-radius: 10px;
      border: 3px solid #ff6b35;
      min-width: ${this.deviceInfo.isMobile ? '300px' : '400px'};
      max-width: 90%;
    `;
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-top: 20px;
      justify-content: center;
    `;
    
    // Create OK button
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.style.cssText = `
      background: #27ae60;
      color: white;
      border: none;
      padding: ${this.deviceInfo.isMobile ? '15px 30px' : '10px 20px'};
      border-radius: 5px;
      font-size: ${this.deviceInfo.isMobile ? '18px' : '16px'};
      font-weight: bold;
      cursor: pointer;
      min-width: 80px;
    `;
    
    // Create Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: #e74c3c;
      color: white;
      border: none;
      padding: ${this.deviceInfo.isMobile ? '15px 30px' : '10px 20px'};
      border-radius: 5px;
      font-size: ${this.deviceInfo.isMobile ? '18px' : '16px'};
      font-weight: bold;
      cursor: pointer;
      min-width: 80px;
    `;
    
    // Add event listeners
    okButton.addEventListener('click', () => {
      this.submitName();
    });
    
    cancelButton.addEventListener('click', () => {
      this.cancel();
    });
    
    // Add hover effects for desktop
    if (!this.deviceInfo.isMobile) {
      okButton.addEventListener('mouseover', () => {
        okButton.style.background = '#2ecc71';
      });
      okButton.addEventListener('mouseout', () => {
        okButton.style.background = '#27ae60';
      });
      
      cancelButton.addEventListener('mouseover', () => {
        cancelButton.style.background = '#c0392b';
      });
      cancelButton.addEventListener('mouseout', () => {
        cancelButton.style.background = '#e74c3c';
      });
    }
    
    // Assemble elements
    buttonsContainer.appendChild(okButton);
    buttonsContainer.appendChild(cancelButton);
    inputContainer.appendChild(buttonsContainer);
    
    this.overlayElement.appendChild(promptElement);
    this.overlayElement.appendChild(inputContainer);
    
    // Add to page
    document.body.appendChild(this.overlayElement);
    
    // Store references
    this.okButton = okButton;
    this.cancelButton = cancelButton;
    this.inputContainer = inputContainer;
  }
  
  createInputElement() {
    // Create input element
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.value = this.currentValue;
    this.inputElement.maxLength = this.maxLength;
    this.inputElement.placeholder = 'Enter your name...';
    
    // Style the input
    this.inputElement.style.cssText = `
      width: 100%;
      padding: ${this.deviceInfo.isMobile ? '15px' : '10px'};
      font-size: ${this.deviceInfo.isMobile ? '20px' : '18px'};
      border: 2px solid #3498db;
      border-radius: 5px;
      background: #34495e;
      color: white;
      text-align: center;
      outline: none;
      box-sizing: border-box;
    `;
    
    // Add focus styling
    this.inputElement.addEventListener('focus', () => {
      this.inputElement.style.borderColor = '#ff6b35';
      this.inputElement.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.5)';
    });
    
    this.inputElement.addEventListener('blur', () => {
      this.inputElement.style.borderColor = '#3498db';
      this.inputElement.style.boxShadow = 'none';
    });
    
    // Handle input changes
    this.inputElement.addEventListener('input', (e) => {
      this.currentValue = e.target.value;
      // Filter out invalid characters
      this.currentValue = this.currentValue.replace(/[^a-zA-Z0-9 ]/g, '');
      if (this.currentValue !== e.target.value) {
        e.target.value = this.currentValue;
      }
    });
    
    // Handle Enter key
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.submitName();
      } else if (e.key === 'Escape') {
        this.cancel();
      }
    });
    
    // Add to input container (before buttons)
    this.inputContainer.insertBefore(this.inputElement, this.inputContainer.lastChild);
  }
  
  showMobileKeyboard() {
    // Focus the input to show mobile keyboard
    setTimeout(() => {
      this.inputElement.focus();
      
      // For mobile devices, scroll to ensure input is visible
      if (this.deviceInfo.isMobile) {
        this.inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  
  submitName() {
    const name = this.currentValue.trim();
    const finalName = name.length > 0 ? name : 'Anonymous';
    
    // Store callback reference before hiding (which clears it)
    const callbackToExecute = this.callback;
    
    this.hide();
    
    if (callbackToExecute) {
      callbackToExecute(finalName);
    }
  }
  
  cancel() {
    // Store callback reference before hiding (which clears it)
    const callbackToExecute = this.callback;
    
    this.hide();
    
    if (callbackToExecute) {
      callbackToExecute(null); // null indicates cancellation
    }
  }
  
  hide() {
    this.isActive = false;
    
    // Remove overlay
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
    }
    
    // Clean up references
    this.overlayElement = null;
    this.inputElement = null;
    this.okButton = null;
    this.cancelButton = null;
    this.inputContainer = null;
    this.callback = null;
  }
  
  // Check if name input is currently active
  isInputActive() {
    return this.isActive;
  }
  
  // Set maximum length for name input
  setMaxLength(maxLength) {
    this.maxLength = maxLength;
    if (this.inputElement) {
      this.inputElement.maxLength = maxLength;
    }
  }
  
  // Utility method to show name input with promise
  showAsync(prompt, initialValue = '') {
    return new Promise((resolve) => {
      this.show(prompt, initialValue, (result) => {
        resolve(result);
      });
    });
  }
}

// Create global instance for easy access
let mobileNameInput = null;

// Helper function to get or create mobile name input
function getMobileNameInput(scene) {
    if (!getMobileNameInput.instance) {
        getMobileNameInput.instance = new MobileNameInput(scene);
    }
    return getMobileNameInput.instance;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.MobileNameInput = MobileNameInput;
  window.getMobileNameInput = getMobileNameInput;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileNameInput, getMobileNameInput };
} 