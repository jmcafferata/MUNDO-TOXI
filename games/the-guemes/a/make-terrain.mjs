// Builds the terrain of the L-shaped map once, and saves it so it never changes:
//   terrain.png   height map, 8-bit grey, one pixel per 0.5 m in the map's own frame (u right, v down)
//                 height in metres = pixel / 40 - 5   (so the range is -5 m .. +1.375 m)
//   terrain.json  the numbers that describe it (resolution, encoding, the features)
// and pastes the same image into index.html (between the TERRAIN markers) so the game stays a single file.
// Run with:  node make-terrain.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const LONG = 250, HALF = LONG / 2, RES = 0.5, N = LONG / RES + 1;       // 501 x 501 samples
const SEED = 20261121;
const M_PER_LEVEL = 1 / 40, ZERO_LEVEL = 200;                            // metres = (level - 200) / 40

// features, in the map's own frame: u along the long north-west side, v from that side inwards is 250 - v
const LAGOON = { u: HALF, v: LONG - 30, r: 22.5 };    // 45 m across, centre 30 m in from the middle of the north-west long side
const ISLAND_R = 7.5;                                 // 15 m across, in the middle of the lagoon
const LAGOON_BOTTOM = -4, WATER = -2, ISLAND_TOP = 0.8;
const HILL = { u: 0, v: 0, r: 3, top: 1 };            // east corner of the map: 6 m across, 1 m above the ground around it
const PAD = { u: Math.SQRT1_2, v: Math.SQRT1_2, r: 1 };   // helipad 1 m in from the corner, along the corner's bisector

// --- smooth random bumps, fixed seed, kept between 0 and 0.6 m so the land is "mostly flat"
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(SEED);
const lattice = (size) => { const n = Math.ceil(LONG / size) + 2, g = []; for (let i = 0; i < n * n; i++) g.push(rnd()); return { size, n, g }; };
const octaves = [[40, 0.5], [20, 0.3], [8, 0.2]].map(([size, amp]) => ({ ...lattice(size), amp }));
const smooth = t => t * t * (3 - 2 * t);
function valueNoise(L, u, v) {
  const x = u / L.size, y = v / L.size, x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
  const at = (i, j) => L.g[j * L.n + i];
  const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx, b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
  return a + (b - a) * fy;
}
function base(u, v) { let s = 0; for (const o of octaves) s += o.amp * valueNoise(o, u, v); return s * 0.6; }   // 0 .. 0.6 m

function height(u, v) {
  let h = base(u, v);
  // lagoon and island
  const d = Math.hypot(u - LAGOON.u, v - LAGOON.v);
  if (d < LAGOON.r + 3) {
    let w;
    if (d < ISLAND_R) { const t = 1 - d / ISLAND_R; w = WATER + (ISLAND_TOP - WATER) * t * (2 - t); }          // island: water line at its shore, rising to a rounded top
    else if (d < LAGOON.r) w = WATER + (LAGOON_BOTTOM - WATER) * Math.sin(Math.PI * (d - ISLAND_R) / (LAGOON.r - ISLAND_R)); // ring of water, deepest in the middle
    else { const t = (d - LAGOON.r) / 3; w = WATER + (h - WATER) * t * (2 - t); }                                // shore: climbs back to the land over 3 m
    h = Math.min(h, w);
  }
  // the corner hill: 1 m above the surrounding ground
  const dh = Math.hypot(u - HILL.u, v - HILL.v);
  if (dh < HILL.r) h += HILL.top * smooth(1 - dh / HILL.r);
  return h;
}

const px = new Uint8Array(N * N);
let lo = Infinity, hi = -Infinity;
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const h = height(i * RES, j * RES); lo = Math.min(lo, h); hi = Math.max(hi, h);
  px[j * N + i] = Math.max(0, Math.min(255, Math.round(ZERO_LEVEL + h / M_PER_LEVEL)));
}

// --- PNG writer (8-bit greyscale)
const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcTable[(c ^ x) & 255] ^ c >>> 8; return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const t = Buffer.from(type), len = Buffer.alloc(4), c = Buffer.alloc(4); len.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, c]); };
const raw = Buffer.alloc((N + 1) * N);
for (let j = 0; j < N; j++) { raw[j * (N + 1)] = 0; raw.set(px.subarray(j * N, (j + 1) * N), j * (N + 1) + 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
writeFileSync("terrain.png", png);

const meta = { side: LONG, resolution: RES, samples: N, frame: "u, v in metres in the map's own frame, measured from the east corner (the hill); the north-west long side is the line v = 250, the other long side is u = 0",
  height_m: "(pixel - " + ZERO_LEVEL + ") / 40", water_level_m: WATER, seed: SEED, min_m: +lo.toFixed(3), max_m: +hi.toFixed(3),
  lagoon: { u: LAGOON.u, v: LAGOON.v, diameter: LAGOON.r * 2, bottom_m: LAGOON_BOTTOM }, island: { diameter: ISLAND_R * 2, top_m: ISLAND_TOP },
  hill: { u: HILL.u, v: HILL.v, diameter: HILL.r * 2, top_m: HILL.top }, helipad: { u: PAD.u, v: PAD.v, diameter: PAD.r * 2 } };
writeFileSync("terrain.json", JSON.stringify(meta, null, 1) + "\n");

// --- paste into the game
const tag = "data:image/png;base64," + png.toString("base64");
const html = readFileSync("index.html", "utf8");
const a = html.indexOf("/*TERRAIN*/"), b = html.indexOf("/*END-TERRAIN*/");
if (a < 0 || b < 0) throw new Error("TERRAIN markers not found in index.html");
writeFileSync("index.html", html.slice(0, a) + '/*TERRAIN*/"' + tag + '"' + html.slice(b));
console.log("terrain.png " + png.length + " bytes, " + N + "x" + N + ", heights " + lo.toFixed(2) + " .. " + hi.toFixed(2) + " m; pasted into index.html");
