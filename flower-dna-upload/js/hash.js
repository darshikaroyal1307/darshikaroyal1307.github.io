// Invertible 32-bit bijection (the MurmurHash3 finalizer and its exact inverse).
// Every seed maps to one genome, and every genome maps back to one seed.
// That two-way property is what lets a mutated genome be reported as a real seed.

export function toGenome(seed) {
  let n = seed >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x85ebca6b) >>> 0;
  n ^= n >>> 13;
  n = Math.imul(n, 0xc2b2ae35) >>> 0;
  n ^= n >>> 16;
  return n >>> 0;
}

export function toSeed(genome) {
  let h = genome >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7ed1b41d) >>> 0;
  h ^= (h >>> 13) ^ (h >>> 26);
  h = Math.imul(h, 0xa5cb9243) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

// FNV-1a, so a name or a word can be used as a seed instead of a number.
export function textToSeed(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// Deterministic PRNG for placement jitter. Never Math.random in the draw path,
// or the same seed would grow a different plant on every reload.
export function mulberry32(a) {
  let t = a >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
