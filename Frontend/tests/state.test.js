import { describe, it, expect } from 'vitest';
import { state } from '../js/state.js';

describe('state — default values', () => {
  it('starts with shape "heart"', () => {
    expect(state.shapeName).toBe('heart');
  });

  it('starts with scale 1.0 for both target and current', () => {
    expect(state.scaleTarget).toBe(1.0);
    expect(state.scaleNow).toBe(1.0);
  });

  it('starts with the default pink color', () => {
    expect(state.colorHex).toBe('#ff4488');
  });

  it('starts with autoRotate enabled', () => {
    expect(state.autoRotate).toBe(true);
  });

  it('starts with camera and hand detection inactive', () => {
    expect(state.handActive).toBe(false);
    expect(state.handDetected).toBe(false);
  });

  it('exposes all expected keys', () => {
    const keys = Object.keys(state);
    expect(keys).toEqual(
      expect.arrayContaining([
        'shapeName', 'scaleTarget', 'scaleNow',
        'colorHex', 'autoRotate', 'handActive', 'handDetected',
      ]),
    );
  });
});
