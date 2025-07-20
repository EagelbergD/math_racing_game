// Preload assets
class PreloadScene extends Phaser.Scene {
  constructor() { 
    super('PreloadScene');
    console.log('🎮 PreloadScene constructor called');
  }
  
  preload() {
    console.log('🎮 PreloadScene preload started');
    
    // Add loading progress bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const loadingText = this.make.text({
      x: this.scale.width / 2,
      y: this.scale.height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Progress events
    this.load.on('progress', (value) => {
      console.log('Loading progress: ' + Math.round(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      console.log('✅ All assets loaded successfully');
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    this.load.on('loaderror', (file) => {
      console.error('❌ Failed to load asset:', file.key, file.src);
    });
    
    // Car sprites
    this.load.image('playerCar', 'assets/racing/PNG/Cars/car_blue_1.png');
    this.load.image('enemyCar1', 'assets/racing/PNG/Cars/car_red_1.png');
    this.load.image('enemyCar2', 'assets/racing/PNG/Cars/car_yellow_1.png');
    this.load.image('enemyCar3', 'assets/racing/PNG/Cars/car_green_1.png');
    
    // Road tiles - using proper asphalt tiles
    this.load.image('roadTile', 'assets/racing/PNG/Tiles/Asphalt road/road_asphalt22.png'); // Clean asphalt
    this.load.image('leftBarrierTile', 'assets/racing/PNG/Tiles/Asphalt road/road_asphalt21.png'); // Red/white left
    this.load.image('rightBarrierTile', 'assets/racing/PNG/Tiles/Asphalt road/road_asphalt23.png'); // Red/white right
    this.load.image('grassTile', 'assets/racing/PNG/Tiles/Grass/land_grass04.png');
    
    // White arrows for lane dividers
    this.load.image('laneArrow', 'assets/racing/PNG/Objects/arrow_white.png');
    
    // Static racing background for menu
    this.load.image('racingBg', 'assets/racing/Sample.png');
    
    // Objects for decoration
    this.load.image('tree', 'assets/racing/PNG/Objects/tree_small.png');
    this.load.image('cone', 'assets/racing/PNG/Objects/cone_straight.png');
    this.load.image('barrier', 'assets/racing/PNG/Objects/barrier_red.png');
    
    // UI elements
    this.load.image('speedometer', 'assets/racing/PNG/Objects/lights.png');
    
    // Progress bar
    this.load.image('progressBarBg', 'assets/racing/PNG/Objects/barrier_white.png');
    this.load.image('progressBarFill', 'assets/racing/PNG/Objects/barrier_red.png');
    
    // Loading message
    this.add.text(this.scale.width/2, this.scale.height/2 + 100, 'Loading Math Racing Quest...', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    console.log('🎮 PreloadScene preload setup complete');
  }
  
  create() {
    console.log('🎮 PreloadScene create called - transitioning to MenuScene');
    this.scene.start('MenuScene');
  }
}

// Make available globally for browser and export for Node.js testing
if (typeof window !== 'undefined') {
  window.PreloadScene = PreloadScene;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreloadScene;
}