/**
 * Particle FX Entity for Silly Shooter / Circle Survivor
 */
export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 3.5 + 1.5;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 180 + 40;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.life = 1;
    this.maxLife = Math.random() * 0.35 + 0.25;

    this.element = document.createElement('div');
    this.element.className = 'particle-entity';
    
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: color || '#fb3b5b',
      boxShadow: `0 0 8px ${color || '#fb3b5b'}`,
      zIndex: '1',
      pointerEvents: 'none',
    });
  }

  update(dt) {
    this.life -= dt / this.maxLife;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;

    this.element.style.opacity = Math.max(0, this.life);
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${Math.max(0, this.life)})`;

    return this.life <= 0;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

export function createExplosion(x, y, color, count = 12) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
  return particles;
}
