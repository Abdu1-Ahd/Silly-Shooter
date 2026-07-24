/**
 * Overlays Manager for Silly Shooter / Circle Survivor
 * Manages Start Screen, Pause Screen (ESC menu), and Game Over modals.
 */
export class OverlaysManager {
  constructor() {
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');

    this.startButton = document.getElementById('start-button');
    this.resumeButton = document.getElementById('resume-button');
    this.restartButton = document.getElementById('restart-button');
    this.retryButton = document.getElementById('retry-button');

    this.finalScoreEl = document.getElementById('final-score');
    this.finalTimeEl = document.getElementById('final-time');
    this.topScoreDisplay = document.getElementById('top-score-display');
  }

  bindEvents({ onStart, onResume, onRestart }) {
    if (this.startButton) this.startButton.addEventListener('click', onStart);
    if (this.resumeButton) this.resumeButton.addEventListener('click', onResume);
    if (this.restartButton) this.restartButton.addEventListener('click', onRestart);
    if (this.retryButton) this.retryButton.addEventListener('click', onStart);
  }

  showStartScreen(topScore) {
    if (this.topScoreDisplay) this.topScoreDisplay.textContent = topScore;
    if (this.startOverlay) this.startOverlay.hidden = false;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = true;
  }

  showPauseScreen() {
    if (this.pauseOverlay) this.pauseOverlay.hidden = false;
  }

  hidePauseScreen() {
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
  }

  showGameOver(score, timeFormatted, topScore) {
    if (this.finalScoreEl) this.finalScoreEl.textContent = score;
    if (this.finalTimeEl) this.finalTimeEl.textContent = timeFormatted;
    if (this.topScoreDisplay) this.topScoreDisplay.textContent = topScore;

    if (this.startOverlay) this.startOverlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = false;
  }

  hideAll() {
    if (this.startOverlay) this.startOverlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = true;
  }
}

export const overlays = new OverlaysManager();
