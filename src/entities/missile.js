/**
 * Homing Missile Entity for Silly Shooter
 */
export class HomingMissile {
  constructor(x, y, initialAngle) {
    this.radius = 5;
    this.x = x;
    this.y = y;
    this.speed = 450;
    this.angle = initialAngle;
    this.vx = Math.cos(initialAngle) * 200;
    this.vy = Math.sin(initialAngle) * 200;
    this.life = 3.5; // Disappears after 3.5s

    this.element = document.createElement('div');
    this.element.className = 'missile-entity';
    this.applyStyles();
  }

  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: '#fb923c',
      boxShadow: '0 0 14px #f97316, 0 0 4px #ffffff',
      zIndex: '2',
      pointerEvents: 'none',
    });
  }

  update(dt, enemies, boss) {
    this.life -= dt;

    // Find nearest target
    let target = boss || null;
    let minDist = Infinity;

    if (!target && enemies.length > 0) {
      for (const enemy of enemies) {
        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
    }

    if (target) {
      const targetCenterX = target.x + (target.radius || 11);
      const targetCenterY = target.y + (target.radius || 11);
      const desiredAngle = Math.atan2(targetCenterY - this.y, targetCenterX - this.x);

      // Smoothly rotate toward target
      let diff = desiredAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.angle += diff * Math.min(1, dt * 10);
    }

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.render();
    return this.life <= 0;
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  isOffscreen(width, height) {
    const margin = 30;
    return (
      this.x < -margin ||
      this.x > width + margin ||
      this.y < -margin ||
      this.y > height + margin
    );
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}
