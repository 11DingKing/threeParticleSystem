import { describe, it, expect, beforeEach, vi } from 'vitest';
import { genHeart, genFlower, genSaturn } from '../js/shapes.js';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Assert every value in an array is a finite number (no NaN / Infinity). */
function expectAllFinite(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) {
      throw new Error(`Non-finite value at index ${i}: ${arr[i]}`);
    }
  }
}

/** Return the component-wise {min, max} over an interleaved xyz array. */
function xyzBounds(arr) {
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  let zMin = Infinity, zMax = -Infinity;
  for (let i = 0; i < arr.length; i += 3) {
    xMin = Math.min(xMin, arr[i]);     xMax = Math.max(xMax, arr[i]);
    yMin = Math.min(yMin, arr[i + 1]); yMax = Math.max(yMax, arr[i + 1]);
    zMin = Math.min(zMin, arr[i + 2]); zMax = Math.max(zMax, arr[i + 2]);
  }
  return { xMin, xMax, yMin, yMax, zMin, zMax };
}

// ── genHeart ──────────────────────────────────────────────────────────────────

describe('genHeart', () => {
  it('returns an array with exactly n*3 elements', () => {
    expect(genHeart(100)).toHaveLength(300);
    expect(genHeart(1)).toHaveLength(3);
  });

  it('returns only finite numbers (no NaN / Infinity)', () => {
    expectAllFinite(genHeart(500));
  });

  it('produces a heart-shaped distribution centred near the origin', () => {
    // With n = 4000 the mean X should be close to 0 (heart is symmetric on X).
    const pts = genHeart(4000);
    let sumX = 0;
    for (let i = 0; i < pts.length; i += 3) sumX += pts[i];
    const meanX = sumX / (pts.length / 3);
    expect(Math.abs(meanX)).toBeLessThan(0.15);
  });

  it('x values stay within the expected scaled range (≈ ±1.63)', () => {
    // Parametric heart: x = 16·sin³(t) → max ≈ 16; scaled by 0.102 → ≈ 1.63
    const { xMin, xMax } = xyzBounds(genHeart(2000));
    expect(xMin).toBeGreaterThan(-2);
    expect(xMax).toBeLessThan(2);
  });

  it('z spread is narrow (thin-shell depth ≈ ±0.175)', () => {
    const { zMin, zMax } = xyzBounds(genHeart(2000));
    expect(zMin).toBeGreaterThan(-0.3);
    expect(zMax).toBeLessThan(0.3);
  });
});

// ── genFlower ─────────────────────────────────────────────────────────────────

describe('genFlower', () => {
  it('returns an array with exactly n*3 elements', () => {
    expect(genFlower(200)).toHaveLength(600);
  });

  it('returns only finite numbers', () => {
    expectAllFinite(genFlower(500));
  });

  it('xy extent stays within petal radius (≤ 1.5)', () => {
    const { xMin, xMax, yMin, yMax } = xyzBounds(genFlower(2000));
    expect(xMin).toBeGreaterThan(-2);
    expect(xMax).toBeLessThan(2);
    expect(yMin).toBeGreaterThan(-2);
    expect(yMax).toBeLessThan(2);
  });

  it('centre cluster particles are close to the origin', () => {
    // Seed Math.random so that ~11 % are centre particles — verify those
    // cluster points are small in magnitude.
    const pts = genFlower(4000);
    // We cannot isolate centre vs petal without seeding, so just check that
    // many points lie within r < 0.3 in XY (centre cluster radius = 0.28).
    let centreCount = 0;
    for (let i = 0; i < pts.length; i += 3) {
      const r = Math.hypot(pts[i], pts[i + 1]);
      if (r < 0.3) centreCount++;
    }
    // Expect at least 5 % of particles to be near-centre (target ~11 %)
    expect(centreCount / (pts.length / 3)).toBeGreaterThan(0.05);
  });
});

// ── genSaturn ─────────────────────────────────────────────────────────────────

describe('genSaturn', () => {
  it('returns an array with exactly n*3 elements', () => {
    expect(genSaturn(100)).toHaveLength(300);
    expect(genSaturn(1000)).toHaveLength(3000);
  });

  it('returns only finite numbers', () => {
    expectAllFinite(genSaturn(500));
  });

  it('splits particles ~42 % planet / 58 % rings', () => {
    const n = 10000;
    const pts = genSaturn(n);
    const expectedSphereN = Math.floor(n * 0.42);
    // Planet particles are distributed inside r ≈ 0.76 sphere.
    // Ring particles (in XZ plane, rotated) reach out to ~1.72.
    // Count points with distance from origin < 0.82 as "sphere" particles.
    let sphereCount = 0;
    for (let i = 0; i < pts.length; i += 3) {
      const r = Math.hypot(pts[i], pts[i + 1], pts[i + 2]);
      if (r < 0.82) sphereCount++;
    }
    // Allow ±10 % tolerance around expected
    expect(sphereCount).toBeGreaterThan(expectedSphereN * 0.90);
    expect(sphereCount).toBeLessThan(expectedSphereN * 1.10);
  });

  it('ring particles extend outward beyond the planet body', () => {
    const pts = genSaturn(2000);
    const { xMax } = xyzBounds(pts);
    // Outermost A-ring reaches r ≈ 1.44–1.72 in XZ — at least one point
    // should extend beyond 1.3 in x.
    expect(xMax).toBeGreaterThan(1.3);
  });
});
