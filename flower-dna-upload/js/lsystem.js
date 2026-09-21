// A bracketed L-system with a turtle, following Lindenmayer and Prusinkiewicz,
// "The Algorithmic Beauty of Plants", chapters 1 and 2.
//
//   F  draw a segment forward        [  push turtle state
//   +  turn left                     ]  pop turtle state
//   -  turn right                    A  place a bloom here
//   &  begin a hanging raceme        R  raceme segment, carries a small bloom

export function expand(axiom, rules, depth) {
  let s = axiom;
  for (let i = 0; i < depth; i++) {
    let out = '';
    for (const ch of s) out += rules[ch] !== undefined ? rules[ch] : ch;
    s = out;
  }
  return s;
}

// Tropism: bend the heading toward a fixed direction by a fraction of the angle
// between them. Wisteria racemes hang because gravity is their tropism vector.
function bendToward(angle, target, amount) {
  let d = target - angle;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return angle + d * amount;
}

const DOWN = Math.PI / 2; // canvas y grows downward

export function turtle(word, opts) {
  const baseLen = opts.len;
  const turn = opts.angle;
  const curl = opts.curl;
  const decay = opts.decay;
  const taper = opts.taper;
  const droop = opts.droop;

  const segments = [];
  const blooms = [];
  const stack = [];

  let st = {
    x: 0, y: 0,
    angle: -Math.PI / 2,   // -90 degrees points up
    len: baseLen,
    width: opts.width,
    depth: 0,
    curl: curl,
    droop: 0,
    chain: 0,
    chainScale: 1,
    t: 0
  };

  const step = (isRaceme) => {
    if (st.droop > 0) st.angle = bendToward(st.angle, DOWN, st.droop);
    else st.angle += st.curl;
    const nx = st.x + Math.cos(st.angle) * st.len;
    const ny = st.y + Math.sin(st.angle) * st.len;
    const dt = st.len / baseLen;
    segments.push({
      x1: st.x, y1: st.y, x2: nx, y2: ny,
      width: st.width, depth: st.depth,
      raceme: isRaceme,
      t0: st.t, t1: st.t + dt
    });
    st.x = nx; st.y = ny; st.t += dt;
  };

  for (const ch of word) {
    if (ch === 'F') {
      step(false);
    } else if (ch === 'R') {
      step(true);
      // Flowers sit on alternating sides of the raceme, as they do on a real one.
      const side = st.chain % 2 === 0 ? 1 : -1;
      const off = st.len * 0.42 * side;
      blooms.push({
        x: st.x + Math.cos(st.angle + Math.PI / 2) * off,
        y: st.y + Math.sin(st.angle + Math.PI / 2) * off,
        angle: st.angle,
        scale: st.chainScale,
        depth: st.depth,
        t: st.t
      });
      st.chain += 1;
      st.chainScale *= 0.955;
      st.len *= 0.975;
    } else if (ch === '+') {
      st.angle -= turn;
      // A branch that has just turned keeps curling the way it turned, so side
      // shoots arc outward instead of crossing back over the trunk.
      st.curl = -Math.abs(curl) - 0.018;
    } else if (ch === '-') {
      st.angle += turn;
      st.curl = Math.abs(curl) + 0.018;
    } else if (ch === '&') {
      st.droop = droop;
      st.len = baseLen * 0.30;
      st.width = Math.max(1.2, st.width * 0.34);
      st.chain = 0;
      st.chainScale = 1;
    } else if (ch === '[') {
      stack.push(Object.assign({}, st));
      st.depth += 1;
      st.len *= decay;
      st.width *= taper;
    } else if (ch === ']') {
      st = stack.pop();
    } else if (ch === 'A') {
      blooms.push({
        x: st.x, y: st.y,
        angle: st.angle,
        scale: Math.pow(0.82, st.depth),
        depth: st.depth,
        t: st.t
      });
    }
  }

  let span = 0;
  for (const s of segments) span = Math.max(span, s.t1);
  for (const b of blooms) span = Math.max(span, b.t);
  if (span > 0) {
    for (const s of segments) { s.t0 /= span; s.t1 /= span; }
    for (const b of blooms) b.t /= span;
  }

  return { segments, blooms };
}
