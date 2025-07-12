// Game configuration
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: DEBUG_MODE
    }
  },
  scene: [PreloadScene, MenuScene, GameScene],
  // Add FPS monitoring
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

const game = new Phaser.Game(config);

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