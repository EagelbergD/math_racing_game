// Add error handling and debugging
console.log('🎮 Starting game initialization...');

// Wait for all scripts to load, then check components
function checkComponents() {
  const requiredComponents = ['DEBUG_MODE', 'PreloadScene', 'MenuScene', 'GameScene'];
  console.log('🔍 Checking components...');
  console.log('🔍 Current window object keys containing "Scene" or "DEBUG":', 
    Object.keys(window).filter(k => k.includes('Scene') || k.includes('DEBUG') || k.includes('scene')));
  
  let allAvailable = true;
  for (const component of requiredComponents) {
    const value = window[component];
    const type = typeof value;
    if (typeof value === 'undefined') {
      console.error(`❌ Missing component: ${component}`);
      console.error(`   Type: ${type}`);
      console.error(`   Expected: function (for scenes) or boolean (for DEBUG_MODE)`);
      allAvailable = false;
    } else {
      console.log(`✅ Component available: ${component} (${type})`);
      if (typeof value === 'function') {
        console.log(`   Constructor name: ${value.name}`);
      } else {
        console.log(`   Value: ${value}`);
      }
    }
  }
  
  if (allAvailable) {
    console.log('✅ All components available, initializing game...');
    initializeGame();
  } else {
    console.error('❌ Cannot start game - missing required components');
    console.error('❌ Try hard refreshing the page (Ctrl+F5 or Cmd+Shift+R)');
    
    // Display error to user
    document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        text-align: center;
        z-index: 10000;
        max-width: 400px;
      ">
        <h2>Game Loading Error</h2>
        <p>Some game components failed to load.</p>
        <p>Please try hard refreshing the page:</p>
        <p><strong>Ctrl+F5</strong> (Windows/Linux) or <strong>Cmd+Shift+R</strong> (Mac)</p>
        <p>Check the browser console for details.</p>
      </div>
    `;
  }
}

// Initialize the game
function initializeGame() {

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800, // Base game width
  height: 600, // Base game height
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: DEBUG_MODE || false
    }
  },
  scene: [PreloadScene, MenuScene, GameScene],
  // Add FPS monitoring
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  // Improved mobile-friendly scale configuration
  scale: {
    mode: Phaser.Scale.FIT, // Use FIT instead of RESIZE for better mobile scaling
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Set responsive dimensions based on device
    width: window.innerWidth > window.innerHeight ? 800 : 540, // Landscape : Portrait base width
    height: window.innerWidth > window.innerHeight ? 600 : 960, // Landscape : Portrait base height
    // Minimum and maximum sizes
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1920,
      height: 1200
    }
  },
  // Input configuration for mobile
  input: {
    activePointers: 3, // Support multi-touch
    smoothFactor: 0.2 // Smooth touch input
  }
};

console.log('🎮 Creating Phaser game with config:', config);

try {
  const game = new Phaser.Game(config);
  console.log('✅ Phaser game created successfully!');
  
  // Add event listeners to track game lifecycle
  game.events.on('ready', () => {
    console.log('🎮 Game ready event fired');
  });
  
  game.events.on('step', () => {
    if (!window.gameStepLogged) {
      console.log('🎮 Game step event fired - game is running');
      window.gameStepLogged = true;
    }
  });
  
} catch (error) {
  console.error('❌ Error creating Phaser game:', error);
  console.error('Stack trace:', error.stack);
  
  // Display error to user
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #e74c3c;
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      text-align: center;
      z-index: 10000;
      max-width: 400px;
    ">
      <h2>Phaser Game Error</h2>
      <p>Error: ${error.message}</p>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}

// Handle window resize and orientation changes
window.addEventListener('resize', () => {
  // Update device detector with new dimensions
  if (typeof deviceDetector !== 'undefined') {
    deviceDetector.screenSize = deviceDetector.getScreenSize();
    deviceDetector.orientation = deviceDetector.getOrientation();
  }
  
  // Update game scale for new dimensions
  const isPortrait = window.innerHeight > window.innerWidth;
  const newWidth = isPortrait ? 540 : 800;
  const newHeight = isPortrait ? 960 : 600;
  
  game.scale.setGameSize(newWidth, newHeight);
  game.scale.refresh();
});

// Handle orientation change specifically
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    // Update device detector
    if (typeof deviceDetector !== 'undefined') {
      deviceDetector.screenSize = deviceDetector.getScreenSize();
      deviceDetector.orientation = deviceDetector.getOrientation();
    }
    
    // Update game scale for new orientation
    const isPortrait = window.innerHeight > window.innerWidth;
    const newWidth = isPortrait ? 540 : 800;
    const newHeight = isPortrait ? 960 : 600;
    
    game.scale.setGameSize(newWidth, newHeight);
    game.scale.refresh();
    
    // Notify scenes about orientation change
    if (game.scene.getScenes) {
      game.scene.getScenes().forEach(scene => {
        if (scene.handleOrientationChange) {
          scene.handleOrientationChange();
        }
      });
    }
  }, 100); // Small delay to ensure orientation change is complete
});

// Add performance monitoring
let frameCount = 0;
let lastTime = performance.now();
let fpsDisplay;

// Create FPS counter - only in debug mode
function updateFPS() {
  if (!DEBUG_MODE) return;
  
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    
    if (!fpsDisplay) {
      fpsDisplay = document.createElement('div');
      fpsDisplay.style.position = 'fixed';
      fpsDisplay.style.top = '10px';
      fpsDisplay.style.right = '10px';
      fpsDisplay.style.color = 'white';
      fpsDisplay.style.fontFamily = 'Arial';
      fpsDisplay.style.fontSize = '16px';
      fpsDisplay.style.fontWeight = 'bold';
      fpsDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
      fpsDisplay.style.padding = '5px 10px';
      fpsDisplay.style.borderRadius = '5px';
      fpsDisplay.style.zIndex = '10000';
      document.body.appendChild(fpsDisplay);
    }
    
    fpsDisplay.textContent = `FPS: ${fps}`;
    
    // Color code the FPS display
    if (fps >= 55) {
      fpsDisplay.style.color = '#00ff00'; // Green for good FPS
    } else if (fps >= 30) {
      fpsDisplay.style.color = '#ffff00'; // Yellow for medium FPS
    } else {
      fpsDisplay.style.color = '#ff0000'; // Red for poor FPS
    }
    
    frameCount = 0;
    lastTime = currentTime;
  }
  
  if (DEBUG_MODE) {
    requestAnimationFrame(updateFPS);
  }
}

// Start FPS monitoring only in debug mode
if (DEBUG_MODE) {
  updateFPS();
}
}

// Wait for all scripts to load, then check components and start game
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure all scripts have finished executing
  setTimeout(checkComponents, 100);
}); 