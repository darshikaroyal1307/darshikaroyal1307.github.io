# Flower DNA

Every plant on this site is one 32-bit number. Type a seed, and it grows.
There are no flower images anywhere in the repository.

**Live:** https://darshikaroyal1307.github.io/flower-dna-upload/

Once it is live, try `?seed=1` for a sunflower, `?seed=5` for cherry blossom and
`?seed=2` for wisteria, then open `garden.html` to see forty-eight seeds at once.

---

## The idea

A seed is not a random number generator. It is a genome.

The seed passes through a bijective 32-bit hash, and the resulting word is sliced into
thirteen genes. Two bits choose the species, six bits choose the hue, three bits bend the
stem. Nothing is thrown away and no bit is inert: all 32 bits are spoken for, so flipping
any single bit changes exactly one visible trait.

Because the hash is invertible, this works in both directions. Flip a bit in the genome and
the site computes the seed that produces the mutated plant. Mutation is a real operation on
a number you can copy, share and type back in.

## The math

Four ideas from Prusinkiewicz and Lindenmayer, *The Algorithmic Beauty of Plants*.

**L-systems.** The stem is not a drawn curve. It is a string rewritten by a production rule
and then walked by a turtle. `F` draws a segment, `+` and `-` turn, brackets push and pop
turtle state, `A` marks where a bloom opens, and `R` is a raceme link carrying a floret. A
branch inherits a shorter step and a thinner stroke, and keeps curling the way it turned, so
side shoots arc outward instead of crossing back over the trunk.

The species gene picks a rule set and the form gene picks a rule inside it:

| Species | Example rule | Depth | Silhouette |
|---|---|---|---|
| daisy | `A → F[+FFFA]F[-FFFA]FA` | 1 | upright herb, 1 to 5 heads |
| cherry | `A → F[+FA][-FA]FA` | 3 | woody spray, 27 small blossoms |
| wisteria | `A → F[+W]F[-W]FA` then `W → FF&RRRRRRRRRRRRR` | 2 | hanging racemes |
| sunflower | `A → F[+FFFFFFA]F[-FFFFFFA]FFA` | 1 | one to three giant heads |

Wisteria expands in two stages. The recursive pass places raceme markers along the vine, and
a single terminal pass turns each marker into a chain of florets.

**Tropism.** Wisteria racemes hang because `&` switches on a downward tropism: every segment
after it bends its heading toward gravity by a fixed fraction of the angle between them. The
chain leaves the vine sideways, curves under, then straightens as it falls. Florets alternate
sides and taper toward the tip, the way they do on a real raceme.

**Phyllotaxis.** Seed `i` in a flower core sits at angle `i × 137.5°` and radius `c × √i`.
The golden angle is the only rotation that never repeats, which is why sunflower heads pack
without gaps. One loop, no collision detection.

**Growth over time.** Every segment, leaf and bloom carries a birth time measured along its
own branch. The animation reveals them in that order, so the trunk rises, leaves unfold as
the stem passes them, and blooms open last. A low-frequency sine displaces each point in
proportion to its height above the ground for a continuous sway.

## The genome

Thirteen genes across exactly 32 bits.

| Bits | Gene | Range |
|---|---|---|
| 0–1 | species | daisy, cherry, wisteria, sunflower |
| 2–3 | form | one of four production rules for that species |
| 4–9 | hue | an arc of the wheel chosen by the species |
| 10–11 | palette | vivid, soft, deep, pastel |
| 12–13 | petal count | 5, 8, 13, 21, or the species table |
| 14–15 | petal layers | 1 to 3 |
| 16–18 | petal width | 30% to 88% |
| 19–21 | petal tip | round to sharp |
| 22–24 | stem curl | −100% to +100% |
| 25–26 | leaves | 2 to 5 |
| 27–28 | core density | 48 to 252 seeds |
| 29–30 | core tint | seed head colour, per species |
| 31 | petal notch | round or notched |

A species never adds genes. It reinterprets the ones already there. Cherry reads the petal
gene as 5 or 8 and holds its petals round, because a twelve-pixel blossom drawn at the
narrowest petal setting reads as a spike rather than a flower. Sunflower reads the same gene
as 13 to 34 and lets its rays stay sharp.

The species buttons rewrite bits 0 and 1 alone and invert the genome back into a seed, so
the same plant reappears as another species with every other trait intact.

Breeding is uniform crossover at gene boundaries, so a child never inherits half a petal
count. The child genome is inverted back into a seed like any other.

## Colour

The hue gene still spans all 64 of its values. The species decides which arc of the colour
wheel those values land on, so a cherry cannot come out green and a sunflower cannot come
out blue.

| Species | Hue arc | Reads as |
|---|---|---|
| daisy | 0° to 359° | the wildflower, anything goes |
| cherry | 316° to 346° | magenta through rose to pale blush |
| wisteria | 238° to 304° | blue-violet through lilac to mauve |
| sunflower | 16° to 64° | rust and amber through gold to lemon |

The cherry arc deliberately stops at 346 and never reaches red. A blossom drawn at 356 with a
vivid palette reads as a vermilion star rather than a flower.

The core tint gene works the same way. A daisy rotates its seed head away from its petals,
which keeps the contrast whatever hue it drew. The other three pin theirs to a botanical
colour: gold stamens on cherry and wisteria, a dark brown seed head on sunflower.

## Determinism

`Math.random` never appears in the draw path. All placement jitter comes from a mulberry32
generator keyed on the genome, so a seed produces a pixel-identical plant on every machine
and every reload. That is what makes a shared link mean something.

Blooms below about 26 pixels drop to a single petal layer and a solid centre, which keeps a
27-blossom cherry spray at 60fps without changing what a large bloom looks like.

## Running it

ES modules need HTTP, so opening `index.html` from the filesystem will not work.

```bash
node serve.js
```

Then open http://localhost:5173. There are no dependencies and no build step.

## Layout

```
index.html      seed input, canvas, genome strip
garden.html     grid of consecutive seeds
js/hash.js      32-bit bijection, its inverse, and the seeded PRNG
js/genome.js    the gene table, decoding, mutation, crossover
js/species.js   four growth archetypes and their production rules
js/lsystem.js   string rewriting, the turtle, and gravity tropism
js/plant.js     rule selection, leaf placement, bounding box
js/render.js    canvas drawing and growth timing
js/app.js       UI, URL state, PNG export
```

## Licence

MIT.
