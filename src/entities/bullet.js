/**
 * Bullet Entity for Silly Shooter
 */
export class Bullet {
  constructor(x, y, vx, vy) {
    this.radius = 4; // 8px diameter
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    this.element = document.createElement('div');
    this.element.className = 'bullet-entity';
    this.applyStyles();
  }

  applyStyles() {
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: '#fef08a',
      boxShadow: '0 0 12px #fde047, 0 0 4px #ffffff',
      zIndex: '2',
      pointerEvents: 'none',
    });
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.render();
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  isOffscreen(width, height) {
    const margin = 20;
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

/**
 * Creates bullets according to active player powerup weapon mode
 */
export function createBullets(player, targetX, targetY, containerRect) {
  const startX = player.x + player.radius - 4;
  const startY = player.y + player.radius - 4;

  const dx = targetX - (player.x + player.radius);
  const dy = targetY - (player.y + player.radius);
  const angle = Math.atan2(dy, dx);
  const speed = 720;

  const bullets = [];

  if (player.tripleShotTimer > 0) {
    // 3 bullets in spread cone (-15 deg, 0 deg, +15 deg)
    const angles = [angle - 0.26, angle, angle + 0.26];
    for (const a of angles) {
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      bullets.push(new Bullet(startX, startY, vx, vy));
    }
  } else {
    // Single bullet
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bullets.push(new Bullet(startX, startY, vx, vy));
  }

  return bullets;
}
