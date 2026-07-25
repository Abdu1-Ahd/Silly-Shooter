/**
 * Powerup Drops Entity for Silly Shooter
 */
export class Powerup {
  constructor(type, x, y) {
    this.type = type; // 'shield', 'triple', 'rapid', 'nuke', 'freeze', 'missiles', 'laser'
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.life = 10; // Disappears after 10s

    this.element = document.createElement('div');
    this.element.className = `powerup-entity powerup-${type}`;
    this.applyStyles();
  }

  applyStyles() {
    let bg, glow, symbol;
    if (this.type === 'shield') {
      bg = '#38bdf8'; glow = 'rgba(56, 189, 248, 0.6)'; symbol = '🛡️';
    } else if (this.type === 'triple') {
      bg = '#fde047'; glow = 'rgba(253, 224, 71, 0.6)'; symbol = '⚡';
    } else if (this.type === 'rapid') {
      bg = '#c084fc'; glow = 'rgba(192, 132, 252, 0.6)'; symbol = '🔥';
    } else if (this.type === 'freeze') {
      bg = '#60a5fa'; glow = 'rgba(96, 165, 250, 0.6)'; symbol = '❄️';
    } else if (this.type === 'missiles') {
      bg = '#fb923c'; glow = 'rgba(251, 146, 60, 0.6)'; symbol = '🚀';
    } else if (this.type === 'laser') {
      bg = '#4ade80'; glow = 'rgba(74, 222, 128, 0.6)'; symbol = '🟢';
    } else {
      bg = '#fb3b5b'; glow = 'rgba(251, 59, 91, 0.6)'; symbol = '💣';
    }

    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.radius * 2}px`,
      height: `${this.radius * 2}px`,
      borderRadius: '50%',
      background: bg,
      boxShadow: `0 0 18px ${glow}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      zIndex: '2',
      pointerEvents: 'none',
      animation: 'bounce-pulse 1s ease-in-out infinite alternate',
    });
    this.element.textContent = symbol;
  }

  update(dt) {
    this.life -= dt;
    if (this.life < 3) {
      // Blink when about to expire
      this.element.style.opacity = (Math.floor(this.life * 6) % 2 === 0) ? '0.3' : '1';
    }
    this.render();
    return this.life <= 0;
  }

  render() {
    this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
  }
}

export function trySpawnPowerup(x, y) {
  // 18% drop chance on enemy kill
  if (Math.random() < 0.18) {
    const types = ['shield', 'triple', 'rapid', 'nuke', 'freeze', 'missiles', 'laser'];
    const type = types[Math.floor(Math.random() * types.length)];
    return new Powerup(type, x, y);
  }
  return null;
}
