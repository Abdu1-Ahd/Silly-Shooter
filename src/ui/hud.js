/**
 * HUD Manager for Silly Shooter
 */
export class HUDManager {
  constructor() {
    this.scoreEl = document.getElementById('score');
    this.topScoreEl = document.getElementById('top-score');
    this.timeEl = document.getElementById('time');
    this.waveEl = document.getElementById('wave');
    this.powerupBar = document.getElementById('powerup-bar');
    this.pauseBtn = document.getElementById('pause-btn');

    this.bossContainer = document.getElementById('boss-health-container');
    this.bossHpFill = document.getElementById('boss-hp-fill');
  }

  bindPauseClick(callback) {
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        callback();
      });
    }
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

  updateWave(wave) {
    if (this.waveEl) this.waveEl.textContent = wave;
  }

  updateBossHealth(boss) {
    if (!this.bossContainer || !this.bossHpFill) return;
    if (boss && boss.hp > 0) {
      this.bossContainer.hidden = false;
      const pct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      this.bossHpFill.style.width = `${pct}%`;
    } else {
      this.bossContainer.hidden = true;
    }
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
    if (player.freezeTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge freeze';
      badge.textContent = `❄️ Freeze (${Math.ceil(player.freezeTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
    if (player.laserTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge laser';
      badge.textContent = `🟢 Laser (${Math.ceil(player.laserTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
    if (player.missilesTimer > 0) {
      const badge = document.createElement('span');
      badge.className = 'powerup-badge missiles';
      badge.textContent = `🚀 Missiles (${Math.ceil(player.missilesTimer)}s)`;
      this.powerupBar.appendChild(badge);
    }
  }
}

export const hud = new HUDManager();
