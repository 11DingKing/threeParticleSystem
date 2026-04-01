/**
 * renderer.js — Three.js scene, particle system, and animation loop.
 * Owns all particle data buffers and the render tick.
 */
import * as THREE from '/vendor/three/three.module.min.js';
import { state }                        from './state.js';
import { genHeart, genFlower, genSaturn } from './shapes.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const N    = 4000;
const LERP = 0.048;

// ─── Three.js objects (populated by initScene) ────────────────────────────────
export let renderer, scene, camera, clock;
export let mesh; // THREE.Points — exported so ui.js can rotate it

// ─── Particle data buffers ────────────────────────────────────────────────────
export const posAttr = new Float32Array(N * 3); // rendered positions
export const colAttr = new Float32Array(N * 3); // per-particle colours

const basePos = new Float32Array(N * 3);        // target shape positions
const curPos  = new Float32Array(N * 3);        // current interpolated positions
const vels    = new Float32Array(N * 3);        // fireworks velocities
const lives   = new Float32Array(N);            // fireworks lifetimes
const phases  = Float32Array.from({ length: N }, () => Math.random() * Math.PI * 2);

let geo; // THREE.BufferGeometry

// ─── Glow sprite texture ──────────────────────────────────────────────────────
function makeGlowTex() {
  const sz = 64;
  const c   = document.createElement('canvas');
  c.width   = c.height = sz;
  const ctx = c.getContext('2d');
  const g   = ctx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.38, 'rgba(255,255,255,0.65)');
  g.addColorStop(0.72, 'rgba(255,255,255,0.18)');
  g.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sz, sz);
  return new THREE.CanvasTexture(c);
}

// ─── Public: initialise Three.js scene ────────────────────────────────────────
export function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x07070f, 1);

  scene  = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
  camera.position.set(0, 0, 5.5);
  clock  = new THREE.Clock();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  _addStars();
  _initParticles();
}

function _addStars() {
  const cnt = 1400;
  const sp  = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r     = 45 + Math.random() * 20;
    sp[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    sp[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    sp[i * 3 + 2] = r * Math.cos(phi);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
    size: 0.07, color: 0xffffff, transparent: true, opacity: 0.55, sizeAttenuation: true,
  })));
}

function _initParticles() {
  geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colAttr, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.045, map: makeGlowTex(), vertexColors: true,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true,
  });
  mesh = new THREE.Points(geo, mat);
  scene.add(mesh);
}

// ─── Public: load a new shape ─────────────────────────────────────────────────
export function setParticleShape(name) {
  if (name === 'fireworks') { _initFireworks(); return; }
  const raw = name === 'heart'  ? genHeart(N)
            : name === 'flower' ? genFlower(N)
            :                     genSaturn(N);
  for (let i = 0; i < N * 3; i++) basePos[i] = raw[i] ?? 0;
}

function _initFireworks() {
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    curPos[i3]     = (Math.random() - 0.5) * 0.6;
    curPos[i3 + 1] = (Math.random() - 0.5) * 0.6;
    curPos[i3 + 2] = (Math.random() - 0.5) * 0.6;
    const ang = Math.random() * Math.PI * 2;
    const elv = (Math.random() - 0.5) * Math.PI;
    const spd = 0.012 + Math.random() * 0.030;
    vels[i3]     = spd * Math.cos(elv) * Math.cos(ang);
    vels[i3 + 1] = spd * Math.sin(elv) + 0.005;
    vels[i3 + 2] = spd * Math.cos(elv) * Math.sin(ang);
    lives[i]     = Math.random();
  }
}

// ─── Public: update particle colours ─────────────────────────────────────────
export function paintSolid(hex) {
  const base = new THREE.Color(hex);
  for (let i = 0; i < N; i++) {
    const b = 0.52 + Math.random() * 0.48;
    colAttr[i * 3]     = base.r * b;
    colAttr[i * 3 + 1] = base.g * b;
    colAttr[i * 3 + 2] = base.b * b;
  }
  geo.attributes.color.needsUpdate = true;
}

