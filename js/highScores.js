// Debug mode flag - set to true to enable FPS display and performance logging
const DEBUG_MODE = false;

// Make DEBUG_MODE available globally for browser
if (typeof window !== 'undefined') {
  window.DEBUG_MODE = DEBUG_MODE;
}

// High Scores Management System
class HighScores {
  constructor() {
    this.storageKey = 'mathRacingHighScores';
    this.speedNames = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
    this.loadScores();
  }
  
  loadScores() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.scores = JSON.parse(saved);
    } else {
      // Initialize empty scores for each speed
      this.scores = {
        0: [], // Very Slow
        1: [], // Slow
        2: [], // Normal  
        3: [], // Fast
        4: []  // Very Fast
      };
    }
  }
  
  saveScores() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
  }
  
  addScore(name, score, speed) {
    if (!this.scores[speed]) {
      this.scores[speed] = [];
    }
    
    this.scores[speed].push({
      name: name,
      score: score,
      date: new Date().toLocaleDateString()
    });
    
    // Sort by score (highest first) and keep only top 5
    this.scores[speed].sort((a, b) => b.score - a.score);
    this.scores[speed] = this.scores[speed].slice(0, 5);
    
    this.saveScores();
  }
  
  getScores(speed) {
    return this.scores[speed] || [];
  }
  
  isHighScore(score, speed) {
    const speedScores = this.getScores(speed);
    
    // Debug logging only in debug mode
    if (DEBUG_MODE) {
      console.log('isHighScore check:', {
        score: score,
        speed: speed,
        speedScores: speedScores,
        length: speedScores.length,
        lowestScore: speedScores.length > 0 ? speedScores[speedScores.length - 1].score : 'none'
      });
    }
    
    // Only scores > 0 can be high scores
    if (score <= 0) {
      return false;
    }
    
    // If there are no existing scores, require a minimum score to be considered "high"
    if (speedScores.length === 0) {
      const minimumHighScore = 50; // Require at least 50 points to be a "high score"
      return score >= minimumHighScore;
    }
    
    // If there are fewer than 5 scores, any score that beats the minimum qualifies
    if (speedScores.length < 5) {
      const minimumHighScore = 50;
      return score >= minimumHighScore;
    }
    
    // If there are 5 scores, check if this score is higher than the lowest one
    return score > speedScores[speedScores.length - 1].score;
  }
  
  getRank(score, speed) {
    const speedScores = this.getScores(speed);
    let rank = 1;
    for (let i = 0; i < speedScores.length; i++) {
      if (score > speedScores[i].score) {
        return rank;
      }
      rank++;
    }
    return rank;
  }
  
  getSpeedName(speed) {
    return this.speedNames[speed] || 'Unknown';
  }
}

// Global high scores instance
const highScores = new HighScores();

// High Scores Display Component
function createHighScoresTable(scene, x, y, speed, title = null) {
  const container = [];
  const scores = highScores.getScores(speed);
  const speedName = highScores.getSpeedName(speed);
  
  // Title
  const titleText = title || `High Scores - ${speedName}`;
  const titleElement = scene.add.text(x, y, titleText, {
    fontSize: '24px',
    color: '#f1c40f',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5);
  container.push(titleElement);
  
  // Table header
  const headerY = y + 40;
  const headerElement = scene.add.text(x, headerY, 'Rank    Name              Score     Date', {
    fontSize: '16px',
    color: '#ffffff',
    fontStyle: 'bold',
    fontFamily: 'monospace'
  }).setOrigin(0.5);
  container.push(headerElement);
  
  // Separator line
  const separatorY = headerY + 25;
  const separatorElement = scene.add.text(x, separatorY, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', {
    fontSize: '14px',
    color: '#bdc3c7'
  }).setOrigin(0.5);
  container.push(separatorElement);
  
  // Score entries
  if (scores.length === 0) {
    const noScoresElement = scene.add.text(x, separatorY + 40, 'No scores yet!', {
      fontSize: '18px',
      color: '#95a5a6',
      fontStyle: 'italic'
    }).setOrigin(0.5);
    container.push(noScoresElement);
  } else {
    scores.forEach((scoreEntry, index) => {
      const entryY = separatorY + 30 + (index * 25);
      const rank = index + 1;
      const name = scoreEntry.name.length > 12 ? scoreEntry.name.substring(0, 12) + '...' : scoreEntry.name;
      const scoreText = scoreEntry.score.toString().padStart(6, ' ');
      const date = scoreEntry.date;
      
      const entryText = `${rank}.      ${name.padEnd(15)} ${scoreText}    ${date}`;
      
      // Color coding for ranks
      let color = '#ffffff';
      if (rank === 1) color = '#f1c40f'; // Gold
      else if (rank === 2) color = '#c0392b'; // Silver-ish
      else if (rank === 3) color = '#e67e22'; // Bronze-ish
      
      const entryElement = scene.add.text(x, entryY, entryText, {
        fontSize: '14px',
        color: color,
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      container.push(entryElement);
    });
  }
  
  return {
    elements: container,
    destroy: () => {
      container.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
    }
  };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
  window.HighScores = HighScores;
  window.highScores = highScores;
  window.createHighScoresTable = createHighScoresTable;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    highScores,
    createHighScoresTable,
    HighScores
  };
} 