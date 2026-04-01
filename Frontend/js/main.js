/**
 * main.js — Application entry point.
 * Wires together scene initialisation, UI bindings, and the render loop.
 */
import { initScene, startTick }          from './renderer.js';
import { applyShape, bindInteraction,
         bindPanelEvents }               from './ui.js';

const canvas = document.getElementById('canvas3d');

initScene(canvas);
bindInteraction(canvas);
bindPanelEvents();

applyShape('heart');  // load default shape (particles scatter → converge on load)
startTick();
