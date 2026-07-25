/**
 * Mega Boss Entity for Silly Shooter
 */
export class MegaBoss {
  constructor(containerWidth, containerHeight, wave) {
    this.radius = 32; // 64px diameter
    this.x = (containerWidth - this.radius * 2) / 2;
    this.y = -this.radius * 2; // Spawn from top
    this.targetY = 100;

    this.maxHp = 40 + wave * 20;
    this.hp = this.maxHp;
    this.speed = 70;
    this.phase = 1; // 1 = Ring Pulses, 2 = Speed Rush

    this.lastAttackTime = 0;
    this.attackInterval = 2200; // ms between ring pulses

    this.element = document.createElement('div');
    this.element.className = 'enemy-entity boss-entity';
    this.applyStyles();
  }

  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #ffffff, #c084fc 40%, #7e22ce 100%)',
      boxShadow: '0 0 32px #c084fc, 0 0 10px #ffffff',
      zIndex: '3',
      pointerEvents: 'none',
      transition: 'box-shadow 0.2s ease',
    });
  }

  update(dt, playerX, playerY, containerW, containerH, isFrozen = false) {
    if (isFrozen) {
      this.element.style.filter = 'hue-rotate(180deg) brightness(1.2)';
      return [];
    }

    // Phase transition check
    if (this.hp <= this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.speed = 125;
      this.attackInterval = 1400;
      this.element.style.boxShadow = '0 0 45px #fb3b5b, 0 0 15px #ffffff';
      this.element.style.background = 'radial-gradient(circle at 35% 35%, #ffffff, #fb3b5b 40%, #9f1239 100%)';
    } else if (this.phase === 1) {
      this.element.style.filter = 'none';
    }

    // Entering the arena
    if (this.y < this.targetY) {
      this.y += 100 * dt;
      this.render();
      return [];
    }

    // Movement AI
    const dx = (playerX + 14) - (this.x + this.radius);
    const dy = (playerY + 14) - (this.y + this.radius);
    const dist = Math.hypot(dx, dy) || 1;

    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;

    // Bounds clamping
    this.x = Math.max(10, Math.min(containerW - this.radius * 2 - 10, this.x));
    this.y = Math.max(10, Math.min(containerH - this.radius * 2 - 10, this.y));

    this.render();

    // Attack Ring Pulses
    const now = performance.now();
    if (now - this.lastAttackTime > this.attackInterval) {
      this.lastAttackTime = now;
      return this.generateRingBullets();
    }
    return [];
  }

  generateRingBullets() {
    const bullets = [];
    const count = this.phase === 2 ? 10 : 8;
    const speed = 210;
    const centerX = this.x + this.radius;
    const centerY = this.y + this.radius;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      bullets.push({
        x: centerX - 6,
        y: centerY - 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6,
        isBossBullet: true,
      });
    }
    return bullets;
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.element.style.filter = 'brightness(2.5)';
    setTimeout(() => {
      if (this.element) this.element.style.filter = 'none';
    }, 50);
    return this.hp <= 0;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}
