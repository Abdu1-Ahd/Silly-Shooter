/**
 * Unified Input Engine for Silly Shooter
 * Handles Keyboard (WASD, Arrows, ESC), Mouse aiming/firing, and Mobile Touch Joystick/Buttons.
 */
export class InputEngine {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, isDown: false };
    this.touchVector = { x: 0, y: 0 };
    this.touchAimVector = { x: 0, y: 0 };
    this.isTouchFiring = false;
    this.escHandler = null;
    this.getStateFunc = null;

    this.moveTouchId = null;
    this.fireTouchId = null;
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

    // Dual Touch Joysticks setup for mobile & tablet YouTube Playables
    this.setupTouchControls();
  }

  setupTouchControls() {
    const moveZone = document.getElementById('touch-move-zone');
    const moveKnob = document.getElementById('touch-move-knob');
    const fireZone = document.getElementById('touch-fire-zone');
    const fireKnob = document.getElementById('touch-fire-knob');

    if (!moveZone || !fireZone) return;

    // Movement Joystick Touch Event Listeners
    moveZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (this.moveTouchId === null) {
          const touch = e.changedTouches[i];
          this.moveTouchId = touch.identifier;
          const rect = moveZone.getBoundingClientRect();
          this.moveOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          this.updateMoveJoystick(touch, moveKnob, rect.width / 2);
        }
      }
    });

    // Aim & Fire Joystick Touch Event Listeners
    fireZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (this.fireTouchId === null) {
          const touch = e.changedTouches[i];
          this.fireTouchId = touch.identifier;
          this.isTouchFiring = true;
          const rect = fireZone.getBoundingClientRect();
          this.fireOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          this.updateFireJoystick(touch, fireKnob, rect.width / 2);
        }
      }
    });

    // Window-level touchmove to smoothly track dragging even outside zones
    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.moveTouchId && moveZone) {
          const rect = moveZone.getBoundingClientRect();
          this.updateMoveJoystick(touch, moveKnob, rect.width / 2);
        }
        if (touch.identifier === this.fireTouchId && fireZone) {
          const rect = fireZone.getBoundingClientRect();
          this.updateFireJoystick(touch, fireKnob, rect.width / 2);
        }
      }
    }, { passive: false });

    // Touch end/cancel listeners
    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.moveTouchId) {
          this.moveTouchId = null;
          this.touchVector = { x: 0, y: 0 };
          if (moveKnob) moveKnob.style.transform = 'translate(0px, 0px)';
        }
        if (touch.identifier === this.fireTouchId) {
          this.fireTouchId = null;
          this.isTouchFiring = false;
          this.touchAimVector = { x: 0, y: 0 };
          if (fireKnob) fireKnob.style.transform = 'translate(0px, 0px)';
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }

  updateMoveJoystick(touch, knobEl, maxRadius) {
    const dx = touch.clientX - this.moveOrigin.x;
    const dy = touch.clientY - this.moveOrigin.y;
    const dist = Math.hypot(dx, dy) || 1;
    const radius = Math.max(30, maxRadius * 0.75);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (knobEl) {
      knobEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    this.touchVector.x = Math.cos(angle) * (clampedDist / radius);
    this.touchVector.y = Math.sin(angle) * (clampedDist / radius);
  }

  updateFireJoystick(touch, knobEl, maxRadius) {
    const dx = touch.clientX - this.fireOrigin.x;
    const dy = touch.clientY - this.fireOrigin.y;
    const dist = Math.hypot(dx, dy) || 1;
    const radius = Math.max(30, maxRadius * 0.75);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (knobEl) {
      knobEl.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    this.touchAimVector.x = Math.cos(angle);
    this.touchAimVector.y = Math.sin(angle);
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
      // Normalize vector so diagonal movement magnitude never exceeds 1
      const scale = len > 1 ? (1 / len) : 1;
      return { x: dx * scale, y: dy * scale };
    }
    return { x: 0, y: 0 };
  }

  onEsc(handler) {
    this.escHandler = handler;
  }
}

export const input = new InputEngine();
