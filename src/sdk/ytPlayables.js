/**
 * YouTube Playables SDK Integration Module
 * Wraps ytgame SDK methods for lifecycle, pause/resume, mute/unmute, and cloud saves.
 * Provides safe fallbacks when running in local browser environment.
 */
export class YTPlayablesSDK {
  constructor() {
    this.sdk = window.ytgame || null;
    this.isMuted = false;
    this.onPauseCallbacks = [];
    this.onResumeCallbacks = [];
    this.onMuteCallbacks = [];
  }

  /**
   * Initialize SDK hooks
   */
  init() {
    this.sdk = window.ytgame || null;
    if (this.sdk) {
      console.log('[YT Playables] Initializing YouTube Playables SDK...');
      
      // Pause / Resume System Listeners
      if (this.sdk.system && typeof this.sdk.system.onPause === 'function') {
        this.sdk.system.onPause(() => {
          console.log('[YT Playables] System Pause signal received');
          this.onPauseCallbacks.forEach(cb => cb());
        });
      }

      if (this.sdk.system && typeof this.sdk.system.onResume === 'function') {
        this.sdk.system.onResume(() => {
          console.log('[YT Playables] System Resume signal received');
          this.onResumeCallbacks.forEach(cb => cb());
        });
      }

      // Audio Mute / Unmute Listeners
      const handleMute = () => {
        this.isMuted = true;
        this.onMuteCallbacks.forEach(cb => cb(true));
      };

      const handleUnmute = () => {
        this.isMuted = false;
        this.onMuteCallbacks.forEach(cb => cb(false));
      };

      if (this.sdk.system && typeof this.sdk.system.onAudioBusMute === 'function') {
        this.sdk.system.onAudioBusMute(handleMute);
        this.sdk.system.onAudioBusUnmute(handleUnmute);
      } else if (this.sdk.system && typeof this.sdk.system.onMute === 'function') {
        this.sdk.system.onMute(handleMute);
        this.sdk.system.onUnmute(handleUnmute);
      }
    } else {
      console.log('[YT Playables] Running outside YouTube sandbox (Dev Mode)');
    }
  }

  /**
   * Notify platform that initial UI frame is rendered
   */
  notifyFirstFrameReady() {
    if (this.sdk && this.sdk.game && typeof this.sdk.game.firstFrameReady === 'function') {
      this.sdk.game.firstFrameReady();
    }
  }

  /**
   * Notify platform that game is fully loaded and ready for interaction
   */
  notifyGameReady() {
    if (this.sdk && this.sdk.game && typeof this.sdk.game.gameReady === 'function') {
      this.sdk.game.gameReady();
    }
  }

  /**
   * Submit player high score to YouTube Leaderboard
   * @param {number} score 
   */
  sendScore(score) {
    if (this.sdk && this.sdk.game && typeof this.sdk.game.sendScore === 'function') {
      try {
        this.sdk.game.sendScore({ value: Math.floor(score) });
      } catch (err) {
        console.warn('[YT Playables] Error sending score:', err);
      }
    }
  }

  /**
   * Save player data / top score to YouTube Cloud Save or localStorage fallback
   * @param {Object} data 
   */
  async saveData(data) {
    const jsonStr = JSON.stringify(data);
    if (this.sdk && this.sdk.game && typeof this.sdk.game.saveData === 'function') {
      try {
        await this.sdk.game.saveData(jsonStr);
        return;
      } catch (err) {
        console.warn('[YT Playables] Cloud save failed, using local storage fallback:', err);
      }
    }
    // Fallback
    try {
      localStorage.setItem('sillyShooterSaveData', jsonStr);
    } catch (e) {}
  }

  /**
   * Load player data / top score from YouTube Cloud Save or localStorage fallback
   * @returns {Promise<Object|null>}
   */
  async loadData() {
    if (this.sdk && this.sdk.game && typeof this.sdk.game.loadData === 'function') {
      try {
        const raw = await this.sdk.game.loadData();
        if (raw) {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
      } catch (err) {
        console.warn('[YT Playables] Cloud load failed, using local storage fallback:', err);
      }
    }
    // Fallback
    try {
      const raw = localStorage.getItem('sillyShooterSaveData');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  onPause(cb) { this.onPauseCallbacks.push(cb); }
  onResume(cb) { this.onResumeCallbacks.push(cb); }
  onMuteChange(cb) { this.onMuteCallbacks.push(cb); }
}

export const ytSDK = new YTPlayablesSDK();
