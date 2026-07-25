/**
 * Enemy Entity for Silly Shooter
 */
export class Enemy {
  constructor(type, x, y) {
    this.type = type; // 'chaser', 'speeder', 'tank', 'splitter', 'mini'
    this.x = x;
    this.y = y;

    if (type === 'speeder') {
      this.radius = 9;
      this.speed = 190;
      this.hp = 1;
      this.maxHp = 1;
      this.color = '#fde047'; // Yellow
      this.glow = '#eab308';
      this.scoreVal = 2;
    } else if (type === 'tank') {
      this.radius = 18;
      this.speed = 60;
      this.hp = 3;
      this.maxHp = 3;
      this.color = '#c084fc'; // Purple
      this.glow = '#a855f7';
      this.scoreVal = 5;
    } else if (type === 'splitter') {
      this.radius = 14;
      this.speed = 85;
      this.hp = 2;
      this.maxHp = 2;
      this.color = '#38bdf8'; // Cyan
      this.glow = '#0284c7';
      this.scoreVal = 3;
    } else if (type === 'mini') {
      this.radius = 7;
      this.speed = 145;
      this.hp = 1;
      this.maxHp = 1;
      this.color = '#60a5fa'; // Light Blue
      this.glow = '#3b82f6';
      this.scoreVal = 1;
    } else {
      // Default Chaser
      this.radius = 11;
      this.speed = 95;
      this.hp = 1;
      this.maxHp = 1;
      this.color = '#fb3b5b'; // Red
      this.glow = '#f43f5e';
      this.scoreVal = 1;
    }

    this.element = document.createElement('div');
    this.element.className = `enemy-entity enemy-${type}`;
    this.applyStyles();
  }

  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: this.type === 'splitter' ? '25%' : '50%',
      background: `radial-gradient(circle at 35% 35%, #ffffff, ${this.color})`,
      boxShadow: `0 0 16px ${this.glow}`,
      zIndex: '2',
      pointerEvents: 'none',
    });
  }

  update(dt, playerX, playerY, speedMultiplier = 1, isFrozen = false) {
    if (isFrozen) {
      this.element.style.filter = 'hue-rotate(180deg) brightness(1.3)';
      return;
    } else {
      this.element.style.filter = 'none';
    }

    const dx = (playerX + 14) - (this.x + this.radius);
    const dy = (playerY + 14) - (this.y + this.radius);
    const dist = Math.hypot(dx, dy) || 1;

    const currentSpeed = this.speed * speedMultiplier;
    this.x += (dx / dist) * currentSpeed * dt;
    this.y += (dy / dist) * currentSpeed * dt;

    this.render();
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp > 0 && (this.type === 'tank' || this.type === 'splitter')) {
      // Visual flash on hit
      this.element.style.filter = 'brightness(2.5)';
      setTimeout(() => {
        if (this.element) this.element.style.filter = 'none';
      }, 60);
    }
    return this.hp <= 0;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

/**
 * Spawns an enemy outside container viewport edges
 */
export function spawnEnemy(containerW, containerH, elapsedSeconds) {
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 30;

  if (side === 0) { x = Math.random() * containerW; y = -margin; }
  else if (side === 1) { x = containerW + margin; y = Math.random() * containerH; }
  else if (side === 2) { x = Math.random() * containerW; y = containerH + margin; }
  else { x = -margin; y = Math.random() * containerH; }

  // Enemy type pick based on survival time
  const rand = Math.random();
  let type = 'chaser';

  if (elapsedSeconds > 25 && rand < 0.25) {
    type = 'splitter';
  } else if (elapsedSeconds > 15 && rand < 0.45) {
    type = 'speeder';
  } else if (elapsedSeconds > 35 && rand > 0.70) {
    type = 'tank';
  }

  return new Enemy(type, x, y);
}
