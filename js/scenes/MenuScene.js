// Enhanced Menu Scene
class MenuScene extends Phaser.Scene {
  constructor() { 
    super('MenuScene');
    console.log('🎮 MenuScene constructor called');
  }
  
  create() {
    console.log('🎮 MenuScene create called');
    
    try {
      const deviceDetector = new DeviceDetector();
      console.log('✅ DeviceDetector created');
      
      // Initialize input manager
      this.inputManager = new InputManager(this, deviceDetector);
      console.log('✅ InputManager created');
      
      // Initialize mobile controls if needed
      if (this.inputManager.shouldUseMobileLayout()) {
        console.log('📱 Creating mobile controls');
        this.mobileControls = new MobileControls(this);
        this.inputManager.setMobileControls(this.mobileControls);
      } else {
        console.log('🖥️ Using desktop controls');
      }
      
      console.log('🎮 MenuScene setup complete');
      
    } catch (error) {
      console.error('❌ Error in MenuScene create:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
    
    // Static racing background - special scaling for mobile portrait
    this.backgroundImage = this.add.image(this.scale.width/2, this.scale.height/2, 'racingBg');
    
    // Apply full-screen scaling only for mobile portrait mode
    const isMobilePortrait = this.inputManager.shouldUseMobileLayout() && this.scale.height > this.scale.width;
    
    if (isMobilePortrait) {
      // Mobile portrait: scale to cover entire screen (no empty areas)
      const scaleX = this.scale.width / this.backgroundImage.width;
      const scaleY = this.scale.height / this.backgroundImage.height;
      const scale = Math.max(scaleX, scaleY); // Use larger scale to ensure full coverage
      this.backgroundImage.setScale(scale);
    } else {
      // Desktop/landscape: use original scaling method
      const bgScale = Math.max(this.scale.width / 800, this.scale.height / 600);
      this.backgroundImage.setScale(bgScale);
    }
    
    // Add semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    
    // Menu state
    this.currentOption = 0; // 0 = Start Game, 1 = Max Multiplier, 2 = Game Speed
    this.maxMult = 10;
    this.gameSpeed = 2; // 0 = Very Slow, 1 = Slow, 2 = Normal, 3 = Fast, 4 = Very Fast
    this.speedNames = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
    
    // High scores display state
    this.highScoresSpeed = 2; // Default to Normal speed for high scores display
    
    // Title with racing theme - responsive sizing and positioning
    const isPortrait = this.scale.height > this.scale.width;
    const titleFontSize = isPortrait ? '36px' : '48px';
    const titleY = isPortrait ? this.scale.height * 0.15 : this.scale.height/2 - 200;
    
    const title = this.add.text(this.scale.width/2, titleY, 'MATH RACING QUEST', {
      fontSize: titleFontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 5,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Subtitle
    const subtitleFontSize = isPortrait ? '20px' : '24px';
    const subtitleY = isPortrait ? this.scale.height * 0.2 : this.scale.height/2 - 150;
    
    this.add.text(this.scale.width/2, subtitleY, 'Race through math problems!', {
      fontSize: subtitleFontSize,
      color: '#ecf0f1',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Menu container with background - responsive positioning and sizing with increased height for mobile
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x2c3e50, 0.9);
    
    const menuWidth = isPortrait ? Math.min(480, this.scale.width - 60) : 700;
    const menuHeight = this.inputManager.shouldUseMobileLayout() ? (isPortrait ? 340 : 280) : 240; // Increased portrait height from 300 to 340
    const menuTop = isPortrait ? this.scale.height * 0.35 : 
                   (this.inputManager.shouldUseMobileLayout() ? this.scale.height/2 - 100 : this.scale.height/2 - 80);
    
    menuBg.fillRoundedRect(this.scale.width/2 - menuWidth/2, menuTop, menuWidth, menuHeight, 20);
    menuBg.lineStyle(3, 0xff6b35, 1);
    menuBg.strokeRoundedRect(this.scale.width/2 - menuWidth/2, menuTop, menuWidth, menuHeight, 20);
    
    // Add decorative cars on the sides of the menu options - hide on portrait for space
    if (!isPortrait) {
      this.add.image(this.scale.width/2 - 280, this.scale.height/2 + 10, 'playerCar').setScale(1.0).setDepth(1);
      this.add.image(this.scale.width/2 + 280, this.scale.height/2 + 10, 'enemyCar1').setScale(1.0).setDepth(1);
    }
    
    // Menu options - responsive positioning and sizing with increased mobile spacing
    const optionsFontSize = isPortrait ? '24px' : '28px';
    const startGameY = isPortrait ? menuTop + 50 : this.scale.height/2 - 40;
    const maxMultY = isPortrait ? menuTop + 140 : this.scale.height/2 + 10; // Increased from +120 to +140 to match button spacing
    const gameSpeedY = isPortrait ? menuTop + 210 : this.scale.height/2 + 60; // Increased from +170 to +210 to match button spacing
    
    // Menu options - hide Start Game text on mobile since we have a button
    if (!this.inputManager.shouldUseMobileLayout()) {
      this.startGameText = this.add.text(this.scale.width/2, startGameY, 'START GAME', {
        fontSize: isPortrait ? '28px' : '32px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    
    this.maxMultText = this.add.text(this.scale.width/2, maxMultY, `Max Multiplier: ${this.maxMult}`, {
      fontSize: optionsFontSize,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.gameSpeedText = this.add.text(this.scale.width/2, gameSpeedY, `Game Speed: ${this.speedNames[this.gameSpeed]}`, {
      fontSize: optionsFontSize,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Instructions - adapt based on device and orientation with adjusted position
    const instructionText = this.inputManager.shouldUseMobileLayout() 
      ? 'Use touch controls to navigate and select'
      : 'Use ↑↓ to select, ← → to change, ENTER to confirm';
    
    const instructionsY = isPortrait ? menuTop + 270 : this.scale.height/2 + 120; // Increased from +230 to +270 for mobile
    const instructionsFontSize = isPortrait ? '16px' : '18px';
    
    this.instructionsText = this.add.text(this.scale.width/2, instructionsY, instructionText, {
      fontSize: instructionsFontSize,
      color: '#bdc3c7',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // High scores toggle instructions - only show on desktop
    if (!this.inputManager.shouldUseMobileLayout()) {
      const highScoresInstructionsY = isPortrait ? menuTop + 255 : this.scale.height/2 + 145;
      this.highScoresInstructionsText = this.add.text(this.scale.width/2, highScoresInstructionsY, 'Use 9/0 to toggle high scores speed', {
        fontSize: '14px',
        color: '#95a5a6',
        fontStyle: 'italic'
      }).setOrigin(0.5);
    }
    
    // Create high scores table
    this.createHighScoresTable();
    
    // Store menu elements for easy access (only include elements that exist)
    this.menuOptions = [];
    if (this.startGameText) this.menuOptions.push(this.startGameText);
    this.menuOptions.push(this.maxMultText, this.gameSpeedText);
    
    // Setup mobile controls if needed
    this.setupMobileControls();
    
    // Desktop-only keys for high scores toggle
    if (!this.inputManager.shouldUseMobileLayout()) {
      this.key9 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
      this.key0 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    }
    
    // Initial highlight
    this.updateMenuHighlight();
  }
  
  // Handle orientation changes
  handleOrientationChange() {
    // Update background scaling for new orientation if it exists
    if (this.backgroundImage) {
      const isMobilePortrait = this.inputManager.shouldUseMobileLayout() && this.scale.height > this.scale.width;
      
      if (isMobilePortrait) {
        // Mobile portrait: scale to cover entire screen
        const scaleX = this.scale.width / this.backgroundImage.width;
        const scaleY = this.scale.height / this.backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);
        this.backgroundImage.setScale(scale);
      } else {
        // Desktop/landscape: use original scaling
        const bgScale = Math.max(this.scale.width / 800, this.scale.height / 600);
        this.backgroundImage.setScale(bgScale);
      }
      
      this.backgroundImage.setPosition(this.scale.width/2, this.scale.height/2);
    }
    
    // Recreate the scene layout for new orientation
    this.scene.restart();
  }
  
  createHighScoresTable() {
    // Destroy existing table if it exists
    if (this.highScoresTable) {
      this.highScoresTable.destroy();
    }
    
    // Create new high scores table - responsive positioning
    const isPortrait = this.scale.height > this.scale.width;
    const tableY = isPortrait ? this.scale.height * 0.75 : this.scale.height/2 + 200;
    this.highScoresTable = createHighScoresTable(this, this.scale.width/2, tableY, this.highScoresSpeed);
    
    // Set depth for all elements
    this.highScoresTable.elements.forEach(element => {
      element.setDepth(1);
    });
  }
  
  setupMobileControls() {
    if (!this.inputManager.shouldUseMobileLayout()) return;
    
    const isPortrait = this.scale.height > this.scale.width;
    const menuTop = isPortrait ? this.scale.height * 0.35 : this.scale.height/2 - 100;
    
    // Create direct Start Game button (primary action) with responsive positioning
    const startGameY = isPortrait ? menuTop + 50 : this.scale.height/2 - 60;
    this.mobileControls.createPrimaryButton(
      'startGame',
      this.scale.width/2,
      startGameY,
      'START GAME',
      () => {
        this.registry.set('maxMult', this.maxMult);
        this.registry.set('gameSpeed', this.gameSpeed);
        this.scene.start('GameScene');
      }
    );
    
    // Create value adjustment buttons for max multiplier - increased spacing
    const maxMultTextWidth = isPortrait ? 240 : 280;
    const maxMultY = isPortrait ? menuTop + 140 : this.scale.height/2 + 10; // Increased from +120 to +140
    this.mobileControls.createValueButtonsOutside(
      'maxMult', 
      this.scale.width/2, 
      maxMultY, 
      maxMultTextWidth,
      () => this.maxMult, // Getter function to get current value
      2, 
      12, 
      (newValue) => {
        this.maxMult = newValue;
        this.maxMultText.setText(`Max Multiplier: ${this.maxMult}`);
      }
    );
    
    // Create value adjustment buttons for game speed - increased spacing
    const gameSpeedTextWidth = isPortrait ? 240 : 280;
    const gameSpeedY = isPortrait ? menuTop + 210 : this.scale.height/2 + 60; // Increased from +170 to +210
    this.mobileControls.createValueButtonsOutside(
      'gameSpeed', 
      this.scale.width/2, 
      gameSpeedY, 
      gameSpeedTextWidth,
      () => this.gameSpeed, // Getter function to get current value
      0, 
      4, 
      (newValue) => {
        this.gameSpeed = newValue;
        this.gameSpeedText.setText(`Game Speed: ${this.speedNames[this.gameSpeed]}`);
      }
    );
    
    // Create high scores speed toggle buttons - positioned under the high scores table
    this.createHighScoresControls();
  }
  
  createHighScoresControls() {
    if (!this.inputManager.shouldUseMobileLayout()) return;
    
    // Calculate dynamic position based on high scores table height
    const tableBaseY = this.scale.height/2 + 200; // Same as in createHighScoresTable
    const scores = highScores.getScores(this.highScoresSpeed);
    
    // Calculate table height:
    // Title: 0
    // Header: +40
    // Separator: +65  
    // Entries: +95 + (numEntries * 25) OR +135 if no scores ("No scores yet!" text)
    const numEntries = scores.length;
    const tableHeight = numEntries > 0 ? 95 + (numEntries * 25) : 135;
    const tableBottomY = tableBaseY + tableHeight;
    
    // Position controls with margin below the actual table bottom
    const controlsY = tableBottomY + 60; // 60px margin below table
    
    // Add label for high scores toggle (mobile only)
    this.highScoresSpeedLabel = this.add.text(this.scale.width/2, controlsY - 30, `High Scores: ${this.speedNames[this.highScoresSpeed]}`, {
      fontSize: '18px',
      color: '#95a5a6',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Create left/right arrow buttons positioned under the table
    const buttonSize = this.mobileControls.buttonSize * 0.8;
    const spacing = 80; // Distance between buttons
    
    // Left arrow button (decrease speed)
    this.mobileControls.createButton('highScores_left', 
      this.scale.width/2 - spacing, controlsY, 
      buttonSize, buttonSize, '◀', 
      (state) => {
        if (state === 'down') {
          const newValue = Math.max(0, this.highScoresSpeed - 1);
          if (newValue !== this.highScoresSpeed) {
            this.highScoresSpeed = newValue;
            this.createHighScoresTable();
            // Recreate controls with new table height
            this.destroyHighScoresControls();
            this.createHighScoresControls();
          }
        }
      }
    );
    
    // Right arrow button (increase speed)
    this.mobileControls.createButton('highScores_right', 
      this.scale.width/2 + spacing, controlsY, 
      buttonSize, buttonSize, '▶', 
      (state) => {
        if (state === 'down') {
          const newValue = Math.min(4, this.highScoresSpeed + 1);
          if (newValue !== this.highScoresSpeed) {
            this.highScoresSpeed = newValue;
            this.createHighScoresTable();
            // Recreate controls with new table height
            this.destroyHighScoresControls();
            this.createHighScoresControls();
          }
        }
      }
    );
  }
  
  destroyHighScoresControls() {
    if (!this.inputManager.shouldUseMobileLayout()) return;
    
    // Destroy the label
    if (this.highScoresSpeedLabel) {
      this.highScoresSpeedLabel.destroy();
      this.highScoresSpeedLabel = null;
    }
    
    // Destroy the buttons through mobile controls
    if (this.mobileControls) {
      // Remove the specific buttons
      if (this.mobileControls.buttons['highScores_left']) {
        const leftButton = this.mobileControls.buttons['highScores_left'];
        if (leftButton.background) leftButton.background.destroy();
        if (leftButton.text) leftButton.text.destroy();
        if (leftButton.hitArea) leftButton.hitArea.destroy();
        delete this.mobileControls.buttons['highScores_left'];
      }
      
      if (this.mobileControls.buttons['highScores_right']) {
        const rightButton = this.mobileControls.buttons['highScores_right'];
        if (rightButton.background) rightButton.background.destroy();
        if (rightButton.text) rightButton.text.destroy();
        if (rightButton.hitArea) rightButton.hitArea.destroy();
        delete this.mobileControls.buttons['highScores_right'];
      }
    }
  }
  
  updateMenuHighlight() {
    // Only update highlighting on desktop
    if (this.inputManager.shouldUseMobileLayout()) return;
    
    // Reset all options to normal style - force clear all properties
    if (this.startGameText) {
      this.startGameText.setStyle({
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '',
        padding: { x: 0, y: 0 },
        stroke: '',
        strokeThickness: 0,
        shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
      });
    }
    
    this.maxMultText.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    this.gameSpeedText.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    // Highlight current option with consistent styling
    const currentElement = this.menuOptions[this.currentOption];
    if (!currentElement) return;
    
    const baseFontSize = this.currentOption === 0 ? '32px' : '28px';
    const highlightFontSize = this.currentOption === 0 ? '38px' : '34px';
    
    currentElement.setStyle({
      fontSize: highlightFontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#ff6b35',
      padding: { x: 20, y: 10 },
      stroke: '#000000',
      strokeThickness: 2,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 5,
        fill: true
      }
    });
  }
  
  update() {
    // Update input manager
    this.inputManager.update();
    
    // Update mobile controls if present
    if (this.mobileControls) {
      this.mobileControls.update();
    }
    
    // Desktop-only controls
    if (!this.inputManager.shouldUseMobileLayout()) {
      // Navigate up/down between options (desktop only)
      if (this.inputManager.isUpJustPressed()) {
        this.currentOption = Math.max(0, this.currentOption - 1);
        this.updateMenuHighlight();
      }
      
      if (this.inputManager.isDownJustPressed()) {
        this.currentOption = Math.min(2, this.currentOption + 1);
        this.updateMenuHighlight();
      }
      
      // Change values with left/right (desktop only)
      if (this.inputManager.isLeftJustPressed()) {
        if (this.currentOption === 1) { // Max Multiplier
          this.maxMult = Math.max(2, this.maxMult - 1);
          this.maxMultText.setText(`Max Multiplier: ${this.maxMult}`);
        } else if (this.currentOption === 2) { // Game Speed
          this.gameSpeed = Math.max(0, this.gameSpeed - 1);
          this.gameSpeedText.setText(`Game Speed: ${this.speedNames[this.gameSpeed]}`);
        }
      }
      
      if (this.inputManager.isRightJustPressed()) {
        if (this.currentOption === 1) { // Max Multiplier
          this.maxMult = Math.min(12, this.maxMult + 1);
          this.maxMultText.setText(`Max Multiplier: ${this.maxMult}`);
        } else if (this.currentOption === 2) { // Game Speed
          this.gameSpeed = Math.min(4, this.gameSpeed + 1);
          this.gameSpeedText.setText(`Game Speed: ${this.speedNames[this.gameSpeed]}`);
        }
      }
      
      // Toggle high scores speed display with 9/0 keys (desktop only)
      if (this.key9 && Phaser.Input.Keyboard.JustDown(this.key9)) {
        this.highScoresSpeed = Math.max(0, this.highScoresSpeed - 1);
        this.createHighScoresTable();
      }
      
      if (this.key0 && Phaser.Input.Keyboard.JustDown(this.key0)) {
        this.highScoresSpeed = Math.min(4, this.highScoresSpeed + 1);
        this.createHighScoresTable();
      }
      
      // Confirm selection (desktop only)
      if (this.inputManager.isEnterJustPressed()) {
        if (this.currentOption === 0) { // Start Game
          this.registry.set('maxMult', this.maxMult);
          this.registry.set('gameSpeed', this.gameSpeed);
          this.scene.start('GameScene');
        }
      }
    }
    
    // Update high scores speed label on mobile
    if (this.inputManager.shouldUseMobileLayout() && this.highScoresSpeedLabel) {
      this.highScoresSpeedLabel.setText(`High Scores: ${this.speedNames[this.highScoresSpeed]}`);
    }
  }
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.MenuScene = MenuScene;
}

if (typeof module !== 'undefined' && module.exports) {
    const { InputManager } = require('../utils/InputManager.js');
    const MobileControls = require('../utils/MobileControls.js');
    const DeviceDetector = require('../utils/DeviceDetector.js');
    const { createHighScoresTable, highScores } = require('../highScores.js');
    module.exports = MenuScene;
} 