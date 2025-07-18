// Enhanced Game Scene with racing theme
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  
  create() {
    this.maxMult = this.registry.get('maxMult') || 10;
    this.selectedSpeed = this.registry.get('gameSpeed') || 2;
    this.lives = 3;
    this.score = 0;
    this.speed = 150;
    
    // Set game speed based on selection: 1=Slow(150), 2=Normal(200), 3=Fast(250)
    const speedMap = { 1: 25, 2: 50, 3: 100 };
    this.gameSpeed = speedMap[this.selectedSpeed];
    
    // Current lane (will be positioned correctly after road creation)
    this.currentLane = 1;
    
    // Create scrolling road background (this will set up lanes)
    this.createRoadBackground();
    
    // Player car (positioned after road background creation)
    this.player = this.physics.add.sprite(this.lanes[this.currentLane], this.scale.height - 100, 'playerCar');
    this.player.setScale(1.2);
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
    
    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    
    // Pause menu state
    this.isPaused = false;
    this.pauseMenu = null;
    
    // Start first question
    this.nextQuestion();
  }
  
  createRoadBackground() {
    // Create grass background on sides (use a cleaner grass tile)
    this.grassBg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'grassTile');
    this.grassBg.setOrigin(0, 0);
    this.grassBg.setDepth(-3);
    
    // Create road in the center (fixed width for consistent lane positioning)
    const roadWidth = Math.min(600, this.scale.width * 0.5); // Max 600px wide or 50% of screen
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
    // UI Background panel
    const uiPanel = this.add.graphics();
    uiPanel.fillStyle(0x2c3e50, 0.9);
    uiPanel.fillRoundedRect(10, 10, this.scale.width - 20, 120, 10);
    uiPanel.lineStyle(2, 0xff6b35, 1);
    uiPanel.strokeRoundedRect(10, 10, this.scale.width - 20, 120, 10);
    uiPanel.setDepth(10);
    
    // Question text with enhanced styling
    this.questionText = this.add.text(this.scale.width/2, 50, '', {
      fontSize: '36px',
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
    
    // Lives display with heart-like styling
    this.livesText = this.add.text(30, 90, `❤️ Lives: ${this.lives}`, {
      fontSize: '24px',
      color: '#e74c3c',
      fontStyle: 'bold'
    }).setDepth(11);
    
    // Score display with trophy styling
    this.scoreText = this.add.text(30, 30, `🏆 Score: ${this.score}`, {
      fontSize: '24px',
      color: '#f1c40f',
      fontStyle: 'bold'
    }).setDepth(11);
    
    // Speed display
    this.speedText = this.add.text(this.scale.width - 30, 30, `⚡ Speed: ${this.gameSpeed}`, {
      fontSize: '20px',
      color: '#3498db',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11);
    
    // Level indicator
    this.levelText = this.add.text(this.scale.width - 30, 60, `🎯 Max: ${this.maxMult}`, {
      fontSize: '18px',
      color: '#9b59b6',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(11);
    
    // Instructions text
    this.instructionsText = this.add.text(this.scale.width - 30, 90, 'Use ← → to change lanes', {
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
  
  spawnDecoration() {
    const side = Phaser.Math.RND.pick(['left', 'right']);
    const x = side === 'left' ? 50 : this.scale.width - 50;
    const decoration = this.add.image(x, -50, Phaser.Math.RND.pick(['tree', 'cone', 'barrier']));
    decoration.setScale(0.8);
    
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
      
      // Create obstacle car (using regular sprite, not physics)
      const car = this.add.sprite(x, y, carSprites[idx]);
      car.setScale(1.1);
      car.correct = (answer === this.correct);
      car.setDepth(50); // Much higher depth to ensure visibility
      
      // Determine background color based on car sprite
      let bgColor = '#666666'; // Default gray
      if (carSprites[idx] === 'enemyCar1') bgColor = '#8B0000'; // Dark red for red car
      else if (carSprites[idx] === 'enemyCar2') bgColor = '#B8860B'; // Dark yellow for yellow car  
      else if (carSprites[idx] === 'enemyCar3') bgColor = '#006400'; // Dark green for green car
      
      const answerText = this.add.text(x, y, `${answer}`, {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: bgColor,
        padding: { x: 12, y: 8 },
        stroke: '#000000',
        strokeThickness: 4
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
    
    // Resume button - start with consistent white styling like main menu
    const resumeText = this.add.text(this.scale.width/2, this.scale.height/2 - 20, 'Resume Game', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(502);
    
    // Main menu button - start with consistent white styling like main menu
    const mainMenuText = this.add.text(this.scale.width/2, this.scale.height/2 + 30, 'Main Menu', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(502);
    
    // Instructions
    const instructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 90, 'Use ↑↓ to select, ENTER to confirm', {
      fontSize: '18px',
      color: '#bdc3c7',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(502);
    
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
    
    // Add input handlers
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
  
  updatePauseSelection() {
    if (!this.pauseMenu) return;
    
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
    
    // Name input state
    this.gameOverState = 'name_input'; // 'name_input' or 'options'
    this.playerName = '';
    this.nameInputActive = true;
    
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
    
    // Set up name input
    this.setupNameInput();
  }
  
  setupNameInput() {
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
    
    // Remove name input elements
    this.namePromptText.destroy();
    this.nameInputText.destroy();
    this.nameInstructionsText.destroy();
    
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
    
    // Race again button
    this.raceAgainText = this.add.text(this.scale.width/2, this.scale.height/2 + 30, 'Race Again', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);
    
    // Main menu button
    this.mainMenuText = this.add.text(this.scale.width/2, this.scale.height/2 + 80, 'Main Menu', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);
    
    // Instructions
    this.optionsInstructionsText = this.add.text(this.scale.width/2, this.scale.height/2 + 130, 'Use ↑↓ to select, ENTER to confirm', {
      fontSize: '18px',
      color: '#bdc3c7',
      fontStyle: 'italic'
    }).setOrigin(0.5).setDepth(21);
    
    // Create high scores table for the played speed
    const tableY = this.scale.height/2 + 180;
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
  
  update() {
    const startTime = performance.now();
    
    // Handle escape key for pause menu
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey) && !this.isPaused) {
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
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) && this.currentLane > 0) {
      this.currentLane--;
      this.tweens.add({
        targets: this.player,
        x: this.lanes[this.currentLane],
        duration: 200,
        ease: 'Power2'
      });
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) && this.currentLane < 2) {
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