/**
 * Overlays Manager for Silly Shooter
 * Manages Start Screen, Pause Screen (ESC menu), Settings Modal, and Game Over overlays.
 */
export class OverlaysManager {
  constructor() {
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.settingsOverlay = document.getElementById('settings-overlay');

    this.startButton = document.getElementById('start-button');
    this.resumeButton = document.getElementById('resume-button');
    this.restartButton = document.getElementById('restart-button');
    this.retryButton = document.getElementById('retry-button');
    this.homeButton = document.getElementById('home-button');

    this.startSettingsBtn = document.getElementById('start-settings-btn');
    this.pauseSettingsBtn = document.getElementById('pause-settings-btn');
    this.settingsBackBtn = document.getElementById('settings-back-btn');
    this.sfxToggleBtn = document.getElementById('sfx-toggle-btn');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');

    this.finalScoreEl = document.getElementById('final-score');
    this.finalTimeEl = document.getElementById('final-time');
    this.topScoreDisplay = document.getElementById('top-score-display');
    this.deviceTypeLabel = document.getElementById('device-type-label');
    this.detectedControlsMode = document.getElementById('detected-controls-mode');

    this.previousOverlay = 'start'; // 'start' or 'pause'
    this.detectDeviceControls();
  }

  detectDeviceControls() {
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
    const modeText = isMobile ? 'Mobile / Tablet Touch' : 'Keyboard & Mouse';
    if (this.deviceTypeLabel) this.deviceTypeLabel.textContent = modeText;
    if (this.detectedControlsMode) this.detectedControlsMode.textContent = modeText;
  }

  bindEvents({ onStart, onResume, onRestart, onHome, onToggleSfx, onToggleTheme }) {
    if (this.startButton) this.startButton.addEventListener('click', onStart);
    if (this.resumeButton) this.resumeButton.addEventListener('click', onResume);
    if (this.restartButton) this.restartButton.addEventListener('click', onRestart);
    if (this.retryButton) this.retryButton.addEventListener('click', onStart);
    if (this.homeButton) this.homeButton.addEventListener('click', onHome);

    // Settings Navigation
    if (this.startSettingsBtn) {
      this.startSettingsBtn.addEventListener('click', () => {
        this.previousOverlay = 'start';
        this.showSettingsScreen();
      });
    }

    if (this.pauseSettingsBtn) {
      this.pauseSettingsBtn.addEventListener('click', () => {
        this.previousOverlay = 'pause';
        this.showSettingsScreen();
      });
    }

    if (this.settingsBackBtn) {
      this.settingsBackBtn.addEventListener('click', () => {
        this.hideSettingsScreen();
      });
    }

    if (this.sfxToggleBtn) {
      this.sfxToggleBtn.addEventListener('click', () => {
        if (onToggleSfx) {
          const isMuted = onToggleSfx();
          this.updateSfxButtonUI(isMuted);
        }
      });
    }

    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', (e) => {
        if (onToggleTheme) {
          this.toggleThemeWithAnimation(e, onToggleTheme);
        }
      });
    }
  }

  toggleThemeWithAnimation(event, onToggleTheme) {
    const isTouch = event.touches && event.touches[0];
    const x = isTouch ? event.touches[0].clientX : (event.clientX ?? window.innerWidth / 2);
    const y = isTouch ? event.touches[0].clientY : (event.clientY ?? window.innerHeight / 2);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const performToggle = () => {
      const isLight = onToggleTheme();
      this.updateThemeButtonUI(isLight);
    };

    if (!document.startViewTransition) {
      performToggle();
      return;
    }

    const transition = document.startViewTransition(() => {
      performToggle();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`
      ];
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      document.documentElement.animate(
        {
          clipPath: isLight ? clipPath : [...clipPath].reverse()
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: isLight ? '::view-transition-new(root)' : '::view-transition-old(root)'
        }
      );
    });
  }

  updateSfxButtonUI(isMuted) {
    if (!this.sfxToggleBtn) return;
    if (isMuted) {
      this.sfxToggleBtn.textContent = '🔇 OFF';
      this.sfxToggleBtn.classList.remove('active');
    } else {
      this.sfxToggleBtn.textContent = '🔊 ON';
      this.sfxToggleBtn.classList.add('active');
    }
  }

  updateThemeButtonUI(isLight) {
    if (!this.themeToggleBtn) return;
    if (isLight) {
      this.themeToggleBtn.textContent = '☀️ Light';
      this.themeToggleBtn.classList.remove('active');
    } else {
      this.themeToggleBtn.textContent = '🌙 Dark';
      this.themeToggleBtn.classList.add('active');
    }
  }

  showStartScreen(topScore) {
    this.detectDeviceControls();
    if (this.topScoreDisplay) this.topScoreDisplay.textContent = topScore;
    if (this.startOverlay) this.startOverlay.hidden = false;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = true;
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
  }

  showPauseScreen() {
    this.detectDeviceControls();
    if (this.pauseOverlay) this.pauseOverlay.hidden = false;
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
  }

  hidePauseScreen() {
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
  }

  showSettingsScreen() {
    if (this.startOverlay) this.startOverlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = true;
    if (this.settingsOverlay) this.settingsOverlay.hidden = false;
  }

  hideSettingsScreen() {
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
    if (this.previousOverlay === 'pause') {
      if (this.pauseOverlay) this.pauseOverlay.hidden = false;
    } else {
      if (this.startOverlay) this.startOverlay.hidden = false;
    }
  }

  showGameOver(score, timeFormatted, topScore) {
    if (this.finalScoreEl) this.finalScoreEl.textContent = score;
    if (this.finalTimeEl) this.finalTimeEl.textContent = timeFormatted;
    if (this.topScoreDisplay) this.topScoreDisplay.textContent = topScore;

    if (this.startOverlay) this.startOverlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = false;
  }

  hideAll() {
    if (this.startOverlay) this.startOverlay.hidden = true;
    if (this.pauseOverlay) this.pauseOverlay.hidden = true;
    if (this.gameOverOverlay) this.gameOverOverlay.hidden = true;
    if (this.settingsOverlay) this.settingsOverlay.hidden = true;
  }
}

export const overlays = new OverlaysManager();
