/**
 * shapes.js — Pure particle shape generators.
 * Each function accepts a count `n` and returns a plain Array of
 * interleaved [x, y, z, x, y, z, …] base positions.
 * No side-effects; safe to call at any time.
 */

export function genHeart(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push(x * 0.102, (y - 4) * 0.102, (Math.random() - 0.5) * 2.5 * 0.14);
  }
  return out;
}

export function genFlower(n) {
  const out = [];
  const K = 3; // |cos(3θ)| → 6 petals
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.11) {
      // Centre cluster (pistil)
      const r = Math.sqrt(Math.random()) * 0.28;
      const a = Math.random() * Math.PI * 2;
      out.push(r * Math.cos(a), r * Math.sin(a), Math.random() * 0.12);
    } else {
      // Petal — rose curve r = |cos(Kθ)|
      const theta = Math.random() * Math.PI * 2;
      const maxR  = Math.abs(Math.cos(K * theta));
      const r     = Math.sqrt(Math.random()) * maxR * 1.5;
      const ang   = theta + (Math.random() - 0.5) * 0.07;
      const dist  = r / 1.5;
      out.push(
        r * Math.cos(ang),
        r * Math.sin(ang),
        dist * dist * 0.28 - 0.1 + (Math.random() - 0.5) * 0.06,
      );
    }
  }
  return out;
}

export function genSaturn(n) {
  const out     = [];
  const sphereN = Math.floor(n * 0.42);
  const ringN   = n - sphereN;
  const TILT    = Math.PI * 0.22; // ~40° ring-plane tilt

  // Planet
  for (let i = 0; i < sphereN; i++) {
    const phi   = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r     = 0.68 * (0.9 + Math.random() * 0.1);
    out.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    );
  }

  // Rings — in XZ plane, then rotated around X by TILT
  for (let i = 0; i < ringN; i++) {
    const theta = Math.random() * Math.PI * 2;
    const rand  = Math.random();
    let r;
    if      (rand < 0.22) r = 0.82 + Math.random() * 0.15; // C ring
    else if (rand < 0.25) r = 0.97 + Math.random() * 0.06; // Cassini gap
    else if (rand < 0.65) r = 1.03 + Math.random() * 0.38; // B ring
    else if (rand < 0.68) r = 1.41 + Math.random() * 0.03; // Encke gap
    else                  r = 1.44 + Math.random() * 0.28; // A ring

    const thick = (Math.random() - 0.5) * 0.04;
    const x0    = r * Math.cos(theta);
    const z0    = r * Math.sin(theta);
    out.push(
      x0,
      -z0 * Math.sin(TILT) + thick * Math.cos(TILT),
       z0 * Math.cos(TILT) + thick * Math.sin(TILT),
    );
  }
  return out;
}
