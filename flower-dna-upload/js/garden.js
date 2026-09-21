import { toGenome } from './hash.js';
import { decode } from './genome.js';
import { buildPlant } from './plant.js';
import { render } from './render.js';

const PAGE = 48;
const CELL_W = 150;
const CELL_H = 150;

let start = Number(new URLSearchParams(location.search).get('from') || 1);
if (!isFinite(start) || start < 0) start = 1;

function paint() {
  const box = document.getElementById('garden');
  box.textContent = '';
  document.getElementById('range').textContent = 'seeds ' + start + ' to ' + (start + PAGE - 1);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  for (let i = 0; i < PAGE; i++) {
    const seed = (start + i) >>> 0;
    const genome = toGenome(seed);
    const traits = decode(genome);
    const plant = buildPlant(traits, genome);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';

    const canvas = document.createElement('canvas');
    canvas.width = CELL_W * dpr;
    canvas.height = CELL_H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(ctx, CELL_W, CELL_H, plant, traits, 1, 0);

    const label = document.createElement('span');
    label.className = 'seed';
    label.textContent = String(seed);

    cell.append(canvas, label);
    cell.addEventListener('click', function () {
      location.href = 'index.html?seed=' + seed;
    });
    box.appendChild(cell);
  }

  const url = new URL(location.href);
  url.searchParams.set('from', String(start));
  history.replaceState(null, '', url);
}

document.getElementById('next').addEventListener('click', function () {
  start += PAGE;
  paint();
});
document.getElementById('prev').addEventListener('click', function () {
  start = Math.max(0, start - PAGE);
  paint();
});

try {
  const saved = localStorage.getItem('flower-theme');
  if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
} catch (e) {}

paint();
