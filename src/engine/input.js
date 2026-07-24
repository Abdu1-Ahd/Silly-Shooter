/**
 * Unified Input Engine for Silly Shooter
 * Handles Keyboard (WASD, Arrows, ESC), Mouse aiming/firing, and Mobile Touch Joystick/Buttons.
 */
export class InputEngine {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, isDown: false };
    this.touchVector = { x: 0, y: 0 };
    this.isTouchFiring = false;
    this.escHandler = null;
    this.getStateFunc = null;

    this.joystickActive = false;
    this.joystickOrigin = { x: 0, y: 0 };
  }

  /**
   * Bind DOM listeners and handlers
   * @param {HTMLElement} container 
   * @param {Function} getStateFunc Returns current game state string ('START', 'PLAYING', 'PAUSED', 'GAMEOVER')
   */
  init(container, getStateFunc) {
    this.container = container;
    this.getStateFunc = getStateFunc;

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // Strict ESC Key requirement handling:
      if (e.key === 'Escape' || e.key === 'Esc') {
        const state = this.getStateFunc ? this.getStateFunc() : null;
        // ESC key ONLY functions when state is 'PLAYING' or 'PAUSED'
        if (state === 'PLAYING' || state === 'PAUSED') {
          e.preventDefault();
          if (this.escHandler) {
            this.escHandler();
          }
        }
        return;
      }

      if (e.key.startsWith('Arrow') || 'wasd'.includes(key)) {
        e.preventDefault();
        this.keys.add(e.key.startsWith('Arrow') ? e.key : key);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key.startsWith('Arrow')) {
        this.keys.delete(e.key);
      } else {
        this.keys.delete(e.key.toLowerCase());
      }
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.isDown = false;
    });

    // Mouse Aim & Fire Listeners
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('.overlay')) return;
      this.mouse.isDown = true;
      const rect = container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Touch Joystick & Touch Fire setup for mobile YouTube Playables
    this.setupTouchControls();
  }

  setupTouchControls() {
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickKnob = document.getElementById('touch-joystick-knob');
    const fireBtn = document.getElementById('touch-fire-btn');

    if (!joystickZone || !fireBtn) return;

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystickZone.getBoundingClientRect();
      this.joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.joystickActive = true;
      this.updateJoystick(touch, joystickKnob);
    });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.joystickActive && e.touches[0]) {
        this.updateJoystick(e.touches[0], joystickKnob);
      }
    });

    const resetJoystick = () => {
      this.joystickActive = false;
      this.touchVector = { x: 0, y: 0 };
      if (joystickKnob) {
        joystickKnob.style.transform = 'translate(0px, 0px)';
      }
    };

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    fireBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isTouchFiring = true;
    });

    const stopTouchFire = () => {
      this.isTouchFiring = false;
    };

    fireBtn.addEventListener('touchend', stopTouchFire);
    fireBtn.addEventListener('touchcancel', stopTouchFire);
  }

  updateJoystick(touch, knobEl) {
    const dx = touch.clientX - this.joystickOrigin.x;
    const dy = touch.clientY - this.joystickOrigin.y;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy) || 1;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (knobEl) {
      knobEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    this.touchVector.x = Math.cos(angle) * (clampedDist / maxRadius);
    this.touchVector.y = Math.sin(angle) * (clampedDist / maxRadius);
  }

  /**
   * Get normalized movement direction vector (-1 to 1 for x and y)
   */
  getMovementVector() {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('ArrowLeft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('w')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('s')) dy += 1;

    if (this.touchVector.x !== 0 || this.touchVector.y !== 0) {
      dx += this.touchVector.x;
      dy += this.touchVector.y;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      return { x: dx / Math.max(1, len), y: dy / Math.max(1, len) };
    }
    return { x: 0, y: 0 };
  }

  onEsc(handler) {
    this.escHandler = handler;
  }
}

export const input = new InputEngine();
