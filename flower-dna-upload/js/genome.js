import { SPECIES } from './species.js';

// The 32 bits of a genome, sliced into thirteen genes.
// Bit ranges are contiguous and cover the word exactly, so no bit is inert:
// flipping any one of the 32 changes exactly one visible trait.
//
// decode() and format() both receive the traits decoded so far. The species gene
// sits at bit 0 and is therefore always resolved first, which is what lets the
// later genes read themselves differently per species.

const mod360 = v => ((v % 360) + 360) % 360;

export const GENES = [
  { key: 'species', bit: 0,  bits: 2, label: 'species',
    decode: v => v,
    format: v => SPECIES[v].name },

  { key: 'form',    bit: 2,  bits: 2, label: 'form',
    decode: v => v,
    format: (v, t) => SPECIES[t.species].formLabels[v] },

  // The gene still spans all 64 of its values. The species decides which arc of
  // the colour wheel those values land on, so a cherry cannot come out green.
  { key: 'hue',     bit: 4,  bits: 6, label: 'hue',
    decode: (v, t) => {
      const arc = SPECIES[t.species].hueArc;
      return Math.round(mod360(arc[0] + (v / 63) * arc[1]));
    },
    format: v => v + '°' },

  { key: 'mood',    bit: 10, bits: 2, label: 'palette',
    decode: v => ['vivid', 'soft', 'deep', 'pastel'][v],
    format: v => v },

  { key: 'petals',  bit: 12, bits: 2, label: 'petal count',
    decode: v => v,
    format: (v, t) => String((SPECIES[t.species].petals || [5, 8, 13, 21])[v]) },

  { key: 'layers',  bit: 14, bits: 2, label: 'petal layers',
    decode: v => [1, 2, 2, 3][v],
    format: v => String(v) },

  { key: 'width',   bit: 16, bits: 3, label: 'petal width',
    decode: v => 0.30 + (v / 7) * 0.58,
    format: v => Math.round(v * 100) + '%' },

  { key: 'tip',     bit: 19, bits: 3, label: 'petal tip',
    decode: v => v / 7,
    format: v => Math.round(v * 100) + '%' },

  { key: 'curl',    bit: 22, bits: 3, label: 'stem curl',
    decode: v => ((v / 7) * 2 - 1) * 0.055,
    format: v => (v > 0 ? '+' : '') + Math.round((v / 0.055) * 100) + '%' },

  { key: 'leaves',  bit: 25, bits: 2, label: 'leaves',
    decode: v => [2, 3, 4, 5][v],
    format: v => String(v) },

  { key: 'core',    bit: 27, bits: 2, label: 'core density',
    decode: v => [48, 108, 176, 252][v],
    format: v => v + ' seeds' },

  // Resolves to the absolute hue of the seed head. The daisy rotates its core
  // away from its petals; the others pin theirs to a botanical colour.
  { key: 'coreHue', bit: 29, bits: 2, label: 'core tint',
    decode: (v, t) => {
      const sp = SPECIES[t.species];
      const value = sp.coreHues[v];
      return sp.coreMode === 'absolute' ? value : mod360(t.hue + value);
    },
    format: v => v + '°' },

  { key: 'notch',   bit: 31, bits: 1, label: 'petal notch',
    decode: v => v === 1,
    format: v => (v ? 'notched' : 'round') }
];

export function readGene(genome, gene) {
  return (genome >>> gene.bit) & ((1 << gene.bits) - 1);
}

export function decode(genome) {
  const traits = {};
  for (const g of GENES) traits[g.key] = g.decode(readGene(genome, g), traits);
  const table = SPECIES[traits.species].petals || [5, 8, 13, 21];
  traits.petalCount = table[traits.petals];
  return traits;
}

export function flipBit(genome, bit) {
  return (genome ^ (1 << bit)) >>> 0;
}

// Uniform crossover: each gene is taken whole from one parent or the other,
// so a child never inherits half a petal count.
export function crossover(genomeA, genomeB, rng) {
  let child = 0;
  for (const g of GENES) {
    const mask = (((1 << g.bits) - 1) << g.bit) >>> 0;
    child = (child | ((rng() < 0.5 ? genomeA : genomeB) & mask)) >>> 0;
  }
  return child >>> 0;
}

export function toBinary(genome) {
  return (genome >>> 0).toString(2).padStart(32, '0');
}
