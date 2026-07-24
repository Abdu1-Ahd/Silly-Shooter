/**
 * Main Application Bootstrap for Silly Shooter / Circle Survivor
 */
import { gameEngine } from './engine/game.js';

document.addEventListener('DOMContentLoaded', () => {
  gameEngine.init();
});