export function paintFireworks(baseHex) {
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(baseHex).getHSL(hsl);
  for (let i = 0; i < N; i++) {
    const h = (hsl.h + Math.random() * 0.55 - 0.275 + 1) % 1;
    const c = new THREE.Color().setHSL(h, 1.0, 0.65);
    colAttr[i * 3] = c.r; colAttr[i * 3 + 1] = c.g; colAttr[i * 3 + 2] = c.b;
  }
  geo.attributes.color.needsUpdate = true;
}

// ─── Public: start animation loop ────────────────────────────────────────────
export function startTick() {
  // Scatter particles for entrance animation
  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    curPos[i3]     = (Math.random() - 0.5) * 7;
    curPos[i3 + 1] = (Math.random() - 0.5) * 7;
    curPos[i3 + 2] = (Math.random() - 0.5) * 7;
  }
  _tick();
}

// ─── Private: frame loop ──────────────────────────────────────────────────────
function _tick() {
  requestAnimationFrame(_tick);
  const t = clock.getElapsedTime();

  state.scaleNow += (state.scaleTarget - state.scaleNow) * 0.07;

  if (state.shapeName === 'fireworks') _tickFireworks();
  else                                 _tickShape(t);

  geo.attributes.position.needsUpdate = true;
  if (state.autoRotate) mesh.rotation.y += 0.0038;
  renderer.render(scene, camera);
}

function _tickShape(t) {
  for (let i = 0; i < N; i++) {
    const i3 = i * 3, ph = phases[i], sc = state.scaleNow;
    const tx = basePos[i3]     * sc;
    const ty = basePos[i3 + 1] * sc;
    const tz = basePos[i3 + 2] * sc;
    curPos[i3]     += (tx - curPos[i3])     * LERP;
    curPos[i3 + 1] += (ty - curPos[i3 + 1]) * LERP;
    curPos[i3 + 2] += (tz - curPos[i3 + 2]) * LERP;
    const w = 0.016 * sc;
    posAttr[i3]     = curPos[i3]     + Math.sin(t * 0.72 + ph)          * w;
    posAttr[i3 + 1] = curPos[i3 + 1] + Math.cos(t * 0.55 + ph * 1.3)   * w * 0.8;
    posAttr[i3 + 2] = curPos[i3 + 2] + Math.sin(t * 0.63 + ph * 0.75)  * w;
  }
}

function _tickFireworks() {
  const GRAV = 0.00022, DAMP = 0.9915;
  let colChanged = false;
  const hsl = { h: 0, s: 0, l: 0 };
  new THREE.Color(state.colorHex).getHSL(hsl);

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    lives[i] -= 0.009 + Math.random() * 0.005;

    if (lives[i] <= 0) {
      const sc = state.scaleNow;
      curPos[i3]     = (Math.random() - 0.5) * sc * 0.65;
      curPos[i3 + 1] = (Math.random() - 0.5) * sc * 0.45;
      curPos[i3 + 2] = (Math.random() - 0.5) * sc * 0.65;
      const ang = Math.random() * Math.PI * 2, elv = (Math.random() - 0.5) * Math.PI;
      const spd = (0.013 + Math.random() * 0.028) * sc;
      vels[i3]     = spd * Math.cos(elv) * Math.cos(ang);
      vels[i3 + 1] = spd * Math.sin(elv) + 0.006 * sc;
      vels[i3 + 2] = spd * Math.cos(elv) * Math.sin(ang);
      lives[i] = 0.45 + Math.random() * 0.65;
      const h = (hsl.h + Math.random() * 0.55 - 0.275 + 1) % 1;
      const c = new THREE.Color().setHSL(h, 1.0, 0.68);
      colAttr[i3] = c.r; colAttr[i3 + 1] = c.g; colAttr[i3 + 2] = c.b;
      colChanged = true;
    }

    vels[i3 + 1] -= GRAV;
    vels[i3]     *= DAMP; vels[i3 + 1] *= DAMP; vels[i3 + 2] *= DAMP;
    curPos[i3]     += vels[i3];
    curPos[i3 + 1] += vels[i3 + 1];
    curPos[i3 + 2] += vels[i3 + 2];
    posAttr[i3] = curPos[i3]; posAttr[i3 + 1] = curPos[i3 + 1]; posAttr[i3 + 2] = curPos[i3 + 2];
  }
  if (colChanged) geo.attributes.color.needsUpdate = true;
}
