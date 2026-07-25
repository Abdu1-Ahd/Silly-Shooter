/**
 * Player Entity for Silly Shooter
 */
export class Player {
  constructor(containerWidth, containerHeight) {
    this.radius = 14; // 28px diameter
    this.x = (containerWidth - this.radius * 2) / 2;
    this.y = (containerHeight - this.radius * 2) / 2;
    this.speed = 330;
    this.hp = 100;
    this.maxHp = 100;
    
    // Active Powerups
    this.shieldTimer = 0;
    this.tripleShotTimer = 0;
    this.rapidFireTimer = 0;
    this.freezeTimer = 0;
    this.laserTimer = 0;
    this.missilesTimer = 0;
    this.lastShotTime = 0;

    this.element = document.createElement('div');
    this.element.className = 'player-entity';
    this.element.id = 'player';
    this.element.setAttribute('aria-label', 'Player');
    this.applyStyles();
  }

  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #ffffff, #38bdf8)',
      boxShadow: '0 0 24px #38bdf8, inset 0 0 8px #0284c7',
      zIndex: '3',
      pointerEvents: 'none',
      transition: 'box-shadow 0.2s ease',
    });
  }

  reset(containerWidth, containerHeight) {
    this.x = (containerWidth - this.radius * 2) / 2;
    this.y = (containerHeight - this.radius * 2) / 2;
    this.hp = 100;
    this.shieldTimer = 0;
    this.tripleShotTimer = 0;
    this.rapidFireTimer = 0;
    this.freezeTimer = 0;
    this.laserTimer = 0;
    this.missilesTimer = 0;
    this.lastShotTime = 0;
    this.render();
  }

  update(dt, moveVector, containerWidth, containerHeight) {
    // Update powerup timers
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.tripleShotTimer > 0) this.tripleShotTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.laserTimer > 0) this.laserTimer -= dt;
    if (this.missilesTimer > 0) this.missilesTimer -= dt;

    // Visual feedback for Shield & Laser
    if (this.shieldTimer > 0) {
      this.element.style.boxShadow = '0 0 30px #38bdf8, 0 0 0 6px rgba(56, 189, 248, 0.4)';
    } else if (this.laserTimer > 0) {
      this.element.style.boxShadow = '0 0 30px #4ade80, 0 0 0 6px rgba(74, 222, 128, 0.4)';
    } else {
      this.element.style.boxShadow = '0 0 24px #38bdf8, inset 0 0 8px #0284c7';
    }

    // Movement
    if (moveVector.x !== 0 || moveVector.y !== 0) {
      this.x += moveVector.x * this.speed * dt;
      this.y += moveVector.y * this.speed * dt;
    }

    // Boundaries clamping
    this.x = Math.max(0, Math.min(containerWidth - this.radius * 2, this.x));
    this.y = Math.max(0, Math.min(containerHeight - this.radius * 2, this.y));

    this.render();
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  takeDamage(amount) {
    if (this.shieldTimer > 0) return false; // Shield protects player
    this.hp -= amount;
    return true;
  }

  applyPowerup(type) {
    if (type === 'shield') this.shieldTimer = 8;
    if (type === 'triple') this.tripleShotTimer = 10;
    if (type === 'rapid') this.rapidFireTimer = 8;
    if (type === 'freeze') this.freezeTimer = 5;
    if (type === 'laser') this.laserTimer = 6;
    if (type === 'missiles') this.missilesTimer = 6;
  }

  getFireRateDelay() {
    if (this.laserTimer > 0) return 90;
    return this.rapidFireTimer > 0 ? 100 : 200;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}
