import { expand, turtle } from './lsystem.js';
import { mulberry32 } from './hash.js';
import { SPECIES } from './species.js';

export const BLOOM_RADIUS = 118;

export function buildPlant(traits, genome) {
  const sp = SPECIES[traits.species];
  const form = sp.forms[traits.form];

  // One pass per recursion level, then a terminal pass that turns each raceme
  // marker W into a chain of gravity-bent segments.
  let word = form.rule ? expand(form.axiom, { A: form.rule }, form.depth) : form.axiom;
  if (word.indexOf('W') !== -1) {
    word = expand(word, { W: 'FF&' + 'R'.repeat(form.chain), A: '' }, 1);
  }

  const { segments, blooms } = turtle(word, {
    len: sp.len,
    width: sp.width,
    angle: sp.angle,
    decay: sp.decay,
    taper: sp.taper,
    droop: sp.droop,
    curl: traits.curl
  });

  // Blooms on a branched plant are smaller, the way a spray is smaller than a
  // single head. Without this the blooms collide at the same radius.
  for (const b of blooms) b.scale *= form.bloom;

  const rng = mulberry32((genome ^ 0x5bf03635) >>> 0);
  const eligible = segments.filter(s => !s.raceme && s.depth <= sp.leafDepth);
  const leaves = [];
  const count = Math.min(eligible.length, Math.max(1, Math.round(traits.leaves * sp.leafMult)));

  for (let i = 0; i < count; i++) {
    const s = eligible[Math.min(eligible.length - 1, Math.floor(((i + 0.55) / count) * eligible.length))];
    const f = 0.22 + rng() * 0.5;
    const dir = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const side = i % 2 === 0 ? -1 : 1;
    leaves.push({
      x: s.x1 + (s.x2 - s.x1) * f,
      y: s.y1 + (s.y2 - s.y1) * f,
      angle: dir + side * (0.80 + rng() * 0.35),
      len: (50 + rng() * 28) * sp.leafScale * Math.pow(0.7, s.depth),
      side,
      t: s.t0 + (s.t1 - s.t0) * f
    });
  }

  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const fit = (x, y, pad) => {
    if (x - pad < box.minX) box.minX = x - pad;
    if (y - pad < box.minY) box.minY = y - pad;
    if (x + pad > box.maxX) box.maxX = x + pad;
    if (y + pad > box.maxY) box.maxY = y + pad;
  };

  for (const s of segments) { fit(s.x1, s.y1, s.width); fit(s.x2, s.y2, s.width); }
  for (const b of blooms) fit(b.x, b.y, BLOOM_RADIUS * b.scale);
  for (const l of leaves) {
    fit(l.x, l.y, 4);
    fit(l.x + Math.cos(l.angle) * l.len, l.y + Math.sin(l.angle) * l.len, l.len * 0.34);
  }

  return { segments, leaves, blooms, box, species: sp };
}
