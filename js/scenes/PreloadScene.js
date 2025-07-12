// Preload assets
class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }
  
  preload() {
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
    
    // Loading screen
    this.add.text(this.scale.width/2, this.scale.height/2, 'Loading Racing Assets...', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.scale.width/2 - 160, this.scale.height/2 + 50, 320, 50);
    
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(this.scale.width/2 - 150, this.scale.height/2 + 60, 300 * value, 30);
    });
  }
  
  create() {
    this.scene.start('MenuScene');
  }
} 