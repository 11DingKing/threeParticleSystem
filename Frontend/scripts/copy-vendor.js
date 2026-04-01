#!/usr/bin/env node
/**
 * copy-vendor.js
 * Copies runtime library files from node_modules into vendor/ so that the
 * app can be served locally with any static-file server (python, npx serve…).
 * Run automatically via `npm run setup` or `npm run dev`.
 */

const fs   = require('fs');
const path = require('path');

const root   = path.join(__dirname, '..');          // Frontend/
const nm     = path.join(root, 'node_modules');
const vendor = path.join(root, 'vendor');

function cpDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

// ── Three.js ─────────────────────────────────────────────────────────────────
const threeDst = path.join(vendor, 'three');
fs.mkdirSync(threeDst, { recursive: true });

const threeMin  = path.join(nm, 'three/build/three.module.min.js');
const threeFull = path.join(nm, 'three/build/three.module.js');
const threeSrc  = fs.existsSync(threeMin) ? threeMin : threeFull;

fs.copyFileSync(threeSrc, path.join(threeDst, 'three.module.min.js'));
console.log('✓  three.js         →  vendor/three/');

// ── MediaPipe Hands ───────────────────────────────────────────────────────────
cpDir(path.join(nm, '@mediapipe/hands'),
      path.join(vendor, 'mediapipe/hands'));
console.log('✓  mediapipe/hands  →  vendor/mediapipe/hands/');

// ── MediaPipe Camera Utils ────────────────────────────────────────────────────
cpDir(path.join(nm, '@mediapipe/camera_utils'),
      path.join(vendor, 'mediapipe/camera_utils'));
console.log('✓  camera_utils     →  vendor/mediapipe/camera_utils/');

console.log('\nVendor ready.  Start with:  npx serve . -p 8081');
