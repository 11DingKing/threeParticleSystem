/**
 * state.js — Shared application state, single source of truth.
 * All modules read and mutate this object directly.
 */
export const state = {
  shapeName:    'heart',    // active particle shape
  scaleTarget:  1.0,        // desired scale factor (set by hand gesture or slider)
  scaleNow:     1.0,        // smoothly interpolated scale (updated each frame)
  colorHex:     '#ff4488',  // active particle colour
  autoRotate:   true,
  handActive:   false,      // camera stream is running
  handDetected: false,      // hand is currently visible in the current frame
};
