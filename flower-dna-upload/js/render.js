import { BLOOM_RADIUS } from './plant.js';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // 137.5 degrees

const MOOD = {
  vivid:  { sat: 76, light: 57 },
  soft:   { sat: 50, light: 68 },
  deep:   { sat: 62, light: 44 },
  pastel: { sat: 44, light: 78 }
};

const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const backOut = t => { const c = 1.55; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

function petalPath(ctx, r, halfWidth, tip, notch) {
  const cx1 = r * 0.18;
  const cx2 = r * (0.48 + 0.34 * (1 - tip));
  const ty = halfWidth * (1 - tip * 0.72);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  if (notch) {
    ctx.bezierCurveTo(cx1, -halfWidth, cx2, -ty, r * 0.99, -halfWidth * 0.26);
    ctx.quadraticCurveTo(r * 0.76, 0, r * 0.99, halfWidth * 0.26);
    ctx.bezierCurveTo(cx2, ty, cx1, halfWidth, 0, 0);
  } else {
    ctx.bezierCurveTo(cx1, -halfWidth, cx2, -ty, r, 0);
    ctx.bezierCurveTo(cx2, ty, cx1, halfWidth, 0, 0);
  }
  ctx.closePath();
}

export function render(ctx, width, height, plant, traits, progress, phase) {
  const sp = plant.species;
  const box = plant.box;
  const boxW = box.maxX - box.minX;
  const boxH = box.maxY - box.minY;
  const scale = Math.min((width * 0.92) / boxW, (height * 0.94) / boxH);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(box.minX + box.maxX) / 2, -(box.minY + box.maxY) / 2);

  const swayAmp = 8;
  const sway = (x, y) => {
    const above = clamp01((box.maxY - y) / boxH);
    return x + Math.sin(phase + y * 0.010) * swayAmp * Math.pow(above, 1.7);
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const stemP = clamp01(progress / 0.52);
  ctx.strokeStyle = sp.stem;
  for (const s of plant.segments) {
    const f = clamp01((stemP - s.t0) / Math.max(1e-6, s.t1 - s.t0));
    if (f <= 0) continue;
    const ex = s.x1 + (s.x2 - s.x1) * f;
    const ey = s.y1 + (s.y2 - s.y1) * f;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(sway(s.x1, s.y1), s.y1);
    ctx.lineTo(sway(ex, ey), ey);
    ctx.stroke();
  }

  for (const leaf of plant.leaves) {
    const start = 0.10 + leaf.t * 0.42;
    const open = easeOut(clamp01((progress - start) / 0.18));
    if (open <= 0) continue;
    const len = leaf.len * open;
    ctx.save();
    ctx.translate(sway(leaf.x, leaf.y), leaf.y);
    ctx.rotate(leaf.angle + Math.sin(phase * 1.3 + leaf.y * 0.02) * 0.05);
    ctx.fillStyle = 'hsl(' + sp.leafHue + ', 36%, ' + (38 + leaf.side * 4) + '%)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -len * 0.30, len, 0);
    ctx.quadraticCurveTo(len * 0.45, len * 0.30, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'hsl(' + sp.leafHue + ', 40%, 26%)';
    ctx.lineWidth = Math.max(0.6, len * 0.022);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.94, 0);
    ctx.stroke();
    ctx.restore();
  }

  // A species may insist its blooms stay round. A 12px cherry blossom drawn with
  // the narrowest petal gene reads as a spike, not a flower.
  const petalWidth = Math.max(sp.widthFloor, traits.width);
  const petalTip = Math.min(sp.tipCap, traits.tip);

  const mood = MOOD[traits.mood];
  const ordered = plant.blooms.slice().sort((a, b) => b.depth - a.depth);

  for (const bloom of ordered) {
    const start = 0.40 + bloom.t * 0.22;
    const bp = clamp01((progress - start) / 0.50);
    if (bp <= 0) continue;

    const bx = sway(bloom.x, bloom.y);
    const by = bloom.y;
    const radius = BLOOM_RADIUS * bloom.scale;
    const tilt = (bx - bloom.x) * 0.004;

    // A bloom only a few pixels wide cannot show three layers or a seed head, so
    // small ones drop detail. This keeps a 27-bloom cherry spray at 60fps.
    const layers = radius < 26 ? 1 : traits.layers;

    for (let layer = layers - 1; layer >= 0; layer--) {
      const lp = clamp01((bp - layer * 0.10) / 0.72);
      if (lp <= 0) continue;
      const r = radius * (1 - 0.24 * layer) * backOut(lp);
      const halfWidth = (r * petalWidth) / 2;
      const hue = (traits.hue + layer * 15) % 360;
      ctx.fillStyle = 'hsl(' + hue + ', ' + mood.sat + '%, ' + (mood.light - layer * 7) + '%)';
      ctx.strokeStyle = 'hsl(' + hue + ', ' + (mood.sat - 12) + '%, ' + Math.max(16, mood.light - 26) + '%)';
      ctx.lineWidth = Math.max(0.6, r * 0.012);
      for (let i = 0; i < traits.petalCount; i++) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(tilt + (i * 2 * Math.PI) / traits.petalCount + layer * GOLDEN_ANGLE);
        petalPath(ctx, r, halfWidth, petalTip, traits.notch);
        ctx.fill();
        if (r > 8) ctx.stroke();
        ctx.restore();
      }
    }

    const coreHue = traits.coreHue;
    const coreR = radius * sp.coreRatio;

    if (coreR < 7) {
      // A stamen dot is a highlight, not a seed head, so it stays bright.
      ctx.fillStyle = 'hsl(' + coreHue + ', ' + Math.min(85, mood.sat + 20) + '%, 52%)';
      ctx.beginPath();
      ctx.arc(bx, by, Math.max(1, coreR) * clamp01(bp / 0.55), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    // Phyllotaxis: seed i sits at angle i * 137.5 degrees, radius c * sqrt(i).
    const total = traits.core;
    const shown = Math.floor(total * clamp01(bp / 0.55));
    const c = coreR / Math.sqrt(Math.max(1, total));
    const dot = Math.max(1.0, c * 0.62);
    for (let i = 0; i < shown; i++) {
      const a = i * GOLDEN_ANGLE;
      const rr = c * Math.sqrt(i);
      ctx.fillStyle = 'hsl(' + coreHue + ', ' + (mood.sat - 8) + '%, ' + (26 + (i % 6) * 3.4) + '%)';
      ctx.beginPath();
      ctx.arc(bx + rr * Math.cos(a), by + rr * Math.sin(a), dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
