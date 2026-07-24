/**
 * Player Entity for Silly Shooter
 */
export class Player {
  constructor(containerWidth, containerHeight) {
    this.radius = 14; // 28px diameter
    this.x = (containerWidth - this.radius * 2) / 2;
    this.y = (containerHeight - this.radius * 2) / 2;
    this.speed = 320;
    this.hp = 100;
    this.maxHp = 100;
    
    // Active Powerups
    this.shieldTimer = 0;
    this.tripleShotTimer = 0;
    this.rapidFireTimer = 0;
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
    this.lastShotTime = 0;
    this.render();
  }

  update(dt, moveVector, containerWidth, containerHeight) {
    // Update powerup timers
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.tripleShotTimer > 0) this.tripleShotTimer -= dt;
    if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;

    // Visual feedback for Shield
    if (this.shieldTimer > 0) {
      this.element.style.boxShadow = '0 0 30px #38bdf8, 0 0 0 6px rgba(56, 189, 248, 0.4)';
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
    if (type === 'shield') this.shieldTimer = 8; // 8 seconds shield
    if (type === 'triple') this.tripleShotTimer = 10; // 10 seconds triple shot
    if (type === 'rapid') this.rapidFireTimer = 8; // 8 seconds rapid fire
  }

  getFireRateDelay() {
    return this.rapidFireTimer > 0 ? 110 : 220; // MS delay between shots
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}
