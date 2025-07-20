// Enhanced Game Scene with racing theme
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  
  create() {
    const deviceDetector = new DeviceDetector();
    // Define orientation early for use throughout create method and store as class property
    this.isPortrait = this.scale.height > this.scale.width;
    
    // Initialize input manager
    this.inputManager = new InputManager(this, deviceDetector);
    
    // Initialize mobile controls if needed
    if (this.inputManager.shouldUseMobileLayout()) {
      this.mobileControls = new MobileControls(this);
      this.inputManager.setMobileControls(this.mobileControls);
    }
    
    // Restore game state if coming from orientation change, otherwise use defaults
    const savedGameState = this.registry.get('gameState');
    if (savedGameState) {
      this.lives = savedGameState.lives;
      this.score = savedGameState.score;
      this.speed = savedGameState.speed;
      this.gameSpeed = savedGameState.gameSpeed;
      this.maxMult = savedGameState.maxMult;
      this.selectedSpeed = savedGameState.selectedSpeed;
      // Clear the saved state
      this.registry.set('gameState', null);
    } else {
      this.maxMult = this.registry.get('maxMult') || 10;
      this.selectedSpeed = this.registry.get('gameSpeed') ?? 2;
      this.lives = 3;
      this.score = 0;
      this.speed = 150;
    }
    
    // Set game speed based on selection: 0=Very Slow, 1=Slow, 2=Normal, 3=Fast, 4=Very Fast
    const speedMap = { 0: 15, 1: 25, 2: 50, 3: 100, 4: 150 };
    this.gameSpeed = speedMap[this.selectedSpeed];
    
    // Current lane (will be positioned correctly after road creation)
    this.currentLane = 1;
    
    // Create scrolling road background (this will set up lanes)
    this.createRoadBackground();
    
    // Player car (positioned after road background creation) - appropriately sized for mobile view
    this.player = this.physics.add.sprite(this.lanes[this.currentLane], this.scale.height - 100, 'playerCar');
    const carScale = this.isPortrait ? 0.8 : 0.9; // Good size for mobile - not too tiny, not too big
    this.player.setScale(carScale);
    this.player.body.allowGravity = false;
    this.player.setImmovable(true);
    this.player.setDepth(10); // Higher depth to ensure visibility
    
    // Add car engine sound effect (visual feedback)
    this.createEngineEffect();
    
    // Enhanced UI with racing theme
    this.createUI();
    
    // Obstacle cars group (these will have the math answers)
    this.obstacleCars = this.physics.add.group();
    this.physics.add.overlap(this.player, this.obstacleCars, this.handleCollision, null, this);
    
    // Add decorative elements
    this.createDecorations();
    
    // Setup mobile controls if needed
    this.setupMobileControls();
    
    // Pause menu state
    this.isPaused = false;
    this.pauseMenu = null;
    
    // Start first question
    this.nextQuestion();
  }
  
  // Handle orientation changes
  handleOrientationChange() {
    // Update orientation property
    this.isPortrait = this.scale.height > this.scale.width;
    
    // Recreate the scene layout for new orientation while preserving game state
    const currentGameState = {
      lives: this.lives,
      score: this.score,
      speed: this.speed,
      gameSpeed: this.gameSpeed,
      maxMult: this.maxMult,
      selectedSpeed: this.selectedSpeed
    };
    
    // Store the state in registry
    this.registry.set('gameState', currentGameState);
    
    // Restart the scene
    this.scene.restart();
  }
  
  createRoadBackground() {
    // Create grass background on sides (use a cleaner grass tile)
    this.grassBg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'grassTile');
    this.grassBg.setOrigin(0, 0);
    this.grassBg.setDepth(-3);
    
    // Create road in the center - narrower road to show more grass
    const roadWidth = this.isPortrait ? 
      Math.min(this.scale.width * 0.58, 320) : // Portrait: reduced from 68% to 58% width, max 320px (much more grass visible)
      Math.min(420, this.scale.width * 0.38);    // Landscape: reduced from 45% to 38% width, max 420px (more grass)
    const roadX = (this.scale.width - roadWidth) / 2;
    this.roadBg = this.add.tileSprite(roadX, 0, roadWidth, this.scale.height, 'roadTile');
    this.roadBg.setOrigin(0, 0);
    this.roadBg.setDepth(-2);
    
    // Add red-white barriers ONLY on the outer edges of the road
    const barrierWidth = 25; // Increased width to make it more visible
    
    // Left outer barrier (left edge of road)
    this.leftBarrier = this.add.tileSprite(roadX - barrierWidth, 0, barrierWidth, this.scale.height, 'leftBarrierTile');
    this.leftBarrier.setOrigin(0, 0);
    this.leftBarrier.setDepth(-1);
    
    // Right outer barrier (right edge of road) - use left barrier flipped horizontally
    const rightBarrierX = roadX + roadWidth;
    this.rightBarrier = this.add.tileSprite(rightBarrierX, 0, barrierWidth, this.scale.height, 'leftBarrierTile');
    this.rightBarrier.setOrigin(0, 0);
    this.rightBarrier.setDepth(-1);
    this.rightBarrier.setFlipX(true); // Flip horizontally to mirror the left barrier
    
    // Calculate lanes to fit within the road area
    const laneWidth = roadWidth / 3;
    this.lanes = [
      roadX + laneWidth * 0.5,  // Center of first lane
      roadX + laneWidth * 1.5,  // Center of second lane
      roadX + laneWidth * 2.5   // Center of third lane
    ];
    
    // Add white dashed lines between the 3 lanes using white arrows
    // First lane divider (between lane 1 and 2)
    const line1X = roadX + laneWidth;
    this.laneLine1 = this.add.tileSprite(line1X - 2, 0, 4, this.scale.height, 'laneArrow');
    this.laneLine1.setOrigin(0, 0);
    this.laneLine1.setDepth(-1);
    
    // Second lane divider (between lane 2 and 3)
    const line2X = roadX + (laneWidth * 2);
    this.laneLine2 = this.add.tileSprite(line2X - 2, 0, 4, this.scale.height, 'laneArrow');
    this.laneLine2.setOrigin(0, 0);
    this.laneLine2.setDepth(-1);
  }
  
  createEngineEffect() {
    // Add exhaust particles behind player car (reduced for performance)
    const particles = this.add.particles(this.player.x, this.player.y + 30, 'cone', {
      scale: { start: 0.05, end: 0 }, // Reduced from 0.1
      speed: { min: 30, max: 60 }, // Reduced from 50-100
      lifespan: 200, // Reduced from 300
      frequency: 200, // Reduced from 100 (less frequent)
      tint: 0x666666,
      quantity: 1 // Only 1 particle at a time
    });
    particles.startFollow(this.player, 0, 30);
  }
  
  createUI() {
    
    // Get safe area for mobile devices to avoid notches and navigation
    const safeAreaTop = this.inputManager.shouldUseMobileLayout() ? 
      Math.max(20, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0')) : 0;
    const safeAreaBottom = this.inputManager.shouldUseMobileLayout() ? 
      Math.max(20, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0')) : 0;
    
    // UI Background panel - responsive height for portrait with safe area consideration
    const uiPanel = this.add.graphics();
    uiPanel.fillStyle(0x2c3e50, 0.9);
    const uiHeight = this.isPortrait ? 140 : 120; // Taller on portrait for better text spacing
    const uiTop = 10 + safeAreaTop; // Add safe area offset
    uiPanel.fillRoundedRect(10, uiTop, this.scale.width - 20, uiHeight, 10);
    uiPanel.lineStyle(2, 0xff6b35, 1);
    uiPanel.strokeRoundedRect(10, uiTop, this.scale.width - 20, uiHeight, 10);
    uiPanel.setDepth(10);
    
    // Question text with enhanced styling - responsive font size with safe area offset
    const questionFontSize = this.isPortrait ? '28px' : '36px';
    const questionY = (this.isPortrait ? 60 : 50) + safeAreaTop;
    this.questionText = this.add.text(this.scale.width/2, questionY, '', {
      fontSize: questionFontSize,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 3,
        fill: true
      }
    }).setOrigin(0.5).setDepth(11);
    
    // Status texts with responsive sizing and positioning with safe area offset
    const statusFontSize = this.isPortrait ? '20px' : '24px';
    const smallStatusFontSize = this.isPortrait ? '16px' : '18px';
    const livesY = (this.isPortrait ? 110 : 90) + safeAreaTop;
    const scoreY = 30 + safeAreaTop;
    const speedY = 30 + safeAreaTop;
    const levelY = (this.isPortrait ? 55 : 60) + safeAreaTop;
    
    // Lives display with heart-like styling
    this.livesText = this.add.text(30, livesY, `❤️ Lives: ${this.lives}`, {
      fontSize: statusFontSize,
      color: '#e74c3c',
      fontStyle: 'bold'
    }).setDepth(11);
    
    // Score display with trophy styling
    this.scoreText = this.add.text(30, scoreY, `🏆 Score: ${this.score}`, {
      fontSize: statusFontSize,
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setDepth(11);
    
    // Speed display
    this.speedText = this.add.text(this.scale.width - 30, speedY, `⚡ Speed: ${this.gameSpeed}`, {
      fontSize: this.isPortrait ? '18px' : '20px',
      color: '#3498db',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11);
    
    // Level indicator
    this.levelText = this.add.text(this.scale.width - 30, levelY, `🎯 Max: ${this.maxMult}`, {
      fontSize: smallStatusFontSize,
      color: '#9b59b6',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11);
    
    // Instructions text - adapt based on device
    const instructionText = this.inputManager.shouldUseMobileLayout() 
      ? 'Use touch controls to change lanes'
      : 'Use ← → to change lanes';
    
    this.instructionsText = this.add.text(this.scale.width - 30, 90 + safeAreaTop, instructionText, {
      fontSize: '16px',
      color: '#bdc3c7',
      fontStyle: 'italic'
    }).setOrigin(1, 0).setDepth(11);
  }
  
  createDecorations() {
    // Add trees and barriers on the sides
    this.decorations = this.physics.add.group();
    
    this.decorationTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnDecoration,
      callbackScope: this,
      loop: true
    });
  }
  
  setupMobileControls() {
    if (!this.inputManager.shouldUseMobileLayout()) return;
    
    // Create improved directional buttons for lane switching - positioned side by side in bottom left
    this.mobileControls.createGameDirectionalButtons();
  }
  
  spawnDecoration() {
    const side = Phaser.Math.RND.pick(['left', 'right']);
    const x = side === 'left' ? 50 : this.scale.width - 50;
    const decoration = this.add.image(x, -50, Phaser.Math.RND.pick(['tree', 'cone', 'barrier']));
    decoration.setScale(this.isPortrait ? 0.4 : 0.5); // Much smaller decorations for zoomed out view
    
    this.decorations.add(decoration);
    this.physics.world.enable(decoration);
    decoration.body.setVelocityY(this.gameSpeed);
    decoration.body.allowGravity = false;
    
    // Remove when off screen
    this.time.delayedCall(5000, () => {
      if (decoration.active) {
        decoration.destroy();
      }
    });
  }
  
  clearAllCars() {
    // Properly clean up both cars and their text
    this.obstacleCars.children.entries.forEach(car => {
      if (car.answerText && car.answerText.active) {
        car.answerText.destroy();
      }
    });
    
    // Clear the cars group
    this.obstacleCars.clear(true, true);
  }
  
  nextQuestion() {
    // Clear previous obstacle cars
    this.clearAllCars();
    
    // Generate multiplication question
    const a = Phaser.Math.Between(1, this.maxMult);
    const b = Phaser.Math.Between(1, this.maxMult);
    this.correct = a * b;
    this.questionText.setText(`${a} × ${b} = ?`);
    
    // Add question pulse effect
    this.tweens.add({
      targets: this.questionText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: true,
      ease: 'Power2'
    });
    
    // Generate wrong answers
    const wrongs = new Set();
    while (wrongs.size < 2) {
      const delta = Phaser.Math.Between(1, Math.max(5, this.maxMult));
      const wrong = Phaser.Math.RND.pick([this.correct + delta, this.correct - delta]);
      if (wrong > 0 && wrong !== this.correct) {
        wrongs.add(wrong);
      }
    }
    
    // Create answer options as obstacle cars
    const options = Phaser.Utils.Array.Shuffle([this.correct, ...wrongs]);
    const carSprites = ['enemyCar1', 'enemyCar2', 'enemyCar3'];
    
    options.forEach((answer, idx) => {
      const x = this.lanes[idx];
      const y = 100; // Start cars at visible position
      
      // Create obstacle car (using regular sprite, not physics) - appropriately sized for mobile view
      const car = this.add.sprite(x, y, carSprites[idx]);
      const carScale = this.isPortrait ? 0.8 : 0.9; // Good size - consistent with player car
      car.setScale(carScale);
      car.correct = (answer === this.correct);
      car.setDepth(50); // Much higher depth to ensure visibility
      
      // Determine background color based on car sprite
      let bgColor = '#666666'; // Default gray
      if (carSprites[idx] === 'enemyCar1') bgColor = '#8B0000'; // Dark red for red car
      else if (carSprites[idx] === 'enemyCar2') bgColor = '#B8860B'; // Dark yellow for yellow car  
      else if (carSprites[idx] === 'enemyCar3') bgColor = '#006400'; // Dark green for green car
      
      const answerText = this.add.text(x, y, `${answer}`, {
        fontSize: this.isPortrait ? '28px' : '32px', // Good text size to match car size
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: bgColor,
        padding: { x: 10, y: 7 }, // Good padding for readability
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      answerText.setDepth(100); // Very high depth for text visibility
      
      // Make text follow the car
      car.answerText = answerText;
      
      this.obstacleCars.add(car);
    });
  }
  
  handleCollision(player, car) {
    const wasCorrect = car.correct;
    const carX = car.x;
    const carY = car.y;

    // Clear all existing obstacle cars immediately
    this.clearAllCars();
    
    // Car crash effect
    this.createCrashEffect(carX, carY);
    
    if (wasCorrect) {
      // Correct answer
      this.score += 10 * this.maxMult;
      this.scoreText.setText(`🏆 Score: ${this.score}`);
      
      // Clear positive success effect - green screen flash
      this.cameras.main.flash(300, 0, 255, 0, false);
      
      // Show big success feedback
      this.showSuccessFeedback();
      
      // Success particles
      this.createSuccessEffect();
    } else {
      // Wrong answer
      this.lives -= 1;
      this.livesText.setText(`❤️ Lives: ${this.lives}`);
      
      // Damage effect
      this.cameras.main.shake(200, 0.02);
      this.cameras.main.flash(200, 255, 0, 0);
      
      // Show wrong answer feedback
      this.showWrongFeedback();
      
      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
    }
    
    // Spawn next question after a short delay
    this.time.delayedCall(1000, () => {
      this.nextQuestion();
    });
  }
  
  createCrashEffect(x, y) {
    // Explosion particles
    const particles = this.add.particles(x, y, 'cone', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 100, max: 200 },
      lifespan: 500,
      quantity: 10,
      tint: 0xff6600
    });
    
    this.time.delayedCall(500, () => {
      particles.destroy();
    });
  }
  
  createSuccessEffect() {
    // Success particles - golden stars
    const particles = this.add.particles(this.player.x, this.player.y, 'cone', {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 1000,
      quantity: 20,
      tint: 0xffd700, // Golden color
      alpha: { start: 1, end: 0 }
    });
    
    this.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  showSuccessFeedback() {
    // Big green checkmark
    const checkmark = this.add.text(this.scale.width/2, this.scale.height/2 - 50, '✓', {
      fontSize: '120px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5).setDepth(200);
    
    // "CORRECT!" text
    const correctText = this.add.text(this.scale.width/2, this.scale.height/2 + 50, 'CORRECT!', {
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true
      }
    }).setOrigin(0.5).setDepth(200);
    
    // Animate checkmark - pop in effect
    checkmark.setScale(0);
    this.tweens.add({
      targets: checkmark,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: checkmark,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
    
    // Animate text - slide up
    correctText.setAlpha(0);
    correctText.y += 30;
    this.tweens.add({
      targets: correctText,
      y: correctText.y - 30,
      alpha: 1,
      duration: 400,
      ease: 'Power2'
    });
    
    // Remove after delay
    this.time.delayedCall(800, () => {
      checkmark.destroy();
      correctText.destroy();
    });
  }
  
  showWrongFeedback() {
    // Big red X
    const xmark = this.add.text(this.scale.width/2, this.scale.height/2 - 50, '✗', {
      fontSize: '120px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    }).setOrigin(0.5).setDepth(200);
    
    // "WRONG!" text
    const wrongText = this.add.text(this.scale.width/2, this.scale.height/2 + 50, 'WRONG!', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true
      }
    }).setOrigin(0.5).setDepth(200);
    
    // Animate X mark - shake effect
    xmark.setScale(0);
    this.tweens.add({
      targets: xmark,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: xmark,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
    
    // Animate text - slide up
    wrongText.setAlpha(0);
    wrongText.y += 30;
    this.tweens.add({
      targets: wrongText,
      y: wrongText.y - 30,
      alpha: 1,
      duration: 400,
      ease: 'Power2'
    });
    
    // Remove after delay
    this.time.delayedCall(800, () => {
      xmark.destroy();
      wrongText.destroy();
    });
  }
  
  showPauseMenu() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.physics.pause();
    
    // Pause menu selection
    this.pauseSelection = 0; // 0 = Resume, 1 = Main Menu
    
    // Create pause menu background with much higher depth
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0x000000, 0.8);
    pauseBg.fillRect(0, 0, this.scale.width, this.scale.height);
    pauseBg.setDepth(500); // Much higher depth to be above cars
    
    // Menu container
    const menuContainer = this.add.graphics();
    menuContainer.fillStyle(0x2c3e50, 0.9);
    menuContainer.fillRoundedRect(this.scale.width/2 - 200, this.scale.height/2 - 150, 400, 300, 20);
    menuContainer.lineStyle(3, 0xff6b35, 1);
    menuContainer.strokeRoundedRect(this.scale.width/2 - 200, this.scale.height/2 - 150, 400, 300, 20);
    menuContainer.setDepth(501);
    
    // Pause title
    const pauseTitle = this.add.text(this.scale.width/2, this.scale.height/2 - 80, 'GAME PAUSED', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(502);
    
    // Resume and Main Menu buttons - only show text on desktop (mobile uses direct buttons)
    let resumeText, mainMenuText;
    if (!this.inputManager.shouldUseMobileLayout()) {
      resumeText = this.add.text(this.scale.width/2, this.scale.height/2 - 20, 'Resume Game', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(502);
      
      mainMenuText = this.add.text(this.scale.width/2, this.scale.height/2 + 30, 'Main Menu', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(502);
    }
    
    // Instructions - only show on desktop (mobile buttons are self-explanatory)
    let instructionsText;
    if (!this.inputManager.shouldUseMobileLayout()) {
      const pauseInstructionText = 'Use ↑↓ to select, ENTER to confirm';
      
      instructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 90, pauseInstructionText, {
        fontSize: '18px',
        color: '#bdc3c7',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(502);
    }
    
    // Store pause menu elements for cleanup
    this.pauseMenu = {
      background: pauseBg,
      container: menuContainer,
      title: pauseTitle,
      resume: resumeText,
      mainMenu: mainMenuText,
      instructions: instructionsText
    };
    
    // Update selection highlight
    this.updatePauseSelection();
    
    // Setup pause menu controls
    this.setupPauseMenuControls();
  }
  
  setupPauseMenuControls() {
    if (this.inputManager.shouldUseMobileLayout()) {
      // Create mobile pause menu controls with direct buttons
      this.pauseMobileControls = new MobileControls(this);
      
      // Create direct Resume Game button
      this.pauseMobileControls.createSecondaryButton(
        'pause_resume',
        this.scale.width/2,
        this.scale.height/2 - 35, // Moved up for better spacing
        'Resume Game',
        () => {
          this.hidePauseMenu();
        }
      );
      
      // Create direct Main Menu button
      this.pauseMobileControls.createSecondaryButton(
        'pause_main_menu',
        this.scale.width/2,
        this.scale.height/2 + 35, // Moved down for better spacing
        'Main Menu',
        () => {
          this.scene.start('MenuScene');
        }
      );
    } else {
      // Desktop keyboard input handlers
      this.pauseUpHandler = this.input.keyboard.on('keydown-UP', () => {
        this.pauseSelection = Math.max(0, this.pauseSelection - 1);
        this.updatePauseSelection();
      });
      
      this.pauseDownHandler = this.input.keyboard.on('keydown-DOWN', () => {
        this.pauseSelection = Math.min(1, this.pauseSelection + 1);
        this.updatePauseSelection();
      });
      
      this.pauseEnterHandler = this.input.keyboard.on('keydown-ENTER', () => {
        if (this.pauseSelection === 0) {
          this.hidePauseMenu(); // Resume
        } else {
          this.scene.start('MenuScene'); // Main Menu
        }
      });
      
      this.pauseEscapeHandler = this.input.keyboard.on('keydown-ESC', () => {
        this.hidePauseMenu();
      });
    }
  }
  
  updatePauseSelection() {
    if (!this.pauseMenu || this.inputManager.shouldUseMobileLayout()) return;
    
    // Only update selection highlighting on desktop
    if (!this.pauseMenu.resume || !this.pauseMenu.mainMenu) return;
    
    // Reset both options to normal style - force clear all properties like main menu
    this.pauseMenu.resume.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    this.pauseMenu.mainMenu.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    // Highlight selected option with consistent styling like main menu
    if (this.pauseSelection === 0) {
      this.pauseMenu.resume.setStyle({
        fontSize: '34px',
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
    } else {
      this.pauseMenu.mainMenu.setStyle({
        fontSize: '34px',
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
  }
  
  hidePauseMenu() {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.physics.resume();
    
    // Remove pause menu elements
    if (this.pauseMenu) {
      Object.values(this.pauseMenu).forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      this.pauseMenu = null;
    }
    
    // Remove input handlers
    if (this.inputManager.shouldUseMobileLayout()) {
      // Clean up mobile pause controls
      if (this.pauseMobileControls) {
        this.pauseMobileControls.destroy();
        this.pauseMobileControls = null;
      }
    } else {
      // Clean up desktop keyboard handlers
      if (this.pauseEscapeHandler) {
        this.input.keyboard.off('keydown-ESC', this.pauseEscapeHandler);
        this.pauseEscapeHandler = null;
      }
      
      if (this.pauseEnterHandler) {
        this.input.keyboard.off('keydown-ENTER', this.pauseEnterHandler);
        this.pauseEnterHandler = null;
      }
      
      if (this.pauseUpHandler) {
        this.input.keyboard.off('keydown-UP', this.pauseUpHandler);
        this.pauseUpHandler = null;
      }
      
      if (this.pauseDownHandler) {
        this.input.keyboard.off('keydown-DOWN', this.pauseDownHandler);
        this.pauseDownHandler = null;
      }
    }
  }
  
  gameOver() {
    // Store game settings for potential race again
    this.registry.set('lastMaxMult', this.maxMult);
    this.registry.set('lastGameSpeed', this.selectedSpeed);
    
    // Check if this is a high score
    this.isNewHighScore = highScores.isHighScore(this.score, this.selectedSpeed);
    this.scoreRank = highScores.getRank(this.score, this.selectedSpeed);
    
    // Game over screen
    const gameOverBg = this.add.graphics();
    gameOverBg.fillStyle(0x000000, 0.8);
    gameOverBg.fillRect(0, 0, this.scale.width, this.scale.height);
    gameOverBg.setDepth(20);
    
    // Title
    this.add.text(this.scale.width/2, this.scale.height/2 - 150, 'RACE OVER!', {
      fontSize: '48px',
      color: '#e74c3c',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(21);
    
    // Score display
    this.add.text(this.scale.width/2, this.scale.height/2 - 100, `Final Score: ${this.score}`, {
      fontSize: '32px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);
    
    // High score notification
    if (this.isNewHighScore) {
      const highScoreText = this.scoreRank === 1 ? 'NEW HIGH SCORE!' : `NEW HIGH SCORE! (Rank #${this.scoreRank})`;
      this.add.text(this.scale.width/2, this.scale.height/2 - 60, highScoreText, {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#ffffff',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(21);
    }
    
    // Check if we need to ask for name (only for new high scores)
    if (this.isNewHighScore) {
      // Name input state for high scores
      this.gameOverState = 'name_input'; // 'name_input' or 'options'
      this.playerName = '';
      this.nameInputActive = true;
      
      // Only create desktop name input elements on desktop
      if (!this.inputManager.shouldUseMobileLayout()) {
        // Name input prompt
        this.namePromptText = this.add.text(this.scale.width/2, this.scale.height/2 - 10, 'Enter your name:', {
          fontSize: '24px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(21);
        
        // Name input field
        this.nameInputText = this.add.text(this.scale.width/2, this.scale.height/2 + 30, this.playerName + '_', {
          fontSize: '28px',
          color: '#3498db',
          fontStyle: 'bold',
          backgroundColor: '#2c3e50',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(21);
        
        // Instructions
        this.nameInstructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 80, 'Type your name and press ENTER', {
          fontSize: '18px',
          color: '#bdc3c7',
          fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(21);
      }
      
      // Set up name input for high scores
      this.setupNameInput();
    } else {
      // Not a high score - skip directly to game over options
      this.gameOverState = 'options';
      this.playerName = 'Anonymous'; // Default name for non-high scores
      this.showGameOverOptions();
    }
  }
  
  setupNameInput() {
    // Use mobile-friendly name input if on mobile, otherwise use keyboard input
    if (this.inputManager.shouldUseMobileLayout()) {
      this.setupMobileNameInput();
    } else {
      this.setupDesktopNameInput();
    }
  }
  
  setupMobileNameInput() {
    
    // Use mobile name input utility
    const nameInput = getMobileNameInput(this);
    
    nameInput.show('Enter your name:', '', (name) => {
      
      try {
        // Add small delay to ensure mobile input is fully closed
        setTimeout(() => {
          try {
            if (name !== null) {
              this.playerName = name;
              this.submitName();
            } else {
              // User cancelled, use Anonymous
              this.playerName = 'Anonymous';
              this.submitName();
            }
          } catch (error) {
            console.error('🔍 Phase 2: Error in timeout callback:', error);
            console.error('🔍 Phase 2: Error stack:', error.stack);
          }
        }, 100);
      } catch (error) {
        console.error('🔍 Phase 2: Error in main callback:', error);
        console.error('🔍 Phase 2: Error stack:', error.stack);
      }
    });
    
  }
  
  setupDesktopNameInput() {
    // Add keyboard input listeners for name entry
    this.input.keyboard.on('keydown', (event) => {
      if (this.gameOverState !== 'name_input') return;
      
      if (event.key === 'Enter') {
        this.submitName();
      } else if (event.key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1);
        this.updateNameDisplay();
      } else if (event.key.length === 1 && this.playerName.length < 15) {
        // Only allow alphanumeric characters and spaces
        if (/[a-zA-Z0-9 ]/.test(event.key)) {
          this.playerName += event.key;
          this.updateNameDisplay();
        }
      }
    });
  }
  
  updateNameDisplay() {
    if (this.nameInputText) {
      this.nameInputText.setText(this.playerName + '_');
    }
  }
  
  submitName() {
    
    if (this.playerName.trim().length === 0) {
      this.playerName = 'Anonymous';
    }
    
    // Add score to high scores
    highScores.addScore(this.playerName.trim(), this.score, this.selectedSpeed);
    
    // Remove name input elements (only if they exist - desktop only)
    if (this.namePromptText) {
      this.namePromptText.destroy();
      this.namePromptText = null;
    }
    if (this.nameInputText) {
      this.nameInputText.destroy();
      this.nameInputText = null;
    }
    if (this.nameInstructionsText) {
      this.nameInstructionsText.destroy();
      this.nameInstructionsText = null;
    }
    
    // Show options screen
    this.showGameOverOptions();
  }
  
  showGameOverOptions() {
    
    this.gameOverState = 'options';
    this.gameOverSelection = 0; // 0 = Race Again, 1 = Main Menu
    
    // Options prompt
    this.optionsPromptText = this.add.text(this.scale.width/2, this.scale.height/2 - 10, 'What would you like to do?', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);
    
    // Race again and Main menu buttons - only show text on desktop (mobile uses direct buttons)
    if (!this.inputManager.shouldUseMobileLayout()) {
      this.raceAgainText = this.add.text(this.scale.width/2, this.scale.height/2 + 30, 'Race Again', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(21);
      
      this.mainMenuText = this.add.text(this.scale.width/2, this.scale.height/2 + 80, 'Main Menu', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(21);
    }
    
    // Instructions - only show on desktop (mobile buttons are self-explanatory)
    if (!this.inputManager.shouldUseMobileLayout()) {
      const gameOverInstructionText = 'Use ↑↓ to select, ENTER to confirm';
      
      this.optionsInstructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 130, gameOverInstructionText, {
        fontSize: '18px',
        color: '#bdc3c7',
        fontStyle: 'italic'
      }).setOrigin(0.5).setDepth(21);
    }
    
    // Create high scores table for the played speed
    // Position table lower on mobile to avoid overlap with buttons
    const tableY = this.inputManager.shouldUseMobileLayout() 
      ? this.scale.height/2 + 160  // Lower position for mobile
      : this.scale.height/2 + 180; // Original position for desktop
      
    this.gameOverHighScoresTable = createHighScoresTable(this, this.scale.width/2, tableY, this.selectedSpeed, `High Scores - ${highScores.getSpeedName(this.selectedSpeed)}`);
    
    // Set depth for all table elements
    this.gameOverHighScoresTable.elements.forEach(element => {
      element.setDepth(21);
    });
    
    // Update selection highlight
    this.updateGameOverSelection();
    
    // Set up options input
    this.setupOptionsInput();
  }
  
  updateGameOverSelection() {
    // Only update selection highlighting on desktop
    if (this.inputManager.shouldUseMobileLayout()) return;
    if (!this.raceAgainText || !this.mainMenuText) return;
    
    // Reset both options to normal style
    this.raceAgainText.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    this.mainMenuText.setStyle({
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '',
      padding: { x: 0, y: 0 },
      stroke: '',
      strokeThickness: 0,
      shadow: { offsetX: 0, offsetY: 0, color: '', blur: 0, fill: false }
    });
    
    // Highlight selected option
    if (this.gameOverSelection === 0) {
      this.raceAgainText.setStyle({
        fontSize: '34px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#27ae60',
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
    } else {
      this.mainMenuText.setStyle({
        fontSize: '34px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#e74c3c',
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
  }
  
  setupOptionsInput() {
    
    if (this.inputManager.shouldUseMobileLayout()) {
      
      // Destroy any existing mobile controls first
      if (this.gameOverMobileControls) {
        this.gameOverMobileControls.destroy();
      }
      
      // Create mobile game over controls with direct buttons
      this.gameOverMobileControls = new MobileControls(this);
      
      // Calculate safe button positions
      const safeAreaBottom = this.inputManager.shouldUseMobileLayout() ? 
        Math.max(20, parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0')) : 0;
      const buttonY1 = Math.min(this.scale.height/2 + 40, this.scale.height - 200 - safeAreaBottom); // Race Again
      const buttonY2 = Math.min(this.scale.height/2 + 100, this.scale.height - 140 - safeAreaBottom); // Main Menu
      
      // Create direct Race Again button - positioned to avoid high scores table
      const raceAgainButton = this.gameOverMobileControls.createPrimaryButton(
        'gameover_race_again',
        this.scale.width/2,
        buttonY1,
        'Race Again',
        () => {
          // Race Again - start new game with same settings
          this.registry.set('maxMult', this.registry.get('lastMaxMult'));
          this.registry.set('gameSpeed', this.registry.get('lastGameSpeed'));
          this.scene.start('GameScene');
        }
      );
      
      // Create direct Main Menu button
      const mainMenuButton = this.gameOverMobileControls.createSecondaryButton(
        'gameover_main_menu',
        this.scale.width/2,
        buttonY2,
        'Main Menu',
        () => {
          this.scene.start('MenuScene');
        }
      );
      
      // Fallback: If MobileControls didn't create buttons properly, create them manually
      if (!this.gameOverMobileControls.buttons || Object.keys(this.gameOverMobileControls.buttons).length === 0) {
        this.createFallbackMobileButtons(buttonY1, buttonY2);
      } else {
        
        // Ensure mobile controls have proper depth and visibility
        Object.values(this.gameOverMobileControls.buttons).forEach((button, index) => {
          
          if (button.background) {
            button.background.setDepth(25); // Higher than game over elements
            button.background.setVisible(true);
          }
          if (button.text) {
            button.text.setDepth(25);
            button.text.setVisible(true);
          }
          if (button.hitArea) {
            button.hitArea.setDepth(25);
            button.hitArea.setVisible(true);
          }
        });
        
        // Ensure UI container is visible and has proper depth
        if (this.gameOverMobileControls.uiContainer) {
          this.gameOverMobileControls.uiContainer.setDepth(25);
          this.gameOverMobileControls.uiContainer.setVisible(true);
        }
      }
      
    } else {
      // Desktop keyboard input
      // Remove previous keyboard listeners
      this.input.keyboard.removeAllListeners('keydown');
      
      // Add new listeners for options navigation
      this.input.keyboard.on('keydown', (event) => {
        if (this.gameOverState !== 'options') return;
        
        if (event.key === 'ArrowUp') {
          this.gameOverSelection = Math.max(0, this.gameOverSelection - 1);
          this.updateGameOverSelection();
        } else if (event.key === 'ArrowDown') {
          this.gameOverSelection = Math.min(1, this.gameOverSelection + 1);
          this.updateGameOverSelection();
        } else if (event.key === 'Enter') {
          if (this.gameOverSelection === 0) {
            // Race Again - start new game with same settings
            this.registry.set('maxMult', this.registry.get('lastMaxMult'));
            this.registry.set('gameSpeed', this.registry.get('lastGameSpeed'));
            this.scene.start('GameScene');
          } else {
            // Main Menu
            this.scene.start('MenuScene');
          }
        }
      });
    }
  }
  
  createFallbackMobileButtons(buttonY1, buttonY2) {
    
    // Create Race Again button manually
    const raceAgainBg = this.add.graphics();
    raceAgainBg.fillStyle(0xff6b35, 0.9);
    raceAgainBg.fillRoundedRect(
      this.scale.width/2 - 90, buttonY1 - 25, 
      180, 50, 10
    );
    raceAgainBg.lineStyle(4, 0x2c3e50, 1);
    raceAgainBg.strokeRoundedRect(
      this.scale.width/2 - 90, buttonY1 - 25, 
      180, 50, 10
    );
    raceAgainBg.setDepth(25);
    
    const raceAgainText = this.add.text(this.scale.width/2, buttonY1, 'Race Again', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25);
    
    const raceAgainHitArea = this.add.rectangle(this.scale.width/2, buttonY1, 180, 50, 0x000000, 0);
    raceAgainHitArea.setInteractive();
    raceAgainHitArea.setDepth(25);
    raceAgainHitArea.on('pointerdown', () => {
      this.registry.set('maxMult', this.registry.get('lastMaxMult'));
      this.registry.set('gameSpeed', this.registry.get('lastGameSpeed'));
      this.scene.start('GameScene');
    });
    
    // Create Main Menu button manually
    const mainMenuBg = this.add.graphics();
    mainMenuBg.fillStyle(0x2c3e50, 0.8);
    mainMenuBg.fillRoundedRect(
      this.scale.width/2 - 75, buttonY2 - 20, 
      150, 40, 10
    );
    mainMenuBg.lineStyle(3, 0xff6b35, 1);
    mainMenuBg.strokeRoundedRect(
      this.scale.width/2 - 75, buttonY2 - 20, 
      150, 40, 10
    );
    mainMenuBg.setDepth(25);
    
    const mainMenuText = this.add.text(this.scale.width/2, buttonY2, 'Main Menu', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(25);
    
    const mainMenuHitArea = this.add.rectangle(this.scale.width/2, buttonY2, 150, 40, 0x000000, 0);
    mainMenuHitArea.setInteractive();
    mainMenuHitArea.setDepth(25);
    mainMenuHitArea.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    
    // Store references for cleanup
    this.fallbackButtons = [
      raceAgainBg, raceAgainText, raceAgainHitArea,
      mainMenuBg, mainMenuText, mainMenuHitArea
    ];
    
  }
  
  update() {
    const startTime = performance.now();
    
    // Update input manager
    this.inputManager.update();
    
    // Update mobile controls if present
    if (this.mobileControls) {
      this.mobileControls.update();
    }
    
    // Handle escape key for pause menu
    if (this.inputManager.isEscapeJustPressed() && !this.isPaused) {
      this.showPauseMenu();
      return;
    }
    
    // Skip update if paused
    if (this.isPaused) {
      return;
    }
    
    const bgStartTime = performance.now();
    // Animate road background - move downward to simulate car moving forward (reduced frequency)
    const bgSpeed = this.gameSpeed / 15; // Reduced from /10 to /15 for better performance
    this.roadBg.tilePositionY -= bgSpeed;
    this.grassBg.tilePositionY -= bgSpeed;
    
    // Animate barriers and lane lines - also move downward (reduced frequency)
    if (this.leftBarrier) this.leftBarrier.tilePositionY -= bgSpeed;
    if (this.rightBarrier) this.rightBarrier.tilePositionY -= bgSpeed;
    if (this.laneLine1) this.laneLine1.tilePositionY -= bgSpeed * 0.8;
    if (this.laneLine2) this.laneLine2.tilePositionY -= bgSpeed * 0.8;
    const bgEndTime = performance.now();
    
    const carStartTime = performance.now();
    // Update obstacle car positions (optimized)
    this.obstacleCars.children.entries.forEach((car, index) => {
      // Manually move car down the screen
      car.y += this.gameSpeed / 20;
      
      // Update text position (only if text exists)
      if (car.answerText) {
        car.answerText.x = car.x;
        car.answerText.y = car.y;
      }
      
      // Check if car is off screen and spawn new question
      if (car.y > this.scale.height + 100) {
        this.clearAllCars();
        this.time.delayedCall(500, () => {
          this.nextQuestion();
        });
        return;
      }
    });
    const carEndTime = performance.now();
    
    const inputStartTime = performance.now();
    // Player lane switching
    if (this.inputManager.isLeftJustPressed() && this.currentLane > 0) {
      this.currentLane--;
      this.tweens.add({
        targets: this.player,
        x: this.lanes[this.currentLane],
        duration: 200,
        ease: 'Power2'
      });
    }
    if (this.inputManager.isRightJustPressed() && this.currentLane < 2) {
      this.currentLane++;
      this.tweens.add({
        targets: this.player,
        x: this.lanes[this.currentLane],
        duration: 200,
        ease: 'Power2'
      });
    }
    const inputEndTime = performance.now();
    
    const totalTime = performance.now() - startTime;
    
    // Log performance data occasionally (every 60 frames ~ 1 second) - only in debug mode
    if (DEBUG_MODE && Math.random() < 0.016) { // ~1/60 chance per frame
      console.log('Performance Profile:');
      console.log(`  Total update time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Background animation: ${(bgEndTime - bgStartTime).toFixed(2)}ms`);
      console.log(`  Car updates: ${(carEndTime - carStartTime).toFixed(2)}ms`);
      console.log(`  Input handling: ${(inputEndTime - inputStartTime).toFixed(2)}ms`);
      console.log(`  Cars count: ${this.obstacleCars.children.entries.length}`);
    }
  }
} 

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.GameScene = GameScene;
}

if (typeof module !== 'undefined' && module.exports) {
    const { InputManager } = require('../utils/InputManager.js');
    const MobileControls = require('../utils/MobileControls.js');
    const DeviceDetector = require('../utils/DeviceDetector.js');
    const { getMobileNameInput } = require('../utils/MobileNameInput.js');
    const { highScores } = require('../highScores.js');
    module.exports = GameScene;
} 