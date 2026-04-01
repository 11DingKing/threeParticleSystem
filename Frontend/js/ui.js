/**
 * ui.js — DOM interactions: panel events, colour management,
 *          mouse/touch orbit, slider sync, and hand-detection callbacks.
 */
import { state }                              from './state.js';
import { toast }                              from './toast.js';
import { setParticleShape, paintSolid,
         paintFireworks, mesh }               from './renderer.js';
import { startCam, stopCam }                  from './gesture.js';

// ─── Shape ────────────────────────────────────────────────────────────────────
export function applyShape(name) {
  state.shapeName = name;
  document.querySelectorAll('.shape-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.shape === name));
  setParticleShape(name);
  if (name === 'fireworks') paintFireworks(state.colorHex);
  else                      paintSolid(state.colorHex);
}

// ─── Colour ───────────────────────────────────────────────────────────────────
export function applyColor(hex) {
  state.colorHex = hex;
  document.getElementById('colorPicker').value = hex;
  document.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.color === hex));
  document.documentElement.style.setProperty('--accent', hex);
  if (state.shapeName === 'fireworks') paintFireworks(hex);
  else                                 paintSolid(hex);
}

// ─── Slider sync ─────────────────────────────────────────────────────────────
export function syncSlider(val) {
  const v = Math.max(0.25, Math.min(3.5, val));
  const s = document.getElementById('scaleSlider');
  const l = document.getElementById('scaleVal');
  if (s) s.value       = Math.round(v * 100);
  if (l) l.textContent = v.toFixed(1) + '×';
}

// ─── Hand-detection change callback (called by gesture.js) ───────────────────
export function onHandDetectionChange(detected, openness) {
  const badge  = document.getElementById('handBadge');
  const fill   = document.getElementById('opennessFill');
  const slider = document.getElementById('scaleSlider');

  state.handDetected = detected;

  if (detected) {
    // Map openness [0, 1] → scale [0.32, 2.8]
    state.scaleTarget = 0.32 + openness * 2.48;
    syncSlider(state.scaleTarget);
    if (fill)   fill.style.width   = (openness * 100) + '%';
    if (badge)  { badge.textContent = '已检测'; badge.className = 'badge on'; }
    if (slider) { slider.style.opacity = '0.4'; slider.title = '手势控制中，收回手后可用'; }
  } else {
    if (fill)   fill.style.width   = '50%';
    if (badge)  {
      badge.textContent = state.handActive ? '未检测到' : '未启动';
      badge.className   = 'badge';
    }
    if (slider) { slider.style.opacity = '1'; slider.title = ''; }
  }
}

// ─── Mouse / touch orbit & pinch-zoom ────────────────────────────────────────
export function bindInteraction(canvas) {
  let dragging = false;
  let prev     = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', e => {
    dragging = true;
    prev = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('mouseup',   () => { dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    mesh.rotation.y += (e.clientX - prev.x) * 0.006;
    mesh.rotation.x += (e.clientY - prev.y) * 0.006;
    prev = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (state.handDetected) return; // gesture has priority
    state.scaleTarget = Math.max(0.25, Math.min(3.5,
      state.scaleTarget * (1 - e.deltaY * 0.0012)));
    syncSlider(state.scaleTarget);
  }, { passive: false });

  // Touch drag + pinch
  let tPrev = null, tPinch = 0;
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches.length === 1) {
      dragging = true;
      tPrev    = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      dragging = false;
      tPinch = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && tPrev) {
      mesh.rotation.y += (e.touches[0].clientX - tPrev.x) * 0.006;
      mesh.rotation.x += (e.touches[0].clientY - tPrev.y) * 0.006;
      tPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && !state.handDetected) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      state.scaleTarget = Math.max(0.25, Math.min(3.5,
        state.scaleTarget * dist / tPinch));
      tPinch = dist;
      syncSlider(state.scaleTarget);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => { dragging = false; tPrev = null; });
}

// ─── Panel event bindings ─────────────────────────────────────────────────────
export function bindPanelEvents() {
  // Shape buttons
  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => applyShape(btn.dataset.shape));
  });

  // Colour picker
  document.getElementById('colorPicker').addEventListener('input', e =>
    applyColor(e.target.value));

  // Colour swatches
  document.querySelectorAll('.swatch').forEach(s =>
    s.addEventListener('click', () => applyColor(s.dataset.color)));

  // Scale slider — active only when hand gesture is not controlling scale
  const scaleSlider = document.getElementById('scaleSlider');
  scaleSlider.addEventListener('input', e => {
    if (!state.handDetected) {
      state.scaleTarget = parseInt(e.target.value) / 100;
      document.getElementById('scaleVal').textContent =
        state.scaleTarget.toFixed(1) + '×';
    }
  });

  // Camera toggle
  let camRunning = false;
  const camBtn   = document.getElementById('camBtn');
  camBtn.addEventListener('click', async () => {
    if (!camRunning) {
      const ok = await startCam({ onDetected: onHandDetectionChange });
      if (ok) {
        camRunning = true;
        camBtn.textContent = '📷 关闭';
        camBtn.className   = 'act-btn on-cam';
        document.getElementById('handBadge').textContent = '未检测到';
        document.getElementById('handBadge').className   = 'badge';
      }
    } else {
      stopCam();
      camRunning = false;
      camBtn.textContent = '📷 摄像头';
      camBtn.className   = 'act-btn';
      onHandDetectionChange(false, 0);
    }
  });

  // Auto-rotate toggle
  document.getElementById('rotBtn').addEventListener('click', e => {
    state.autoRotate    = !state.autoRotate;
    e.target.className  = 'act-btn' + (state.autoRotate ? ' on-rot' : '');
    e.target.textContent = state.autoRotate ? '↻ 自转' : '↻ 已停';
  });

  // Fullscreen
  const fsBtn = document.getElementById('fsBtn');
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast('全屏模式不可用：' + err.message, 'warning');
      });
    } else {
      document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', () => {
    fsBtn.textContent = document.fullscreenElement ? '⊡' : '⛶';
  });
}
