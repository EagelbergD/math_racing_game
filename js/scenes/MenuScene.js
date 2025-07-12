// Enhanced Menu Scene
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  
  create() {
    // Static racing background
    this.add.image(this.scale.width/2, this.scale.height/2, 'racingBg').setScale(
      Math.max(this.scale.width / 800, this.scale.height / 600)
    );
    
    // Add semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    
    // Menu state
    this.currentOption = 0; // 0 = Start Game, 1 = Max Multiplier, 2 = Game Speed
    this.maxMult = 10;
    this.gameSpeed = 2; // 1 = Slow, 2 = Normal, 3 = Fast
    this.speedNames = ['Slow', 'Normal', 'Fast'];
    
    // High scores display state
    this.highScoresSpeed = 2; // Default to Normal speed for high scores display
    
    // Title with racing theme
    const title = this.add.text(this.scale.width/2, this.scale.height/2 - 200, 'MATH RACING QUEST', {
      fontSize: '48px',
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
    this.add.text(this.scale.width/2, this.scale.height/2 - 150, 'Race through math problems!', {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Menu container with background (wider to accommodate cars)
    const menuBg = this.add.graphics();
    menuBg.fillStyle(0x2c3e50, 0.9);
    menuBg.fillRoundedRect(this.scale.width/2 - 350, this.scale.height/2 - 80, 700, 240, 20);
    menuBg.lineStyle(3, 0xff6b35, 1);
    menuBg.strokeRoundedRect(this.scale.width/2 - 350, this.scale.height/2 - 80, 700, 240, 20);
    
    // Add decorative cars on the sides of the menu options
    this.add.image(this.scale.width/2 - 280, this.scale.height/2 + 10, 'playerCar').setScale(1.0).setDepth(1);
    this.add.image(this.scale.width/2 + 280, this.scale.height/2 + 10, 'enemyCar1').setScale(1.0).setDepth(1);
    
    // Menu options - all same color scheme
    this.startGameText = this.add.text(this.scale.width/2, this.scale.height/2 - 40, 'START GAME', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.maxMultText = this.add.text(this.scale.width/2, this.scale.height/2 + 10, `Max Multiplier: ${this.maxMult}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.gameSpeedText = this.add.text(this.scale.width/2, this.scale.height/2 + 60, `Game Speed: ${this.speedNames[this.gameSpeed - 1]}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Instructions
    this.instructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 120, 'Use ↑↓ to select, ← → to change, ENTER to confirm', {
      fontSize: '18px',
      color: '#bdc3c7',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // High scores toggle instructions
    this.highScoresInstructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 145, 'Use 9/0 to toggle high scores speed', {
      fontSize: '16px',
      color: '#95a5a6',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    
    // Create high scores table
    this.createHighScoresTable();
    
    // Store menu elements for easy access
    this.menuOptions = [
      this.startGameText,
      this.maxMultText,
      this.gameSpeedText
    ];
    
    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.key9 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);
    this.key0 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO);
    
    // Initial highlight
    this.updateMenuHighlight();
  }
  
  createHighScoresTable() {
    // Destroy existing table if it exists
    if (this.highScoresTable) {
      this.highScoresTable.destroy();
    }
    
    // Create new high scores table
    const tableY = this.scale.height/2 + 200;
    this.highScoresTable = createHighScoresTable(this, this.scale.width/2, tableY, this.highScoresSpeed);
    
    // Set depth for all elements
    this.highScoresTable.elements.forEach(element => {
      element.setDepth(1);
    });
  }
  
  updateMenuHighlight() {
    // Reset all options to normal style - force clear all properties
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
    // Navigate up/down between options
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.currentOption = Math.max(0, this.currentOption - 1);
      this.updateMenuHighlight();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.currentOption = Math.min(2, this.currentOption + 1);
      this.updateMenuHighlight();
    }
    
    // Change values with left/right
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      if (this.currentOption === 1) { // Max Multiplier
        this.maxMult = Math.max(2, this.maxMult - 1);
        this.maxMultText.setText(`Max Multiplier: ${this.maxMult}`);
      } else if (this.currentOption === 2) { // Game Speed
        this.gameSpeed = Math.max(1, this.gameSpeed - 1);
        this.gameSpeedText.setText(`Game Speed: ${this.speedNames[this.gameSpeed - 1]}`);
      }
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      if (this.currentOption === 1) { // Max Multiplier
        this.maxMult = Math.min(12, this.maxMult + 1);
        this.maxMultText.setText(`Max Multiplier: ${this.maxMult}`);
      } else if (this.currentOption === 2) { // Game Speed
        this.gameSpeed = Math.min(3, this.gameSpeed + 1);
        this.gameSpeedText.setText(`Game Speed: ${this.speedNames[this.gameSpeed - 1]}`);
      }
    }
    
    // Toggle high scores speed display with 9/0 keys
    if (Phaser.Input.Keyboard.JustDown(this.key9)) {
      this.highScoresSpeed = Math.max(1, this.highScoresSpeed - 1);
      this.createHighScoresTable();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.key0)) {
      this.highScoresSpeed = Math.min(3, this.highScoresSpeed + 1);
      this.createHighScoresTable();
    }
    
    // Confirm selection
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (this.currentOption === 0) { // Start Game
        this.registry.set('maxMult', this.maxMult);
        this.registry.set('gameSpeed', this.gameSpeed);
        this.scene.start('GameScene');
      }
    }
  }
} 