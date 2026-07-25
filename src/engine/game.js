/**
 * Core Game Engine & State Machine for Silly Shooter
 */
import { Player } from '../entities/player.js';
import { Enemy, spawnEnemy } from '../entities/enemy.js';
import { MegaBoss } from '../entities/boss.js';
import { HomingMissile } from '../entities/missile.js';
import { createBullets } from '../entities/bullet.js';
import { trySpawnPowerup } from '../entities/powerup.js';
import { createExplosion } from '../entities/particle.js';
import { input } from './input.js';
import { audio } from './audio.js';
import { ytSDK } from '../sdk/ytPlayables.js';
import { hud } from '../ui/hud.js';
import { overlays } from '../ui/overlays.js';

export class GameEngine {
  constructor() {
    this.state = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.container = document.getElementById('game-container');
    this.entitiesLayer = document.getElementById('entities-layer');

    this.player = null;
    this.boss = null;
    this.enemies = [];
    this.bullets = [];
    this.bossBullets = [];
    this.missiles = [];
    this.powerups = [];
    this.particles = [];

    this.score = 0;
    this.topScore = 0;
    this.wave = 1;
    this.startedAt = 0;
    this.lastFrame = 0;
    this.lastSpawn = 0;
    this.lastShotTime = 0;
    this.lastMissileTime = 0;
    this.elapsedSeconds = 0;
    this.animationId = null;
  }

  async init() {
    // Initialize YouTube Playables SDK wrapper
    ytSDK.init();
    ytSDK.onPause(() => {
      if (this.state === 'PLAYING') {
        this.pauseGame();
      }
    });
    ytSDK.onResume(() => {
      if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    });
    ytSDK.onMuteChange((isMuted) => {
      audio.setMuted(isMuted);
    });

    // Load top score from YouTube Cloud Save / LocalStorage
    const saved = await ytSDK.loadData();
    if (saved && typeof saved.topScore === 'number') {
      this.topScore = saved.topScore;
    } else {
      this.topScore = Number(localStorage.getItem('sillyShooterTopScore') || localStorage.getItem('circleSurvivorTopScore')) || 0;
    }

    // Bind unified Input engine
    input.init(this.container, () => this.state);

    // ESC key listener & HUD Pause button - strictly active only during PLAYING & PAUSED
    input.onEsc(() => {
      this.togglePause();
    });

    hud.bindPauseClick(() => {
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.togglePause();
      }
    });

    // Bind UI Overlays
    overlays.bindEvents({
      onStart: () => this.startGame(),
      onResume: () => this.resumeGame(),
      onRestart: () => this.startGame(),
      onHome: () => this.goHome(),
      onToggleSfx: () => {
        audio.init();
        audio.setMuted(!audio.muted);
        return audio.muted;
      },
    });

    // Notify YouTube Playables SDK
    ytSDK.notifyFirstFrameReady();
    overlays.showStartScreen(this.topScore);
    ytSDK.notifyGameReady();

