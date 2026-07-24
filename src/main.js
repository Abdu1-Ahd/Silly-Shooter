/**
 * Main Application Bootstrap for Silly Shooter
 */
import { gameEngine } from './engine/game.js';

document.addEventListener('DOMContentLoaded', () => {
  gameEngine.init();
});
