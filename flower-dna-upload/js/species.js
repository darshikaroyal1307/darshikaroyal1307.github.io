// Four growth archetypes. The species gene picks one, and the form gene picks a
// production rule inside it. A species does not add new genes: it changes how the
// turtle and the palette read the ones that are already there.
//
//   len       first segment length           decay     length factor per branch level
//   width     first stroke width             taper     width factor per branch level
//   angle     turn for + and -               bloom     bloom radius multiplier
//   droop     downward tropism on a raceme   coreRatio seed head size inside a bloom
//   petals    petal counts this species uses, or null for the shared table
//   hueArc    [start, span] arc of the colour wheel the 6-bit hue gene maps onto
//   coreMode  'offset' rotates the core away from the petals, 'absolute' pins it
//   coreHues  the four values the core tint gene chooses between

export const SPECIES = [
  {
    name: 'daisy',
    formLabels: ['1 bloom', '2 blooms', '3 blooms', '5 blooms'],
    forms: [
      { axiom: 'FFFFFFA', rule: null,                                  depth: 0, bloom: 1.00 },
      { axiom: 'FFFFA',   rule: 'F[+FFFA]FFA',                         depth: 1, bloom: 0.78 },
      { axiom: 'FFFFA',   rule: 'F[+FFFA]F[-FFFA]FA',                  depth: 1, bloom: 0.68 },
      { axiom: 'FFFA',    rule: 'F[++FFFA][--FFFA]FF[+FFA][-FFA]FA',   depth: 1, bloom: 0.52 }
    ],
    len: 58, width: 7.5, angle: 0.46, decay: 0.78, taper: 0.62, droop: 0,
    stem: 'hsl(122, 32%, 34%)', leafHue: 124, leafScale: 1.0, leafMult: 1, leafDepth: 0,
    coreRatio: 0.30, petals: null, widthFloor: 0, tipCap: 1,
    // The wildflower keeps the whole wheel. Everything else is held to its own arc.
    hueArc: [0, 359], coreMode: 'offset', coreHues: [150, 182, 205, 32]
  },

  {
    name: 'cherry',
    formLabels: ['young twig', 'full spray', 'leaning spray', 'old branch'],
    forms: [
      { axiom: 'FFA', rule: 'F[+FA][-FA]FA',      depth: 2, bloom: 0.34 },
      { axiom: 'FFA', rule: 'F[+FA][-FA]FA',      depth: 3, bloom: 0.24 },
      { axiom: 'FFA', rule: 'F[++FA][-FA]FA',     depth: 3, bloom: 0.22 },
      { axiom: 'FA',  rule: 'FF[+FA][-FA]F[+FA]A', depth: 3, bloom: 0.19 }
    ],
    len: 66, width: 10, angle: 0.44, decay: 0.70, taper: 0.56, droop: 0,
    stem: 'hsl(20, 22%, 33%)', leafHue: 118, leafScale: 0.5, leafMult: 3, leafDepth: 2,
    coreRatio: 0.20, petals: [5, 5, 8, 5], widthFloor: 0.62, tipCap: 0.35,
    // Magenta through rose to pale blush, with gold stamens. The arc stops at 346
    // and never reaches red: a blossom at 356 draws a vermilion star, not a flower.
    hueArc: [316, 30], coreMode: 'absolute', coreHues: [50, 43, 56, 37]
  },

  {
    name: 'wisteria',
    formLabels: ['two racemes', 'four racemes', 'six racemes', 'full cascade'],
    forms: [
      { axiom: 'FFFFFA', rule: 'F[+W]FF[-W]FA',          depth: 1, chain: 10, bloom: 0.17 },
      { axiom: 'FFFFA',  rule: 'F[+W]FF[-W]FA',          depth: 2, chain: 12, bloom: 0.15 },
      { axiom: 'FFFFA',  rule: 'F[+W]F[-W]F[+W]FA',      depth: 2, chain: 13, bloom: 0.14 },
      { axiom: 'FFFA',   rule: 'F[+W][-W]FF[+W][-W]FA',  depth: 2, chain: 15, bloom: 0.12 }
    ],
    len: 60, width: 8, angle: 0.74, decay: 0.76, taper: 0.60, droop: 0.42,
    stem: 'hsl(96, 26%, 32%)', leafHue: 112, leafScale: 0.7, leafMult: 2, leafDepth: 1,
    coreRatio: 0.18, petals: [5, 5, 5, 8], widthFloor: 0.58, tipCap: 0.40,
    // Blue-violet through lilac to mauve, each floret with a pale yellow eye.
    hueArc: [238, 66], coreMode: 'absolute', coreHues: [48, 54, 43, 58]
  },

  {
    name: 'sunflower',
    formLabels: ['tall', 'giant', 'two heads', 'three heads'],
    forms: [
      { axiom: 'FFFFFFFFA', rule: null,                          depth: 0, bloom: 1.45 },
      { axiom: 'FFFFFFFA',  rule: null,                          depth: 0, bloom: 1.65 },
      { axiom: 'FFFFFFA',   rule: 'F[+FFFFFFFA]FFFA',            depth: 1, bloom: 0.72 },
      { axiom: 'FFFFFFFA',  rule: 'F[+FFFFFFA]F[-FFFFFFA]FFA',   depth: 1, bloom: 0.56 }
    ],
    len: 56, width: 12, angle: 0.40, decay: 0.82, taper: 0.70, droop: 0,
    stem: 'hsl(104, 30%, 31%)', leafHue: 108, leafScale: 1.55, leafMult: 1, leafDepth: 0,
    coreRatio: 0.46, petals: [13, 21, 21, 34], widthFloor: 0, tipCap: 1,
    // Rust and amber through gold to lemon, over the dark brown seed head.
    hueArc: [16, 48], coreMode: 'absolute', coreHues: [28, 22, 33, 18]
  }
];