    // Window resize handler
    window.addEventListener('resize', () => {
      if (this.player && this.state === 'PLAYING') {
        this.player.x = Math.min(this.player.x, this.container.clientWidth - this.player.radius * 2);
        this.player.y = Math.min(this.player.y, this.container.clientHeight - this.player.radius * 2);
        this.player.render();
      }
    });
  }

  startGame() {
    audio.init();
    audio.playPause();

    // Clear existing entities
    this.clearAllEntities();

    // Reset game state
    this.score = 0;
    this.wave = 1;
    this.elapsedSeconds = 0;
    this.startedAt = performance.now();
    this.lastFrame = performance.now();
    this.lastSpawn = performance.now();
    this.lastShotTime = performance.now();
    this.lastMissileTime = performance.now();

    // Create Player
    this.player = new Player(this.container.clientWidth, this.container.clientHeight);
    this.entitiesLayer.appendChild(this.player.element);

    hud.updateScore(0);
    hud.updateTopScore(this.topScore);
    hud.updateTime(0);
    hud.updateWave(1);
    hud.updateBossHealth(null);

    overlays.hideAll();
    this.state = 'PLAYING';

    cancelAnimationFrame(this.animationId);
    this.animationId = requestAnimationFrame((now) => this.gameLoop(now));
  }

  goHome() {
    this.state = 'START';
    cancelAnimationFrame(this.animationId);
    this.clearAllEntities();
    hud.updateScore(0);
    hud.updateTime(0);
    hud.updateWave(1);
    hud.updateBossHealth(null);
    overlays.showStartScreen(this.topScore);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.pauseGame();
    } else if (this.state === 'PAUSED') {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    audio.playPause();
    cancelAnimationFrame(this.animationId);
    overlays.showPauseScreen();
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    audio.playPause();
    overlays.hidePauseScreen();
    this.lastFrame = performance.now();
    this.animationId = requestAnimationFrame((now) => this.gameLoop(now));
  }

  gameLoop(now) {
    if (this.state !== 'PLAYING') return;

    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.elapsedSeconds = (now - this.startedAt) / 1000;

    hud.updateTime(this.elapsedSeconds);

    // Wave Progression
    const targetWave = 1 + Math.floor(this.score / 500);
    if (targetWave !== this.wave) {
      this.wave = targetWave;
      hud.updateWave(this.wave);
    }

    // 1. Player Input & Movement
    const moveVec = input.getMovementVector();
    this.player.update(dt, moveVec, this.container.clientWidth, this.container.clientHeight);
    hud.updatePowerups(this.player);

    const isFrozen = this.player.freezeTimer > 0;

    // 2. Weapon Firing Logic
    const isFiring = input.mouse.isDown || input.isTouchFiring;
    const fireDelay = this.player.getFireRateDelay();
    if (isFiring && (now - this.lastShotTime > fireDelay)) {
      const rect = this.container.getBoundingClientRect();
      let targetX, targetY;

      if (input.isTouchFiring && (input.touchAimVector.x !== 0 || input.touchAimVector.y !== 0)) {
        const playerCenterX = this.player.x + this.player.radius;
        const playerCenterY = this.player.y + this.player.radius;
        targetX = playerCenterX + input.touchAimVector.x * 250;
        targetY = playerCenterY + input.touchAimVector.y * 250;
      } else {
        targetX = input.mouse.x;
        targetY = input.mouse.y;
      }

      const newBullets = createBullets(this.player, targetX, targetY, rect);
      for (const bullet of newBullets) {
        this.bullets.push(bullet);
        this.entitiesLayer.appendChild(bullet.element);
      }
      if (this.player.laserTimer > 0) {
        audio.playLaser();
      } else {
        audio.playShoot();
      }
      this.lastShotTime = now;
    }

    // Homing Missiles Power-up execution
    if (this.player.missilesTimer > 0 && (now - this.lastMissileTime > 450)) {
      this.lastMissileTime = now;
      audio.playMissile();
      const count = 3;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const missile = new HomingMissile(
          this.player.x + this.player.radius,
          this.player.y + this.player.radius,
          angle
        );
        this.missiles.push(missile);
        this.entitiesLayer.appendChild(missile.element);
      }
    }

    // 3. Mega Boss Spawning & Update Loop
    if (!this.boss && (this.score >= this.wave * 500 - 100 || this.elapsedSeconds > 60 * this.wave)) {
      this.boss = new MegaBoss(this.container.clientWidth, this.container.clientHeight, this.wave);
      this.entitiesLayer.appendChild(this.boss.element);
      this.triggerScreenShake();
      audio.playBossPulse();
    }

    if (this.boss) {
      const ringPulses = this.boss.update(
        dt,
        this.player.x,
        this.player.y,
        this.container.clientWidth,
        this.container.clientHeight,
        isFrozen
      );
      hud.updateBossHealth(this.boss);

      if (ringPulses && ringPulses.length > 0) {
        audio.playBossPulse();
        for (const pulse of ringPulses) {
          const bullet = document.createElement('div');
          bullet.className = 'bullet-entity boss-bullet';
          Object.assign(bullet.style, {
            position: 'absolute',
            width: `${pulse.radius * 2}px`,
            height: `${pulse.radius * 2}px`,
            borderRadius: '50%',
            background: '#c084fc',
            boxShadow: '0 0 16px #a855f7, 0 0 4px #ffffff',
            zIndex: '2',
            pointerEvents: 'none',
          });
          pulse.element = bullet;
          this.bossBullets.push(pulse);
          this.entitiesLayer.appendChild(bullet);
        }
      }

      // Check Boss collision with Player
      const dx = (this.player.x + this.player.radius) - (this.boss.x + this.boss.radius);
      const dy = (this.player.y + this.player.radius) - (this.boss.y + this.boss.radius);
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < (this.player.radius + this.boss.radius - 4)) {
        if (this.player.shieldTimer <= 0) {
          this.endGame();
          return;
        }
      }
    }

    // Update Boss Ring Bullets
    for (let bb = this.bossBullets.length - 1; bb >= 0; bb--) {
      const pulse = this.bossBullets[bb];
      pulse.x += pulse.vx * dt;
      pulse.y += pulse.vy * dt;
      pulse.element.style.transform = `translate3d(${pulse.x}px, ${pulse.y}px, 0)`;

      // Offscreen check
      if (pulse.x < -30 || pulse.x > this.container.clientWidth + 30 || pulse.y < -30 || pulse.y > this.container.clientHeight + 30) {
        pulse.element.remove();
        this.bossBullets.splice(bb, 1);
        continue;
      }

      // Player collision check
      const dx = (this.player.x + this.player.radius) - (pulse.x + pulse.radius);
      const dy = (this.player.y + this.player.radius) - (pulse.y + pulse.radius);
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < (this.player.radius + pulse.radius)) {
        pulse.element.remove();
        this.bossBullets.splice(bb, 1);
        if (this.player.shieldTimer <= 0) {
          this.endGame();
          return;
        }
      }
    }

    // 4. Enemy Spawning Logic
    const spawnInterval = Math.max(320, 1150 - this.elapsedSeconds * 16);
    if (now - this.lastSpawn > spawnInterval) {
      const enemy = spawnEnemy(this.container.clientWidth, this.container.clientHeight, this.elapsedSeconds);
      this.enemies.push(enemy);
      this.entitiesLayer.appendChild(enemy.element);
      this.lastSpawn = now;
    }

    // 5. Update Enemies & Collision with Player
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player.x, this.player.y, 1, isFrozen);

      // Check collision with Player
      const dx = (this.player.x + this.player.radius) - (enemy.x + enemy.radius);
      const dy = (this.player.y + this.player.radius) - (enemy.y + enemy.radius);
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < (this.player.radius + enemy.radius - 2)) {
        if (this.player.shieldTimer > 0) {
          this.spawnParticleBurst(enemy.x, enemy.y, enemy.color);
          enemy.destroy();
          this.enemies.splice(i, 1);
          audio.playExplode();
        } else {
          this.endGame();
          return;
        }
      }
    }

    // 6. Update Bullets & Collision with Enemies & Boss
    for (let b = this.bullets.length - 1; b >= 0; b--) {
      const bullet = this.bullets[b];
      bullet.update(dt);

      if (bullet.isOffscreen(this.container.clientWidth, this.container.clientHeight)) {
        bullet.destroy();
        this.bullets.splice(b, 1);
        continue;
      }

      // Check bullet hit against Boss
      if (this.boss) {
        const dx = (bullet.x + bullet.radius) - (this.boss.x + this.boss.radius);
        const dy = (bullet.y + bullet.radius) - (this.boss.y + this.boss.radius);
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < (bullet.radius + this.boss.radius)) {
          audio.playHit();
          bullet.pierceHits--;
          if (bullet.pierceHits <= 0) {
            bullet.destroy();
            this.bullets.splice(b, 1);
          }

          const isDefeated = this.boss.takeDamage(1);
          if (isDefeated) {
            this.triggerScreenShake();
            this.spawnParticleBurst(this.boss.x, this.boss.y, '#c084fc', 30);
            audio.playExplode();
            this.score += 250;
            hud.updateScore(this.score);
            this.boss.destroy();
            this.boss = null;
            hud.updateBossHealth(null);
          }
          continue;
        }
      }

      // Check bullet hit against regular enemies
      for (let e = this.enemies.length - 1; e >= 0; e--) {
        const enemy = this.enemies[e];
        const dx = (bullet.x + bullet.radius) - (enemy.x + enemy.radius);
        const dy = (bullet.y + bullet.radius) - (enemy.y + enemy.radius);
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < (bullet.radius + enemy.radius)) {
          audio.playHit();
          bullet.pierceHits--;
          if (bullet.pierceHits <= 0) {
            bullet.destroy();
            this.bullets.splice(b, 1);
          }

          const isKilled = enemy.takeDamage(1);
          if (isKilled) {
            this.spawnParticleBurst(enemy.x, enemy.y, enemy.color);
            audio.playExplode();

            // Splitter Enemy Split Logic
            if (enemy.type === 'splitter') {
              for (let s = 0; s < 2; s++) {
                const offsetX = (s === 0 ? -12 : 12);
                const mini = new Enemy('mini', enemy.x + offsetX, enemy.y);
                this.enemies.push(mini);
                this.entitiesLayer.appendChild(mini.element);
              }
            }

            this.score += enemy.scoreVal;
            hud.updateScore(this.score);

            const drop = trySpawnPowerup(enemy.x, enemy.y);
            if (drop) {
              this.powerups.push(drop);
              this.entitiesLayer.appendChild(drop.element);
            }

            enemy.destroy();
            this.enemies.splice(e, 1);
          }
          break;
        }
      }
    }

    // 7. Update Homing Missiles
    for (let m = this.missiles.length - 1; m >= 0; m--) {
      const missile = this.missiles[m];
      const expired = missile.update(dt, this.enemies, this.boss);

      if (expired || missile.isOffscreen(this.container.clientWidth, this.container.clientHeight)) {
        missile.destroy();
        this.missiles.splice(m, 1);
        continue;
      }

      // Check missile hit on Boss
      if (this.boss) {
        const dx = missile.x - (this.boss.x + this.boss.radius);
        const dy = missile.y - (this.boss.y + this.boss.radius);
        if (Math.hypot(dx, dy) < (missile.radius + this.boss.radius)) {
          this.spawnParticleBurst(missile.x, missile.y, '#fb923c', 10);
          audio.playExplode();
          missile.destroy();
          this.missiles.splice(m, 1);

          const isDefeated = this.boss.takeDamage(3);
          if (isDefeated) {
            this.triggerScreenShake();
            this.spawnParticleBurst(this.boss.x, this.boss.y, '#c084fc', 30);
            this.score += 250;
            hud.updateScore(this.score);
            this.boss.destroy();
            this.boss = null;
            hud.updateBossHealth(null);
          }
          continue;
        }
      }

      // Check missile hit on Enemies
      for (let e = this.enemies.length - 1; e >= 0; e--) {
        const enemy = this.enemies[e];
        const dx = missile.x - (enemy.x + enemy.radius);
        const dy = missile.y - (enemy.y + enemy.radius);
        if (Math.hypot(dx, dy) < (missile.radius + enemy.radius)) {
          this.spawnParticleBurst(missile.x, missile.y, '#fb923c', 10);
          audio.playExplode();
          missile.destroy();
          this.missiles.splice(m, 1);

          const isKilled = enemy.takeDamage(2);
          if (isKilled) {
            this.spawnParticleBurst(enemy.x, enemy.y, enemy.color);
            this.score += enemy.scoreVal;
            hud.updateScore(this.score);
            enemy.destroy();
            this.enemies.splice(e, 1);
          }
          break;
        }
      }
    }

    // 8. Update Powerups & Player Pickup
    for (let p = this.powerups.length - 1; p >= 0; p--) {
      const powerup = this.powerups[p];
      const expired = powerup.update(dt);

      if (expired) {
        powerup.destroy();
        this.powerups.splice(p, 1);
        continue;
      }

      const dx = (this.player.x + this.player.radius) - (powerup.x + powerup.radius);
      const dy = (this.player.y + this.player.radius) - (powerup.y + powerup.radius);
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < (this.player.radius + powerup.radius)) {
        audio.playPowerup();

        if (powerup.type === 'nuke') {
          this.triggerNuke();
        } else if (powerup.type === 'freeze') {
          audio.playFreeze();
          this.player.applyPowerup('freeze');
        } else {
          this.player.applyPowerup(powerup.type);
        }

        powerup.destroy();
        this.powerups.splice(p, 1);
      }
    }

    // 9. Update Particles
    for (let pt = this.particles.length - 1; pt >= 0; pt--) {
      const particle = this.particles[pt];
      const dead = particle.update(dt);
      if (dead) {
        particle.destroy();
        this.particles.splice(pt, 1);
      }
    }

    this.animationId = requestAnimationFrame((n) => this.gameLoop(n));
  }

  triggerNuke() {
    this.triggerScreenShake();
    const flash = document.createElement('div');
    flash.className = 'nuke-flash';
    this.container.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    for (const enemy of this.enemies) {
      this.spawnParticleBurst(enemy.x, enemy.y, '#fb3b5b', 16);
      this.score += enemy.scoreVal;
      enemy.destroy();
    }
    this.enemies = [];
    hud.updateScore(this.score);
    audio.playExplode();
  }

  triggerScreenShake() {
    this.container.classList.add('shake-active');
    setTimeout(() => {
      if (this.container) this.container.classList.remove('shake-active');
    }, 350);
  }

  spawnParticleBurst(x, y, color, count = 12) {
    const burst = createExplosion(x, y, color, count);
    for (const particle of burst) {
      this.particles.push(particle);
      this.entitiesLayer.appendChild(particle.element);
    }
  }

  async endGame() {
    this.state = 'GAMEOVER';
    this.triggerScreenShake();
    cancelAnimationFrame(this.animationId);
    audio.playGameOver();

    if (this.player) {
      this.spawnParticleBurst(this.player.x, this.player.y, '#38bdf8', 24);
    }

    if (this.score > this.topScore) {
      this.topScore = this.score;
      await ytSDK.saveData({ topScore: this.topScore });
      ytSDK.sendScore(this.topScore);
    }

    const timeFormatted = `${Math.floor(this.elapsedSeconds)}s`;
    overlays.showGameOver(this.score, timeFormatted, this.topScore);
  }

  clearAllEntities() {
    this.enemies.forEach(e => e.destroy());
    this.bullets.forEach(b => b.destroy());
    this.bossBullets.forEach(bb => bb.element.remove());
    this.missiles.forEach(m => m.destroy());
    this.powerups.forEach(p => p.destroy());
    this.particles.forEach(pt => pt.destroy());
    if (this.boss) this.boss.destroy();
    if (this.player) this.player.destroy();

    this.enemies = [];
    this.bullets = [];
    this.bossBullets = [];
    this.missiles = [];
    this.powerups = [];
    this.particles = [];
    this.boss = null;
    this.player = null;
  }
}

export const gameEngine = new GameEngine();
