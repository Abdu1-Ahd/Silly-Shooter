/**
 * Core Game Engine & State Machine for Silly Shooter
 */
import { Player } from '../entities/player.js';
import { spawnEnemy } from '../entities/enemy.js';
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
    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.particles = [];

    this.score = 0;
    this.topScore = 0;
    this.startedAt = 0;
    this.lastFrame = 0;
    this.lastSpawn = 0;
    this.lastShotTime = 0;
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
      onToggleTheme: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        try { localStorage.setItem('sillyShooterTheme', nextTheme); } catch(e){}
        return nextTheme === 'light';
      },
    });

    // Load initial Theme
    const savedTheme = localStorage.getItem('sillyShooterTheme') || localStorage.getItem('circleSurvivorTheme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    overlays.updateThemeButtonUI(savedTheme === 'light');

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
    this.elapsedSeconds = 0;
    this.startedAt = performance.now();
    this.lastFrame = performance.now();
    this.lastSpawn = performance.now();
    this.lastShotTime = performance.now();

    // Create Player
    this.player = new Player(this.container.clientWidth, this.container.clientHeight);
    this.entitiesLayer.appendChild(this.player.element);

    hud.updateScore(0);
    hud.updateTopScore(this.topScore);
    hud.updateTime(0);

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

    // 1. Player Input & Movement
    const moveVec = input.getMovementVector();
    this.player.update(dt, moveVec, this.container.clientWidth, this.container.clientHeight);
    hud.updatePowerups(this.player);

    // 2. Weapon Firing Logic
    const isFiring = input.mouse.isDown || input.isTouchFiring;
    const fireDelay = this.player.getFireRateDelay();
    if (isFiring && (now - this.lastShotTime > fireDelay)) {
      const rect = this.container.getBoundingClientRect();
      const targetX = input.mouse.x;
      const targetY = input.mouse.y;

      const newBullets = createBullets(this.player, targetX, targetY, rect);
      for (const bullet of newBullets) {
        this.bullets.push(bullet);
        this.entitiesLayer.appendChild(bullet.element);
      }
      audio.playShoot();
      this.lastShotTime = now;
    }

    // 3. Enemy Spawning Logic
    const spawnInterval = Math.max(380, 1150 - this.elapsedSeconds * 14);
    if (now - this.lastSpawn > spawnInterval) {
      const enemy = spawnEnemy(this.container.clientWidth, this.container.clientHeight, this.elapsedSeconds);
      this.enemies.push(enemy);
      this.entitiesLayer.appendChild(enemy.element);
      this.lastSpawn = now;
    }

    // 4. Update Enemies & Collision with Player
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this.player.x, this.player.y);

      // Check collision with Player
      const dx = (this.player.x + this.player.radius) - (enemy.x + enemy.radius);
      const dy = (this.player.y + this.player.radius) - (enemy.y + enemy.radius);
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < (this.player.radius + enemy.radius - 2)) {
        if (this.player.shieldTimer > 0) {
          // Destroy enemy instantly when shield is active
          this.spawnParticleBurst(enemy.x, enemy.y, enemy.color);
          enemy.destroy();
          this.enemies.splice(i, 1);
          audio.playExplode();
        } else {
          // Game Over hit
          this.endGame();
          return;
        }
      }
    }

    // 5. Update Bullets & Collision with Enemies
    for (let b = this.bullets.length - 1; b >= 0; b--) {
      const bullet = this.bullets[b];
      bullet.update(dt);

      if (bullet.isOffscreen(this.container.clientWidth, this.container.clientHeight)) {
        bullet.destroy();
        this.bullets.splice(b, 1);
        continue;
      }

      // Check bullet hit against enemies
      for (let e = this.enemies.length - 1; e >= 0; e--) {
        const enemy = this.enemies[e];
        const dx = (bullet.x + bullet.radius) - (enemy.x + enemy.radius);
        const dy = (bullet.y + bullet.radius) - (enemy.y + enemy.radius);
        const dist = Math.hypot(dx, dy) || 1;

        if (dist < (bullet.radius + enemy.radius)) {
          // Hit detected
          bullet.destroy();
          this.bullets.splice(b, 1);

          audio.playHit();
          const isKilled = enemy.takeDamage(1);

          if (isKilled) {
            this.spawnParticleBurst(enemy.x, enemy.y, enemy.color);
            audio.playExplode();

            // Score increment
            this.score += enemy.scoreVal;
            hud.updateScore(this.score);

            // Chance to drop power-up item
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

    // 6. Update Powerups & Player Pickup
    for (let p = this.powerups.length - 1; p >= 0; p--) {
      const powerup = this.powerups[p];
      const expired = powerup.update(dt);

      if (expired) {
        powerup.destroy();
        this.powerups.splice(p, 1);
        continue;
      }

      // Check player collection distance
      const dx = (this.player.x + this.player.radius) - (powerup.x + powerup.radius);
      const dy = (this.player.y + this.player.radius) - (powerup.y + powerup.radius);
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < (this.player.radius + powerup.radius)) {
        // Collect Powerup!
        audio.playPowerup();

        if (powerup.type === 'nuke') {
          // Nuke clears screen
          this.triggerNuke();
        } else {
          this.player.applyPowerup(powerup.type);
        }

        powerup.destroy();
        this.powerups.splice(p, 1);
      }
    }

    // 7. Update Particles
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
    // Screen white flash overlay mimicking nuke explosion
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

  spawnParticleBurst(x, y, color, count = 12) {
    const burst = createExplosion(x, y, color, count);
    for (const particle of burst) {
      this.particles.push(particle);
      this.entitiesLayer.appendChild(particle.element);
    }
  }

  async endGame() {
    this.state = 'GAMEOVER';
    cancelAnimationFrame(this.animationId);
    audio.playGameOver();

    if (this.player) {
      this.spawnParticleBurst(this.player.x, this.player.y, '#38bdf8', 24);
    }

    if (this.score > this.topScore) {
      this.topScore = this.score;
      // Save top score to YouTube Cloud & LocalStorage
      await ytSDK.saveData({ topScore: this.topScore });
      ytSDK.sendScore(this.topScore);
    }

    const timeFormatted = `${Math.floor(this.elapsedSeconds)}s`;
    overlays.showGameOver(this.score, timeFormatted, this.topScore);
  }

  clearAllEntities() {
    this.enemies.forEach(e => e.destroy());
    this.bullets.forEach(b => b.destroy());
    this.powerups.forEach(p => p.destroy());
    this.particles.forEach(pt => pt.destroy());
    if (this.player) this.player.destroy();

    this.enemies = [];
    this.bullets = [];
    this.powerups = [];
    this.particles = [];
    this.player = null;
  }
}

export const gameEngine = new GameEngine();
