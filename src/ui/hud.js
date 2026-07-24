/**
 * HUD Manager for Silly Shooter / Circle Survivor
 */
export class HUDManager {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.topScoreEl = document.getElementById('top-score');
    this.timeEl = document.getElementById('time');
    this.powerupBar = document.getElementById('powerup-bar');
  }

  updateScore(score) {
    if (this.scoreEl) this.scoreEl.textContent = score;
  }

  updateTopScore(topScore) {
    if (this.topScoreEl) this.topScoreEl.textContent = topScore;
  }

  updateTime(seconds) {
    if (this.timeEl) this.timeEl.textContent = `${Math.floor(seconds)}s`;
  }

  updatePowerups(player) {
    if (!this.powerupBar) return;
    this.powerupBar.innerHTML = '';

    if (player.shieldTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge shield';
      badge.textContent = `🛡️ Shield (${Math.ceil(player.shieldTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
    if (player.tripleShotTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge triple';
      badge.textContent = `⚡ Triple (${Math.ceil(player.tripleShotTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
    if (player.rapidFireTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge rapid';
      badge.textContent = `🔥 Rapid (${Math.ceil(player.rapidFireTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
  }
}

export const hud = new HUDManager();
