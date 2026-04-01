/**
 * gesture.js — MediaPipe Hands camera management and hand-gesture processing.
 * Depends on globals `Hands` and `Camera` injected via <script> tags.
 */
import { state } from './state.js';
import { toast }  from './toast.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const HAND_CONN = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [0,17],[13,17],[17,18],[18,19],[19,20],
];

// ─── Module-level refs (set in startCam) ─────────────────────────────────────
let handsInst    = null;
let mpCam        = null;
let handCanvas   = null;
let handCtx      = null;
let videoEl      = null;
let _onDetected  = null; // callback(detected: boolean, openness: number) => void

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcOpenness(lm) {
  const palmIdx = [0, 5, 9, 13, 17];
  let cx = 0, cy = 0;
  palmIdx.forEach(i => { cx += lm[i].x; cy += lm[i].y; });
  cx /= palmIdx.length; cy /= palmIdx.length;
  let avg = 0;
  [4, 8, 12, 16, 20].forEach(i => avg += Math.hypot(lm[i].x - cx, lm[i].y - cy));
  avg /= 5;
  // Normalise: ~0.05 = closed fist, ~0.27 = fully open
  return Math.min(1, Math.max(0, (avg - 0.05) / 0.22));
}

function drawHand(lm, w, h) {
  handCtx.clearRect(0, 0, w, h);
  handCtx.strokeStyle = 'rgba(78,255,159,0.8)';
  handCtx.lineWidth   = 1.5;
  HAND_CONN.forEach(([a, b]) => {
    handCtx.beginPath();
    handCtx.moveTo(lm[a].x * w, lm[a].y * h);
    handCtx.lineTo(lm[b].x * w, lm[b].y * h);
    handCtx.stroke();
  });
  handCtx.fillStyle = '#ff4488';
  lm.forEach(p => {
    handCtx.beginPath();
    handCtx.arc(p.x * w, p.y * h, 2.2, 0, Math.PI * 2);
    handCtx.fill();
  });
}

// ─── MediaPipe result handler ─────────────────────────────────────────────────
function onHandResults(results) {
  const w = handCanvas.width, h = handCanvas.height;
  handCtx.clearRect(0, 0, w, h);

  if (results.multiHandLandmarks?.length > 0) {
    const lm       = results.multiHandLandmarks[0];
    const openness = calcOpenness(lm);
    state.handDetected = true;
    _onDetected?.(true, openness);
    drawHand(lm, w, h);
  } else {
    if (state.handDetected) {
      state.handDetected = false;
      _onDetected?.(false, 0);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start camera and hand detection.
 * @param {object} opts
 * @param {function} opts.onDetected - called when detection state changes
 * @returns {Promise<boolean>} true on success
 */
export async function startCam({ onDetected } = {}) {
  _onDetected = onDetected ?? null;

  // Guard: browser requires a secure context (localhost or https) for camera access
  if (!window.isSecureContext) {
    toast('摄像头需要在 localhost 或 https:// 环境下使用，当前页面不符合要求', 'error', 7000);
    return false;
  }

  // Guard: check that MediaPipe globals loaded
  if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
    toast('手势检测库加载失败，已切换为手动控制模式', 'error', 6000);
    return false;
  }

  videoEl    = document.getElementById('videoEl');
  handCanvas = document.getElementById('handCanvas');
  handCtx    = handCanvas.getContext('2d');

  try {
    handsInst = new Hands({
      locateFile: f => `/vendor/mediapipe/hands/${f}`,
    });
    handsInst.setOptions({
      maxNumHands:            1,
      modelComplexity:        1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence:  0.5,
    });
    handsInst.onResults(onHandResults);

    mpCam = new Camera(videoEl, {
      onFrame: async () => {
        if (handsInst) await handsInst.send({ image: videoEl });
      },
      width: 320, height: 240,
    });
    await mpCam.start();

    handCanvas.width  = 172;
    handCanvas.height = 129;
    document.getElementById('camPreview').style.display = 'block';
    state.handActive = true;
    toast('摄像头已启动，将手伸入画面即可手势控制缩放', 'success', 4000);
    return true;

  } catch (err) {
    console.error('[gesture] startCam failed:', err);
    const isPermission  = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
    const isUnsecure    = err?.message?.includes('getUserMedia') && !window.isSecureContext;
    toast(
      isPermission
        ? '摄像头权限被拒绝，请在浏览器地址栏允许摄像头访问后重试'
        : isUnsecure
          ? '摄像头需要在 localhost 或 https:// 环境下使用'
          : `摄像头启动失败：${err.message}，已切换为手动控制`,
      'error', 7000,
    );
    return false;
  }
}

/**
 * Stop camera and clean up MediaPipe resources.
 */
export function stopCam() {
  mpCam?.stop();
  handsInst?.close();
  mpCam = null; handsInst = null;
  state.handActive   = false;
  state.handDetected = false;
  state.scaleTarget  = 1.0;
  document.getElementById('camPreview').style.display = 'none';
  _onDetected?.(false, 0);
  toast('摄像头已关闭，恢复手动控制模式', 'info', 2500);
}
