import { toGenome, toSeed, textToSeed, mulberry32 } from './hash.js';
import { GENES, readGene, decode, flipBit, crossover, toBinary } from './genome.js';
import { buildPlant } from './plant.js';
import { render } from './render.js';
import { SPECIES } from './species.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const errEl = document.getElementById('err');
const seedEl = document.getElementById('seed');
const summaryEl = document.getElementById('summary');
const GROW_MS = 2000;

let seed = 17;
let previousSeed = null;
let genome = toGenome(seed);
let traits = decode(genome);
let plant = buildPlant(traits, genome);
let changedGene = -1;
let note = '';
let startedAt = 0;
let frame = null;
let cssWidth = 1040;
let cssHeight = 720;

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssWidth = canvas.clientWidth || 1040;
  cssHeight = Math.round((cssWidth * 720) / 1040);
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.height = cssHeight + 'px';
}

function loop(now) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const progress = Math.min(1, (now - startedAt) / GROW_MS);
  render(ctx, cssWidth, cssHeight, plant, traits, progress, now * 0.0009);
  frame = requestAnimationFrame(loop);
}

function paintGenes() {
  const box = document.getElementById('genes');
  box.textContent = '';
  GENES.forEach((gene, index) => {
    const raw = readGene(genome, gene);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gene' + (index === changedGene ? ' changed' : '');
    button.title = 'bits ' + gene.bit + '–' + (gene.bit + gene.bits - 1) + ', click to flip one';

    const bits = document.createElement('div');
    bits.className = 'bits';
    bits.textContent = raw.toString(2).padStart(gene.bits, '0');

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = gene.label;

    const val = document.createElement('div');
    val.className = 'val';
    val.textContent = gene.format(gene.decode(raw, traits), traits);

    button.append(bits, name, val);
    button.addEventListener('click', function () {
      mutateBit(gene.bit + Math.floor(Math.random() * gene.bits), index);
    });
    box.appendChild(button);
  });
}

function label(key) {
  const gene = GENES.find(g => g.key === key);
  return gene.format(traits[key], traits);
}

function summarise() {
  const layerWord = traits.layers > 1 ? ' layers' : ' layer';
  return (note ? note + ' — ' : '') +
    label('species') +
    ', ' + label('form') +
    ', ' + traits.petalCount + ' petals × ' + traits.layers + layerWord +
    ', ' + traits.leaves + ' leaves' +
    ', ' + traits.mood + ' at ' + traits.hue + '°';
}

// Rewrite only the two species bits and invert the genome back into a seed.
// Every other gene survives, so the same plant reappears as another species.
const speciesRow = document.getElementById('species-row');
const speciesButtons = SPECIES.map(function (sp, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = sp.name;
  button.addEventListener('click', function () {
    changedGene = 0;
    note = '';
    show(toSeed(((genome & ~3) | index) >>> 0), true);
  });
  speciesRow.appendChild(button);
  return button;
});

function markSpecies() {
  speciesButtons.forEach(function (button, index) {
    button.classList.toggle('on', index === traits.species);
  });
}

function show(nextSeed, replay) {
  const value = nextSeed >>> 0;
  if (value !== seed) previousSeed = seed;
  seed = value;
  genome = toGenome(seed);
  traits = decode(genome);
  plant = buildPlant(traits, genome);

  seedEl.value = String(seed);
  document.getElementById('binary').textContent = toBinary(genome);
  summaryEl.textContent = summarise();
  paintGenes();
  markSpecies();

  const url = new URL(location.href);
  url.searchParams.set('seed', String(seed));
  history.replaceState(null, '', url);

  if (frame) cancelAnimationFrame(frame);
  startedAt = performance.now() - (replay ? 0 : GROW_MS);
  frame = requestAnimationFrame(loop);
}

function mutateBit(bit, geneIndex) {
  changedGene = geneIndex;
  note = '';
  show(toSeed(flipBit(genome, bit)), true);
}

function readSeedInput() {
  const text = seedEl.value.trim();
  if (text === '') {
    errEl.textContent = 'Enter a number or a word first.';
    return null;
  }
  errEl.textContent = '';
  if (/^\d+$/.test(text)) {
    const value = Number(text);
    if (value <= 4294967295) return value;
    errEl.textContent = 'Seeds run from 0 to 4294967295, so that one was hashed into range.';
  }
  return textToSeed(text);
}

document.getElementById('grow').addEventListener('click', function () {
  const value = readSeedInput();
  if (value === null) return;
  changedGene = -1;
  note = '';
  show(value, true);
});

seedEl.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') document.getElementById('grow').click();
});
seedEl.addEventListener('input', function () { errEl.textContent = ''; });

document.getElementById('random').addEventListener('click', function () {
  changedGene = -1;
  note = '';
  show(Math.floor(Math.random() * 4294967296), true);
});

document.getElementById('mutate').addEventListener('click', function () {
  const bit = Math.floor(Math.random() * 32);
  const index = GENES.findIndex(g => bit >= g.bit && bit < g.bit + g.bits);
  mutateBit(bit, index);
});

document.getElementById('breed').addEventListener('click', function () {
  if (previousSeed === null) {
    errEl.textContent = 'Grow a second flower first, then breed it with this one.';
    return;
  }
  errEl.textContent = '';
  const partner = previousSeed;
  const partnerGenome = toGenome(partner);
  const rng = mulberry32((genome ^ partnerGenome) >>> 0);
  const child = crossover(genome, partnerGenome, rng);
  changedGene = -1;
  note = 'crossed ' + seed + ' with ' + partner;
  show(toSeed(child), true);
});

document.getElementById('copy').addEventListener('click', function () {
  const href = location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(href).then(
      function () { errEl.textContent = 'Link copied.'; },
      function () { errEl.textContent = href; }
    );
  } else {
    errEl.textContent = href;
  }
});

document.getElementById('png').addEventListener('click', function () {
  const link = document.createElement('a');
  link.download = 'flower-' + seed + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

const themeButton = document.getElementById('theme');
function applyTheme(mode) {
  document.documentElement.dataset.theme = mode;
  themeButton.textContent = mode === 'dark' ? 'light' : 'dark';
}
themeButton.addEventListener('click', function () {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('flower-theme', next); } catch (e) {}
});
try {
  const saved = localStorage.getItem('flower-theme');
  if (saved === 'dark' || saved === 'light') applyTheme(saved);
} catch (e) {}

window.addEventListener('resize', sizeCanvas);

sizeCanvas();
const fromUrl = new URLSearchParams(location.search).get('seed');
show(fromUrl && /^\d+$/.test(fromUrl) ? Number(fromUrl) : 17, true);
