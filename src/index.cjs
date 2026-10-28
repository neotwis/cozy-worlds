"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BUILTIN_BIOMES: () => BUILTIN_BIOMES,
  BiomeRegistry: () => BiomeRegistry,
  CozyWorld: () => CozyWorld,
  CozyWorldError: () => CozyWorldError,
  DEFAULT_TERRAIN: () => DEFAULT_TERRAIN,
  Noise2D: () => Noise2D,
  SeededRandom: () => SeededRandom,
  WaterKind: () => WaterKind,
  createWorld: () => createWorld,
  generateWeather: () => generateWeather,
  getDayNight: () => getDayNight,
  getSeason: () => getSeason,
  hashSeed: () => hashSeed,
  resolveOptions: () => resolveOptions,
  selectBiome: () => selectBiome,
  toHeightmapMesh: () => toHeightmapMesh,
  toImageData: () => toImageData,
  validateBiome: () => validateBiome
});
module.exports = __toCommonJS(index_exports);

// src/core/random.ts
function hashSeed(seed) {
  const s = typeof seed === "number" ? `#n:${seed}` : `#s:${seed}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
var SeededRandom = class _SeededRandom {
  /** The 32-bit state this generator was created with. */
  initialState;
  state;
  constructor(seed) {
    this.initialState = hashSeed(seed);
    this.state = this.initialState;
  }
  /** Float in [0, 1). */
  next() {
    this.state = this.state + 1831565813 >>> 0;
    let t = this.state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  /** Float in [min, max). */
  float(min = 0, max = 1) {
    return min + (max - min) * this.next();
  }
  /** Integer in [min, max] (inclusive). */
  int(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError("SeededRandom.int: bounds must be finite numbers");
    }
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  /** True with probability p. */
  chance(p) {
    return this.next() < p;
  }
  /** Uniformly pick an element. Throws on an empty array. */
  pick(items) {
    if (items.length === 0) throw new RangeError("SeededRandom.pick: empty array");
    return items[Math.floor(this.next() * items.length)];
  }
  /** Pick by weight. Entries with weight <= 0 are never chosen. */
  weighted(entries) {
    let total = 0;
    for (const e of entries) if (e.weight > 0) total += e.weight;
    if (total <= 0) throw new RangeError("SeededRandom.weighted: no positive weights");
    let roll = this.next() * total;
    for (const e of entries) {
      if (e.weight <= 0) continue;
      roll -= e.weight;
      if (roll < 0) return e.value;
    }
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      if (e.weight > 0) return e.value;
    }
    throw new RangeError("SeededRandom.weighted: unreachable");
  }
  /** Fisher–Yates shuffle, returns a new array. */
  shuffle(items) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }
  /** Short hex id (8 chars per 32 bits). */
  id(prefix = "", words = 2) {
    let s = "";
    for (let i = 0; i < words; i++) {
      s += Math.floor(this.next() * 4294967296).toString(16).padStart(8, "0");
    }
    return prefix ? `${prefix}_${s}` : s;
  }
  /**
   * Create an independent stream derived from this generator's initial seed.
   * Forking does not consume values from the parent, so streams stay stable
   * when other streams are used more or less.
   */
  fork(name) {
    return new _SeededRandom(`${this.initialState}:${name}`);
  }
};

// src/core/validation.ts
var CozyWorldError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "CozyWorldError";
    this.code = code;
  }
};
function assertInteger(name, value, min, max) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be an integer, received ${String(value)}`);
  }
  if (value < min || value > max) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be between ${min} and ${max}, received ${value}`);
  }
  return value;
}
function assertNumber(name, value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be a finite number, received ${String(value)}`);
  }
  if (value < min || value > max) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be between ${min} and ${max}, received ${value}`);
  }
  return value;
}
function assertBoolean(name, value) {
  if (typeof value !== "boolean") {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be a boolean, received ${String(value)}`);
  }
  return value;
}
function assertRange(name, value) {
  if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "number" || typeof value[1] !== "number" || !Number.isFinite(value[0]) || !Number.isFinite(value[1]) || value[0] > value[1]) {
    throw new CozyWorldError("INVALID_BIOME", `"${name}" must be a [min, max] tuple of finite numbers with min <= max`);
  }
  return [value[0], value[1]];
}

// src/core/options.ts
var DEFAULT_TERRAIN = {
  scale: 3,
  octaves: 5,
  persistence: 0.5,
  lacunarity: 2,
  seaLevel: 0.38,
  island: true,
  islandFalloff: 1.2,
  mountainIntensity: 0.35,
  redistribution: 1.15,
  riverCount: 4,
  lakeCount: 3,
  heightScale: 24,
  maxTraversableSlope: 0.06
};
var MAX_DIMENSION = 4096;
var DEFAULT_MAX_CELLS = 2048 * 2048;
function resolveOptions(input = {}) {
  if (input === null || typeof input !== "object") {
    throw new CozyWorldError("INVALID_OPTION", "Options must be an object");
  }
  const seed = input.seed ?? "cozy";
  if (typeof seed !== "string" && !(typeof seed === "number" && Number.isFinite(seed))) {
    throw new CozyWorldError("INVALID_OPTION", '"seed" must be a string or finite number');
  }
  const size = input.size ?? 128;
  assertInteger("size", size, 1, MAX_DIMENSION);
  const width = assertInteger("width", input.width ?? size, 1, MAX_DIMENSION);
  const height = assertInteger("height", input.height ?? size, 1, MAX_DIMENSION);
  const maxCells = assertInteger("maxCells", input.maxCells ?? DEFAULT_MAX_CELLS, 1, MAX_DIMENSION * MAX_DIMENSION);
  if (width * height > maxCells) {
    throw new CozyWorldError(
      "WORLD_TOO_LARGE",
      `World of ${width}x${height} (${width * height} cells) exceeds maxCells=${maxCells}. Each cell uses ~19 bytes; raise maxCells explicitly if you accept the memory cost.`
    );
  }
  const dimension = input.dimension ?? "2d";
  if (dimension !== "2d" && dimension !== "3d") {
    throw new CozyWorldError("INVALID_OPTION", '"dimension" must be "2d" or "3d"');
  }
  let biomes = null;
  if (input.biomes !== void 0) {
    if (!Array.isArray(input.biomes) || input.biomes.length === 0 || input.biomes.some((b) => typeof b !== "string")) {
      throw new CozyWorldError("INVALID_OPTION", '"biomes" must be a non-empty array of biome ids');
    }
    biomes = [...new Set(input.biomes)];
  }
  const t = { ...DEFAULT_TERRAIN, ...input.terrain ?? {} };
  assertNumber("terrain.scale", t.scale, 0.01, 1e3);
  assertInteger("terrain.octaves", t.octaves, 1, 12);
  assertNumber("terrain.persistence", t.persistence, 0, 1);
  assertNumber("terrain.lacunarity", t.lacunarity, 1, 4);
  assertNumber("terrain.seaLevel", t.seaLevel, 0, 1);
  assertBoolean("terrain.island", t.island);
  assertNumber("terrain.islandFalloff", t.islandFalloff, 0, 3);
  assertNumber("terrain.mountainIntensity", t.mountainIntensity, 0, 1);
  assertNumber("terrain.redistribution", t.redistribution, 0.1, 5);
  assertInteger("terrain.riverCount", t.riverCount, 0, 1e3);
  assertInteger("terrain.lakeCount", t.lakeCount, 0, 1e3);
  assertNumber("terrain.heightScale", t.heightScale, 0, 1e5);
  assertNumber("terrain.maxTraversableSlope", t.maxTraversableSlope, 0, 1);
  const dayOfYear = assertInteger("time.dayOfYear", input.time?.dayOfYear ?? 100, 0, 364);
  const hour = assertNumber("time.hour", input.time?.hour ?? 10, 0, 24);
  return {
    seed,
    width,
    height,
    dimension,
    biomes,
    weather: assertBoolean("weather", input.weather ?? true),
    dayNightCycle: assertBoolean("dayNightCycle", input.dayNightCycle ?? true),
    terrain: t,
    time: { dayOfYear, hour },
    latitude: assertNumber("latitude", input.latitude ?? 45, -80, 80),
    vegetationDensity: assertNumber("vegetationDensity", input.vegetationDensity ?? 1, 0, 5),
    maxFeatures: assertInteger("maxFeatures", input.maxFeatures ?? 5e4, 0, 1e7),
    maxCells
  };
}

// src/biomes/builtin.ts
var BUILTIN_BIOMES = [
  {
    id: "lake",
    name: "Lake",
    temperature: [0.15, 1],
    moisture: [0, 1],
    elevation: [0, 1],
    aquatic: true,
    vegetation: [
      { type: "lily_pad", density: 0.05 },
      { type: "reeds", density: 0.03 }
    ],
    resources: ["fresh_water", "clay", "river_stone"],
    wildlife: ["duck", "frog", "heron", "otter"],
    weather: { sunny: 4, cloudy: 3, rainy: 2, foggy: 3, stormy: 1 },
    color: [74, 140, 196],
    description: "Calm water with reeds and drifting lily pads."
  },
  {
    id: "beach",
    name: "Beach",
    temperature: [0.3, 1],
    moisture: [0, 1],
    elevation: [0, 0.05],
    priority: 2,
    vegetation: [
      { type: "palm_tree", density: 0.02 },
      { type: "driftwood", density: 0.03 },
      { type: "seashell_pile", density: 0.02 }
    ],
    resources: ["sand", "seashell", "sea_glass", "driftwood"],
    wildlife: ["crab", "seagull", "turtle"],
    weather: { sunny: 6, cloudy: 2, rainy: 1, stormy: 1, foggy: 1 },
    color: [233, 215, 160]
  },
  {
    id: "grassland",
    name: "Grassland",
    temperature: [0.35, 0.75],
    moisture: [0.25, 0.6],
    elevation: [0.05, 0.55],
    vegetation: [
      { type: "wildflowers", density: 0.06 },
      { type: "tall_grass", density: 0.08 },
      { type: "lone_oak", density: 0.01 },
      { type: "boulder", density: 5e-3 }
    ],
    resources: ["herbs", "wildflower", "honey", "fiber"],
    wildlife: ["rabbit", "butterfly", "sheep", "meadowlark"],
    weather: { sunny: 5, cloudy: 3, rainy: 2, stormy: 1, foggy: 1 },
    color: [134, 186, 92]
  },
  {
    id: "forest",
    name: "Forest",
    temperature: [0.3, 0.7],
    moisture: [0.55, 1],
    elevation: [0.05, 0.65],
    vegetation: [
      { type: "oak_tree", density: 0.12 },
      { type: "pine_tree", density: 0.08 },
      { type: "mushroom_ring", density: 0.01 },
      { type: "berry_bush", density: 0.03 },
      { type: "fallen_log", density: 0.01 }
    ],
    resources: ["wood", "mushroom", "berries", "acorn", "moss"],
    wildlife: ["deer", "fox", "owl", "squirrel", "hedgehog"],
    weather: { sunny: 3, cloudy: 3, rainy: 3, foggy: 3, stormy: 1 },
    color: [52, 120, 64]
  },
  {
    id: "desert",
    name: "Desert",
    temperature: [0.72, 1],
    moisture: [0, 0.3],
    elevation: [0.03, 0.7],
    vegetation: [
      { type: "cactus", density: 0.03 },
      { type: "dry_shrub", density: 0.02 },
      { type: "sandstone_rock", density: 0.01 }
    ],
    resources: ["sand", "cactus_fruit", "amber", "sandstone"],
    wildlife: ["lizard", "fennec_fox", "beetle", "hawk"],
    weather: { sunny: 9, cloudy: 1, stormy: 0.5 },
    color: [222, 190, 120]
  },
  {
    id: "snowfield",
    name: "Snowfield",
    temperature: [0, 0.25],
    moisture: [0.1, 1],
    elevation: [0.03, 0.8],
    vegetation: [
      { type: "snowy_pine", density: 0.04 },
      { type: "ice_crystal", density: 0.01 },
      { type: "snow_drift", density: 0.03 }
    ],
    resources: ["ice", "snow_berries", "frost_flower", "pine_cone"],
    wildlife: ["snow_hare", "arctic_fox", "snowy_owl", "reindeer"],
    weather: { snowy: 5, cloudy: 3, sunny: 2, foggy: 2, stormy: 1 },
    color: [236, 242, 248]
  },
  {
    id: "swamp",
    name: "Swamp",
    temperature: [0.4, 0.9],
    moisture: [0.75, 1],
    elevation: [0.02, 0.22],
    priority: 1,
    vegetation: [
      { type: "willow_tree", density: 0.05 },
      { type: "cattail", density: 0.06 },
      { type: "glowshroom", density: 0.015 }
    ],
    resources: ["peat", "bog_herb", "firefly_jar", "mud"],
    wildlife: ["toad", "dragonfly", "heron", "firefly"],
    weather: { foggy: 5, rainy: 4, cloudy: 3, stormy: 1, sunny: 1 },
    color: [92, 110, 72]
  },
  {
    id: "mountain",
    name: "Mountain",
    temperature: [0, 1],
    moisture: [0, 1],
    elevation: [0.7, 1],
    priority: 1,
    vegetation: [
      { type: "alpine_flower", density: 0.02 },
      { type: "boulder", density: 0.04 },
      { type: "crystal_outcrop", density: 5e-3 }
    ],
    resources: ["stone", "iron_ore", "crystal", "alpine_herb"],
    wildlife: ["mountain_goat", "eagle", "marmot"],
    weather: { sunny: 3, cloudy: 3, foggy: 2, snowy: 2, stormy: 2 },
    color: [140, 130, 122]
  }
];

// src/biomes/registry.ts
var ID_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/;
function cloneBiome(b) {
  return {
    ...b,
    temperature: [...b.temperature],
    moisture: [...b.moisture],
    elevation: [...b.elevation],
    vegetation: b.vegetation.map((v) => ({ ...v })),
    resources: [...b.resources],
    wildlife: [...b.wildlife],
    weather: { ...b.weather },
    color: [...b.color]
  };
}
function validateBiome(b) {
  if (!b || typeof b !== "object") throw new CozyWorldError("INVALID_BIOME", "Biome must be an object");
  if (typeof b.id !== "string" || !ID_PATTERN.test(b.id)) {
    throw new CozyWorldError("INVALID_BIOME", `Biome id "${String(b.id)}" must match ${ID_PATTERN}`);
  }
  if (typeof b.name !== "string" || b.name.length === 0) {
    throw new CozyWorldError("INVALID_BIOME", `Biome "${b.id}" needs a name`);
  }
  assertRange(`${b.id}.temperature`, b.temperature);
  assertRange(`${b.id}.moisture`, b.moisture);
  assertRange(`${b.id}.elevation`, b.elevation);
  if (!Array.isArray(b.vegetation) || !Array.isArray(b.resources) || !Array.isArray(b.wildlife)) {
    throw new CozyWorldError("INVALID_BIOME", `Biome "${b.id}" vegetation, resources and wildlife must be arrays`);
  }
  for (const v of b.vegetation) {
    if (typeof v.type !== "string" || typeof v.density !== "number" || v.density < 0 || v.density > 1) {
      throw new CozyWorldError("INVALID_BIOME", `Biome "${b.id}" has an invalid vegetation rule`);
    }
  }
  if (!Array.isArray(b.color) || b.color.length !== 3 || b.color.some((c) => typeof c !== "number" || c < 0 || c > 255)) {
    throw new CozyWorldError("INVALID_BIOME", `Biome "${b.id}" color must be [r, g, b] in 0..255`);
  }
  const weights = Object.values(b.weather ?? {});
  if (weights.some((w) => typeof w !== "number" || w < 0)) {
    throw new CozyWorldError("INVALID_BIOME", `Biome "${b.id}" weather weights must be non-negative numbers`);
  }
}
var BiomeRegistry = class {
  biomes = /* @__PURE__ */ new Map();
  constructor(initial = BUILTIN_BIOMES) {
    for (const b of initial) this.register(b);
  }
  register(biome, { replace = false } = {}) {
    validateBiome(biome);
    if (this.biomes.has(biome.id) && !replace) {
      throw new CozyWorldError("DUPLICATE_BIOME", `Biome "${biome.id}" is already registered (pass { replace: true } to override)`);
    }
    if (!this.biomes.has(biome.id) && this.biomes.size >= 255) {
      throw new CozyWorldError("INVALID_BIOME", "A registry supports at most 255 biomes");
    }
    this.biomes.set(biome.id, cloneBiome(biome));
  }
  unregister(id) {
    return this.biomes.delete(id);
  }
  has(id) {
    return this.biomes.has(id);
  }
  get(id) {
    const b = this.biomes.get(id);
    if (!b) throw new CozyWorldError("UNKNOWN_BIOME", `Unknown biome "${id}". Registered: ${this.ids().join(", ")}`);
    return cloneBiome(b);
  }
  /** Internal fast access without cloning. */
  peek(id) {
    return this.biomes.get(id);
  }
  ids() {
    return [...this.biomes.keys()];
  }
  list() {
    return [...this.biomes.values()].map(cloneBiome);
  }
};
function rangeDistance(v, [lo, hi]) {
  if (v < lo) return lo - v;
  if (v > hi) return v - hi;
  return 0;
}
function selectBiome(candidates, temperature, moisture, elevationAboveSea, isWater) {
  let pool = candidates.filter((b) => Boolean(b.aquatic) === isWater);
  if (pool.length === 0) pool = candidates;
  let best = pool[0];
  let bestScore = Infinity;
  for (const b of pool) {
    const d = rangeDistance(temperature, b.temperature) * 1.2 + rangeDistance(moisture, b.moisture) + rangeDistance(elevationAboveSea, b.elevation) * 2;
    const score = d - (d === 0 ? (b.priority ?? 0) * 0.01 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = b;
    }
  }
  return best;
}

// src/core/noise.ts
var GRAD_X = [1, -1, 1, -1, 1, -1, 0, 0];
var GRAD_Y = [1, 1, -1, -1, 0, 0, 1, -1];
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
var Noise2D = class {
  perm = new Uint8Array(512);
  constructor(rng) {
    const p = [];
    for (let i = 0; i < 256; i++) p.push(i);
    const shuffled = rng.shuffle(p);
    for (let i = 0; i < 512; i++) this.perm[i] = shuffled[i & 255];
  }
  grad(hash, x, y) {
    const h = hash & 7;
    return GRAD_X[h] * x + GRAD_Y[h] * y;
  }
  noise(x, y) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const X = fx & 255;
    const Y = fy & 255;
    const xf = x - fx;
    const yf = y - fy;
    const u = fade(xf);
    const v = fade(yf);
    const p = this.perm;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    const x1 = lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    const n = lerp(x1, x2, v) * 1.4142;
    return n < -1 ? -1 : n > 1 ? 1 : n;
  }
  /** Fractal Brownian motion, normalized to roughly [-1, 1]. */
  fbm(x, y, opts = {}) {
    const octaves = opts.octaves ?? 5;
    const persistence = opts.persistence ?? 0.5;
    const lacunarity = opts.lacunarity ?? 2;
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise(x * freq, y * freq);
      norm += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return norm === 0 ? 0 : sum / norm;
  }
};

// src/types/index.ts
var WaterKind = { Land: 0, Ocean: 1, Lake: 2, River: 3 };

// src/terrain/islands.ts
function islandMask(x, y, width, height, strength) {
  if (strength <= 0) return 1;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = cx === 0 ? 0 : (x - cx) / cx;
  const dy = cy === 0 ? 0 : (y - cy) / cy;
  const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.SQRT2 * 1.4);
  const m = 1 - strength * d * d;
  return m < 0 ? 0 : m;
}

// src/terrain/heightmap.ts
function generateHeightmap(width, height, opts, rng) {
  const base = new Noise2D(rng.fork("base"));
  const ridge = new Noise2D(rng.fork("ridge"));
  const out = new Float32Array(width * height);
  const span = Math.max(width, height);
  const fbm = { octaves: opts.octaves, persistence: opts.persistence, lacunarity: opts.lacunarity };
  const mi = opts.mountainIntensity;
  const ox = rng.float(0, 1e3);
  const oy = rng.float(0, 1e3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / span * opts.scale + ox;
      const ny = y / span * opts.scale + oy;
      let e = base.fbm(nx, ny, fbm) * 0.5 + 0.5;
      if (mi > 0) {
        const r = 1 - Math.abs(ridge.fbm(nx * 0.8, ny * 0.8, { octaves: Math.max(1, opts.octaves - 1) }));
        e = e * (1 - mi) + r * r * mi;
      }
      if (opts.island) e *= islandMask(x, y, width, height, opts.islandFalloff);
      e = Math.pow(e < 0 ? 0 : e, opts.redistribution);
      out[y * width + x] = e < 0 ? 0 : e > 1 ? 1 : e;
    }
  }
  return out;
}

// src/terrain/water.ts
var N4X = [1, -1, 0, 0];
var N4Y = [0, 0, 1, -1];
function classifyWater(heightmap, width, height, seaLevel) {
  const n = width * height;
  const water = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) if (heightmap[i] < seaLevel) water[i] = WaterKind.Lake;
  for (let x = 0; x < width; x++) {
    for (const y of height > 1 ? [0, height - 1] : [0]) {
      const i = y * width + x;
      if (water[i] === WaterKind.Lake) {
        water[i] = WaterKind.Ocean;
        queue[tail++] = i;
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of width > 1 ? [0, width - 1] : [0]) {
      const i = y * width + x;
      if (water[i] === WaterKind.Lake) {
        water[i] = WaterKind.Ocean;
        queue[tail++] = i;
      }
    }
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    const y = (i - x) / width;
    for (let k = 0; k < 4; k++) {
      const nx = x + N4X[k];
      const ny = y + N4Y[k];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (water[j] === WaterKind.Lake) {
        water[j] = WaterKind.Ocean;
        queue[tail++] = j;
      }
    }
  }
  return water;
}
function fillBasin(heightmap, water, width, height, sx, sy, depth, maxCells) {
  const start = sy * width + sx;
  const level = heightmap[start] + depth;
  const stack = [start];
  const seen = /* @__PURE__ */ new Set([start]);
  let filled = 0;
  while (stack.length > 0 && filled < maxCells) {
    const i = stack.pop();
    if (water[i] !== WaterKind.Land || heightmap[i] > level) continue;
    water[i] = WaterKind.Lake;
    filled++;
    const x = i % width;
    const y = (i - x) / width;
    for (let k = 0; k < 4; k++) {
      const nx = x + N4X[k];
      const ny = y + N4Y[k];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (!seen.has(j)) {
        seen.add(j);
        stack.push(j);
      }
    }
  }
  return filled;
}
function carveLakes(heightmap, water, width, height, seaLevel, count, rng) {
  if (count <= 0 || width < 5 || height < 5) return 0;
  const maxCells = Math.max(4, Math.floor(width * height / 120));
  let made = 0;
  for (let attempt = 0; attempt < count * 30 && made < count; attempt++) {
    const x = rng.int(2, width - 3);
    const y = rng.int(2, height - 3);
    const i = y * width + x;
    const h = heightmap[i];
    if (water[i] !== WaterKind.Land || h > seaLevel + (1 - seaLevel) * 0.45) continue;
    if (fillBasin(heightmap, water, width, height, x, y, rng.float(0.01, 0.03), maxCells) >= 3) made++;
  }
  return made;
}
function carveRivers(heightmap, water, width, height, seaLevel, count, rng) {
  if (count <= 0 || width < 3 || height < 3) return 0;
  const minSource = seaLevel + (1 - seaLevel) * 0.45;
  const maxSteps = (width + height) * 3;
  let made = 0;
  for (let attempt = 0; attempt < count * 40 && made < count; attempt++) {
    let x = rng.int(1, width - 2);
    let y = rng.int(1, height - 2);
    let i = y * width + x;
    if (water[i] !== WaterKind.Land || heightmap[i] < minSource) continue;
    const path = [];
    const visited = /* @__PURE__ */ new Set();
    let reachedWater = false;
    for (let step = 0; step < maxSteps; step++) {
      path.push(i);
      visited.add(i);
      let best = -1;
      let bestH = heightmap[i];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = ny * width + nx;
          if (visited.has(j)) continue;
          if (water[j] !== WaterKind.Land) {
            best = j;
            bestH = -1;
            break;
          }
          const hj = heightmap[j];
          if (hj < bestH) {
            bestH = hj;
            best = j;
          }
        }
        if (bestH === -1) break;
      }
      if (best === -1) {
        fillBasin(heightmap, water, width, height, x, y, 0.01, 12);
        break;
      }
      if (water[best] !== WaterKind.Land) {
        reachedWater = true;
        break;
      }
      i = best;
      x = i % width;
      y = (i - x) / width;
    }
    if (path.length < 4) continue;
    for (const p of path) if (water[p] === WaterKind.Land) water[p] = WaterKind.River;
    if (reachedWater || path.length >= 4) made++;
  }
  return made;
}

// src/terrain/regions.ts
function computeTraversable(heightmap, water, width, height, maxSlope) {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (water[i] !== WaterKind.Land) continue;
      const h = heightmap[i];
      let steep = false;
      if (x + 1 < width && Math.abs(heightmap[i + 1] - h) > maxSlope) steep = true;
      if (x > 0 && Math.abs(heightmap[i - 1] - h) > maxSlope) steep = true;
      if (y + 1 < height && Math.abs(heightmap[i + width] - h) > maxSlope) steep = true;
      if (y > 0 && Math.abs(heightmap[i - width] - h) > maxSlope) steep = true;
      if (!steep) out[i] = 1;
    }
  }
  return out;
}
function labelRegions(traversable, biomeIds, biomeKeys, width, height) {
  const n = width * height;
  const regionIds = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const regions = [];
  const counts = new Uint32Array(biomeKeys.length);
  for (let s = 0; s < n; s++) {
    if (traversable[s] !== 1 || regionIds[s] !== -1) continue;
    const id = regions.length;
    counts.fill(0);
    let head = 0;
    let tail = 0;
    queue[tail++] = s;
    regionIds[s] = id;
    let size = 0, sx = 0, sy = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width;
      const y = (i - x) / width;
      size++;
      sx += x;
      sy += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      counts[biomeIds[i]]++;
      const nb = [x + 1 < width ? i + 1 : -1, x > 0 ? i - 1 : -1, y + 1 < height ? i + width : -1, y > 0 ? i - width : -1];
      for (const j of nb) {
        if (j >= 0 && traversable[j] === 1 && regionIds[j] === -1) {
          regionIds[j] = id;
          queue[tail++] = j;
        }
      }
    }
    let dom = 0;
    for (let b = 1; b < counts.length; b++) if (counts[b] > counts[dom]) dom = b;
    regions.push({
      id,
      size,
      dominantBiome: biomeKeys[dom],
      centroid: { x: sx / size, y: sy / size },
      bounds: { minX, minY, maxX, maxY }
    });
  }
  return { regionIds, regions };
}

// src/terrain/generate.ts
var now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
function generateWorldMap(opts, biomes, seasonOffset = 0) {
  const start = now();
  const { width, height, terrain } = opts;
  const n = width * height;
  const root = new SeededRandom(opts.seed);
  const terrainRng = root.fork("terrain");
  const heightmap = generateHeightmap(width, height, terrain, terrainRng.fork("heightmap"));
  const water = classifyWater(heightmap, width, height, terrain.seaLevel);
  carveLakes(heightmap, water, width, height, terrain.seaLevel, terrain.lakeCount, terrainRng.fork("lakes"));
  carveRivers(heightmap, water, width, height, terrain.seaLevel, terrain.riverCount, terrainRng.fork("rivers"));
  const climateRng = root.fork("climate");
  const tNoise = new Noise2D(climateRng.fork("temperature"));
  const mNoise = new Noise2D(climateRng.fork("moisture"));
  const temperature = new Float32Array(n);
  const moisture = new Float32Array(n);
  const span = Math.max(width, height);
  const sea = terrain.seaLevel;
  for (let y = 0; y < height; y++) {
    const lat = height === 1 ? 0.5 : y / (height - 1);
    const latTemp = 1 - Math.abs(lat - 0.5) * 1.2;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const h = heightmap[i];
      const above = h > sea ? (h - sea) / (1 - sea || 1) : 0;
      const tn = tNoise.fbm(x / span * 2, y / span * 2, { octaves: 3 }) * 0.35;
      let t = latTemp * 0.7 + 0.15 + tn - above * 0.55 + seasonOffset * 0.08;
      temperature[i] = t < 0 ? 0 : t > 1 ? 1 : t;
      let m = mNoise.fbm(x / span * 2.5, y / span * 2.5, { octaves: 4 }) * 0.6 + 0.5;
      if (water[i] !== WaterKind.Land) m += 0.2;
      moisture[i] = m < 0 ? 0 : m > 1 ? 1 : m;
    }
  }
  for (let i = 0; i < n; i++) {
    if (water[i] === WaterKind.River || water[i] === WaterKind.Lake) {
      const x = i % width;
      for (const j of [x + 1 < width ? i + 1 : -1, x > 0 ? i - 1 : -1, i + width < n ? i + width : -1, i - width]) {
        if (j >= 0 && water[j] === WaterKind.Land) moisture[j] = Math.min(1, moisture[j] + 0.12);
      }
    }
  }
  const biomeKeys = biomes.map((b) => b.id);
  const biomeIds = new Uint8Array(n);
  const counts = Object.fromEntries(biomeKeys.map((k) => [k, 0]));
  for (let i = 0; i < n; i++) {
    const h = heightmap[i];
    const isWater = water[i] !== WaterKind.Land;
    const above = isWater ? 0 : (h - sea) / (1 - sea || 1);
    const b = selectBiome(biomes, temperature[i], moisture[i], above, isWater);
    const idx = biomeKeys.indexOf(b.id);
    biomeIds[i] = idx;
    counts[b.id] = (counts[b.id] ?? 0) + 1;
  }
  const traversable = computeTraversable(heightmap, water, width, height, terrain.maxTraversableSlope);
  const { regionIds, regions } = labelRegions(traversable, biomeIds, biomeKeys, width, height);
  const vegRng = root.fork("vegetation");
  const features = [];
  const objectTypes = /* @__PURE__ */ new Set(["boulder", "driftwood", "fallen_log", "seashell_pile", "sandstone_rock", "crystal_outcrop", "snow_drift", "ice_crystal"]);
  if (opts.vegetationDensity > 0 && opts.maxFeatures > 0) {
    outer: for (let i = 0; i < n; i++) {
      const b = biomes[biomeIds[i]];
      const isWater = water[i] !== WaterKind.Land;
      if (isWater !== Boolean(b.aquatic) || water[i] === WaterKind.Ocean || water[i] === WaterKind.River) continue;
      for (const rule of b.vegetation) {
        if (vegRng.next() < rule.density * opts.vegetationDensity) {
          const x = i % width;
          const y = (i - x) / width;
          features.push({
            id: `f${features.length}`,
            type: rule.type,
            category: objectTypes.has(rule.type) ? "object" : "vegetation",
            biome: b.id,
            x: x + vegRng.float(0.1, 0.9),
            y: y + vegRng.float(0.1, 0.9),
            z: (isWater ? sea : heightmap[i]) * terrain.heightScale,
            rotation: vegRng.float(0, Math.PI * 2),
            scale: vegRng.float(0.75, 1.3)
          });
          if (features.length >= opts.maxFeatures) break outer;
          break;
        }
      }
    }
  }
  let land = 0, ocean = 0, lake = 0, river = 0, trav = 0;
  for (let i = 0; i < n; i++) {
    const w = water[i];
    if (w === WaterKind.Land) land++;
    else if (w === WaterKind.Ocean) ocean++;
    else if (w === WaterKind.Lake) lake++;
    else river++;
    if (traversable[i] === 1) trav++;
  }
  return {
    seed: opts.seed,
    width,
    height,
    dimension: opts.dimension,
    seaLevel: sea,
    heightScale: terrain.heightScale,
    heightmap,
    temperature,
    moisture,
    biomeIds,
    biomeKeys,
    biomeColors: biomes.map((b) => [...b.color]),
    water,
    traversable,
    regionIds,
    regions,
    features,
    stats: {
      landCells: land,
      oceanCells: ocean,
      lakeCells: lake,
      riverCells: river,
      traversableCells: trav,
      biomeCounts: counts,
      generationMs: Math.round((now() - start) * 100) / 100
    }
  };
}

// src/environment/seasons.ts
var ORDER = ["spring", "summer", "autumn", "winter"];
function getSeason(dayOfYear, latitude = 45) {
  const d = (Math.floor(dayOfYear) % 364 + 364) % 364;
  let idx = Math.floor(d / 91);
  if (latitude < 0) idx = (idx + 2) % 4;
  const progress = d % 91 / 91;
  const angle = (d - 136) / 364 * Math.PI * 2;
  const temperatureOffset = Math.cos(angle) * (latitude < 0 ? -1 : 1) * Math.min(1, Math.abs(latitude) / 45);
  return { season: ORDER[idx], progress, temperatureOffset };
}

// src/environment/day-night.ts
var DEG = Math.PI / 180;
function getDayNight(hour, dayOfYear, latitude = 45) {
  const h = (hour % 24 + 24) % 24;
  const calendarDay = (dayOfYear + 80) % 365;
  const decl = 23.44 * Math.sin(360 / 365 * (calendarDay - 81) * DEG);
  const lat = Math.max(-80, Math.min(80, latitude));
  const hourAngle = (h - 12) * 15;
  const sinEl = Math.sin(lat * DEG) * Math.sin(decl * DEG) + Math.cos(lat * DEG) * Math.cos(decl * DEG) * Math.cos(hourAngle * DEG);
  const sunElevation = Math.asin(Math.max(-1, Math.min(1, sinEl))) / DEG;
  const cosH0 = -Math.tan(lat * DEG) * Math.tan(decl * DEG);
  const H0 = cosH0 <= -1 ? 180 : cosH0 >= 1 ? 0 : Math.acos(cosH0) / DEG;
  const daylightHours = 2 * H0 / 15;
  const sunrise = 12 - daylightHours / 2;
  const sunset = 12 + daylightHours / 2;
  let phase;
  if (sunElevation > 6) phase = "day";
  else if (sunElevation > -6) phase = h < 12 ? "dawn" : "dusk";
  else phase = "night";
  const t = Math.max(0, Math.min(1, (sunElevation + 6) / 36));
  const lightLevel = 0.05 + 0.95 * t * t * (3 - 2 * t);
  return { hour: h, phase, sunElevation, lightLevel, sunrise, sunset, daylightHours };
}

// src/environment/weather.ts
var SEASON_MODIFIERS = {
  spring: { rainy: 1.4, cloudy: 1.1, foggy: 1.2 },
  summer: { sunny: 1.5, stormy: 1.3, foggy: 0.6 },
  autumn: { foggy: 1.5, rainy: 1.2, cloudy: 1.2 },
  winter: { snowy: 2, cloudy: 1.2, sunny: 0.7, stormy: 0.7 }
};
var ALL = ["sunny", "cloudy", "rainy", "foggy", "stormy", "snowy"];
function toCelsius(normalizedTemp, seasonOffset) {
  return Math.round((-15 + normalizedTemp * 45 + seasonOffset * 10) * 10) / 10;
}
function generateWeather(rng, biome, season) {
  const midTemp = (biome.temperature[0] + biome.temperature[1]) / 2;
  const temperatureC = toCelsius(midTemp, season.temperatureOffset) + Math.round(rng.float(-3, 3) * 10) / 10;
  const freezing = temperatureC <= 1;
  const entries = ALL.map((type2) => {
    let w = (biome.weather[type2] ?? 0) * (SEASON_MODIFIERS[season.season][type2] ?? 1);
    if (type2 === "snowy" && !freezing) w = 0;
    if (type2 === "rainy" && freezing) w = 0;
    if (type2 === "snowy" && freezing && w === 0) w = biome.weather.rainy ?? 0.5;
    return { value: type2, weight: w };
  });
  if (!entries.some((e) => e.weight > 0)) entries[0] = { value: "sunny", weight: 1 };
  const type = rng.weighted(entries);
  const intensity = Math.round(rng.float(type === "stormy" ? 0.6 : 0.1, 1) * 100) / 100;
  const baseWind = type === "stormy" ? 40 : type === "foggy" ? 3 : 12;
  const windKph = Math.round(baseWind * (0.5 + intensity) * 10) / 10;
  const precipitation = type === "rainy" ? intensity * 8 : type === "stormy" ? intensity * 20 : type === "snowy" ? intensity * 4 : 0;
  return {
    type,
    intensity,
    temperatureC,
    windKph,
    precipitation: Math.round(precipitation * 10) / 10,
    durationHours: rng.int(type === "stormy" ? 1 : 2, type === "stormy" ? 4 : 12),
    biome: biome.id,
    season: season.season
  };
}

// src/content/tables.ts
var RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
var RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
var NAME_PREFIXES = {
  forest: ["Mossy", "Whispering", "Fern", "Acorn", "Bramble", "Hollow", "Elder"],
  lake: ["Mirror", "Lily", "Still", "Silver", "Reed", "Heron"],
  grassland: ["Clover", "Sunny", "Breezy", "Daisy", "Meadow", "Honey"],
  desert: ["Amber", "Dune", "Sunbaked", "Copper", "Mirage"],
  snowfield: ["Frost", "Snowdrop", "Pine", "Glimmer", "Hush"],
  swamp: ["Murky", "Firefly", "Willow", "Misty", "Toadstool"],
  beach: ["Shell", "Saltwind", "Coral", "Driftwood", "Tide"],
  mountain: ["Granite", "Eagle", "Cloud", "Echo", "Summit"],
  default: ["Quiet", "Golden", "Little", "Old", "Hidden"]
};
var NAME_SUFFIXES = {
  forest: ["Grove", "Thicket", "Glade", "Woods", "Hollow"],
  lake: ["Pond", "Mere", "Shallows", "Lake", "Cove"],
  grassland: ["Meadow", "Field", "Green", "Downs", "Pasture"],
  desert: ["Flats", "Dunes", "Oasis", "Mesa", "Wash"],
  snowfield: ["Drift", "Tundra", "Rise", "Vale", "Hollow"],
  swamp: ["Bog", "Marsh", "Fen", "Mire", "Bayou"],
  beach: ["Shore", "Strand", "Bay", "Sands", "Point"],
  mountain: ["Peak", "Pass", "Ridge", "Crag", "Overlook"],
  default: ["Place", "Corner", "Nook", "Crossing", "Rest"]
};
var LOCATION_KINDS = [
  { kind: "clearing", weight: 5, poi: ["picnic blanket", "old stump", "flower patch"] },
  { kind: "cottage", weight: 3, poi: ["mailbox", "herb garden", "woodpile", "chimney"] },
  { kind: "bridge", weight: 2, poi: ["wooden railing", "carved initials", "fishing spot"] },
  { kind: "campsite", weight: 3, poi: ["fire pit", "tent", "lantern"] },
  { kind: "ruins", weight: 1, poi: ["mossy arch", "broken statue", "rune stone"] },
  { kind: "garden", weight: 2, poi: ["vegetable bed", "scarecrow", "watering can"] },
  { kind: "lookout", weight: 2, poi: ["bench", "telescope", "signpost"] },
  { kind: "market", weight: 1, poi: ["fruit stall", "tea cart", "notice board"] }
];
var DESCRIPTION_OPENERS = [
  "A gentle spot where",
  "Tucked away from the path,",
  "Locals say that here",
  "Few travelers notice that",
  "On quiet mornings,"
];
var DESCRIPTION_DETAILS = {
  forest: ["sunlight filters through the leaves", "the air smells of pine and rain", "owls call softly at dusk"],
  lake: ["the water barely ripples", "dragonflies skim the surface", "reeds sway in the breeze"],
  grassland: ["wildflowers sway in the wind", "bees hum between the clovers", "the sky feels endless"],
  desert: ["warm sand shifts underfoot", "the horizon shimmers", "cacti bloom after rare rains"],
  snowfield: ["snow muffles every sound", "frost glitters like sugar", "breath clouds in the cold air"],
  swamp: ["fireflies drift over the water", "frogs sing in chorus", "mist curls around willow roots"],
  beach: ["waves roll in lazily", "shells glint in the sand", "gulls circle overhead"],
  mountain: ["clouds drift below the ridge", "the wind carries echoes", "the view stretches for miles"],
  default: ["time seems to slow down", "everything feels peaceful"]
};
var CREATURES = {
  duck: { species: "duck", rarity: "common", temperament: "friendly", activeTime: ["dawn", "day"], traits: ["waddles", "quacks"] },
  frog: { species: "frog", rarity: "common", temperament: "playful", activeTime: ["dusk", "night"], weather: ["rainy", "foggy", "cloudy"], traits: ["hops", "croaks"] },
  heron: { species: "heron", rarity: "uncommon", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["patient", "long-legged"] },
  otter: { species: "otter", rarity: "rare", temperament: "playful", activeTime: ["day", "dusk"], traits: ["juggles pebbles", "floats on back"] },
  crab: { species: "crab", rarity: "common", temperament: "curious", activeTime: ["day", "night"], traits: ["sideways walker"] },
  seagull: { species: "seagull", rarity: "common", temperament: "curious", activeTime: ["dawn", "day"], traits: ["snack thief"] },
  turtle: { species: "sea turtle", rarity: "rare", temperament: "sleepy", activeTime: ["night", "dawn"], seasons: ["summer"], traits: ["ancient", "slow"] },
  rabbit: { species: "rabbit", rarity: "common", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["fluffy tail", "quick"] },
  butterfly: { species: "butterfly", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer"], weather: ["sunny", "cloudy"], traits: ["colorful"] },
  sheep: { species: "sheep", rarity: "common", temperament: "sleepy", activeTime: ["day"], traits: ["woolly"] },
  meadowlark: { species: "meadowlark", rarity: "uncommon", temperament: "friendly", activeTime: ["dawn", "day"], traits: ["sings sweetly"] },
  deer: { species: "deer", rarity: "uncommon", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["graceful", "soft-eyed"] },
  fox: { species: "red fox", rarity: "uncommon", temperament: "curious", activeTime: ["dusk", "night"], traits: ["bushy tail", "clever"] },
  owl: { species: "owl", rarity: "uncommon", temperament: "sleepy", activeTime: ["night"], traits: ["wise", "silent flight"] },
  squirrel: { species: "squirrel", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer", "autumn"], traits: ["hoards acorns"] },
  hedgehog: { species: "hedgehog", rarity: "rare", temperament: "shy", activeTime: ["dusk", "night"], seasons: ["spring", "summer", "autumn"], traits: ["prickly", "snuffly"] },
  lizard: { species: "lizard", rarity: "common", temperament: "sleepy", activeTime: ["day"], weather: ["sunny"], traits: ["sunbather"] },
  fennec_fox: { species: "fennec fox", rarity: "rare", temperament: "curious", activeTime: ["dusk", "night"], traits: ["huge ears"] },
  beetle: { species: "jewel beetle", rarity: "common", temperament: "shy", activeTime: ["day", "night"], traits: ["shiny shell"] },
  hawk: { species: "hawk", rarity: "uncommon", temperament: "shy", activeTime: ["day"], traits: ["keen eyes"] },
  snow_hare: { species: "snow hare", rarity: "common", temperament: "shy", activeTime: ["dawn", "dusk"], traits: ["white coat"] },
  arctic_fox: { species: "arctic fox", rarity: "rare", temperament: "curious", activeTime: ["day", "dusk"], traits: ["fluffy", "snow-pouncer"] },
  snowy_owl: { species: "snowy owl", rarity: "epic", temperament: "sleepy", activeTime: ["dusk", "night"], traits: ["golden eyes"] },
  reindeer: { species: "reindeer", rarity: "uncommon", temperament: "friendly", activeTime: ["day"], traits: ["antlers", "jingly"] },
  toad: { species: "toad", rarity: "common", temperament: "sleepy", activeTime: ["dusk", "night"], traits: ["warty", "content"] },
  dragonfly: { species: "dragonfly", rarity: "common", temperament: "playful", activeTime: ["day"], seasons: ["spring", "summer"], traits: ["iridescent"] },
  firefly: { species: "firefly", rarity: "uncommon", temperament: "friendly", activeTime: ["dusk", "night"], seasons: ["summer"], traits: ["glows"] },
  mountain_goat: { species: "mountain goat", rarity: "uncommon", temperament: "curious", activeTime: ["day"], traits: ["sure-footed"] },
  eagle: { species: "golden eagle", rarity: "rare", temperament: "shy", activeTime: ["day"], weather: ["sunny", "cloudy"], traits: ["majestic"] },
  marmot: { species: "marmot", rarity: "common", temperament: "friendly", activeTime: ["day"], seasons: ["spring", "summer", "autumn"], traits: ["whistles"] }
};
var CREATURE_NAMES = ["Biscuit", "Clover", "Pip", "Maple", "Juniper", "Pebble", "Fern", "Moss", "Nutmeg", "Willow", "Bramble", "Tansy", "Hazel", "Sorrel", "Puddle"];
var ITEMS = [
  { id: "wildflower", name: "Wildflower Bouquet", category: "forage", rarity: "common", biomes: ["grassland", "forest"], value: 5 },
  { id: "berries", name: "Handful of Berries", category: "forage", rarity: "common", biomes: ["forest", "grassland"], value: 4 },
  { id: "mushroom", name: "Brown Mushroom", category: "forage", rarity: "common", biomes: ["forest", "swamp"], value: 6 },
  { id: "acorn", name: "Shiny Acorn", category: "forage", rarity: "common", biomes: ["forest"], value: 2 },
  { id: "honey", name: "Wild Honeycomb", category: "forage", rarity: "uncommon", biomes: ["grassland"], value: 18 },
  { id: "seashell", name: "Spiral Seashell", category: "trinket", rarity: "common", biomes: ["beach"], value: 5 },
  { id: "sea_glass", name: "Sea Glass", category: "trinket", rarity: "uncommon", biomes: ["beach"], value: 15 },
  { id: "cactus_fruit", name: "Cactus Fruit", category: "forage", rarity: "common", biomes: ["desert"], value: 8 },
  { id: "amber", name: "Amber Shard", category: "treasure", rarity: "rare", biomes: ["desert", "forest"], value: 60 },
  { id: "frost_flower", name: "Frost Flower", category: "forage", rarity: "uncommon", biomes: ["snowfield"], value: 22 },
  { id: "snow_berries", name: "Snow Berries", category: "forage", rarity: "common", biomes: ["snowfield"], value: 6 },
  { id: "bog_herb", name: "Bog Myrtle", category: "forage", rarity: "common", biomes: ["swamp"], value: 7 },
  { id: "firefly_jar", name: "Firefly Lantern", category: "trinket", rarity: "rare", biomes: ["swamp"], value: 45 },
  { id: "crystal", name: "Mountain Crystal", category: "treasure", rarity: "rare", biomes: ["mountain"], value: 75 },
  { id: "iron_ore", name: "Iron Ore", category: "material", rarity: "uncommon", biomes: ["mountain"], value: 14 },
  { id: "wood", name: "Bundle of Twigs", category: "material", rarity: "common", biomes: ["forest", "grassland", "swamp"], value: 2 },
  { id: "stone", name: "Smooth Stone", category: "material", rarity: "common", biomes: "any", value: 1 },
  { id: "clay", name: "River Clay", category: "material", rarity: "common", biomes: ["lake", "swamp"], value: 4 },
  { id: "worm", name: "Wriggly Worm", category: "fish_bait", rarity: "common", biomes: "any", value: 1 },
  { id: "music_box", name: "Tiny Music Box", category: "treasure", rarity: "epic", biomes: "any", value: 250 },
  { id: "star_fragment", name: "Fallen Star Fragment", category: "treasure", rarity: "legendary", biomes: "any", value: 1e3 },
  { id: "golden_feather", name: "Golden Feather", category: "treasure", rarity: "epic", biomes: ["mountain", "forest", "grassland"], value: 300 }
];
var FISH = [
  { species: "bluegill", rarity: "common", water: ["lake", "river"], activeTime: ["dawn", "day", "dusk"], sizeCm: [10, 25] },
  { species: "minnow", rarity: "common", water: ["river", "lake"], activeTime: ["day"], sizeCm: [3, 8] },
  { species: "rainbow trout", rarity: "uncommon", water: ["river"], activeTime: ["dawn", "dusk"], sizeCm: [25, 60] },
  { species: "carp", rarity: "common", water: ["lake"], activeTime: ["day", "dusk"], sizeCm: [30, 80] },
  { species: "catfish", rarity: "uncommon", water: ["lake", "river"], activeTime: ["night", "dusk"], sizeCm: [40, 120] },
  { species: "koi", rarity: "rare", water: ["lake"], activeTime: ["day"], seasons: ["spring", "summer"], sizeCm: [30, 70] },
  { species: "golden perch", rarity: "epic", water: ["lake", "river"], activeTime: ["dawn"], sizeCm: [30, 50] },
  { species: "mackerel", rarity: "common", water: ["ocean"], activeTime: ["day", "dawn"], sizeCm: [25, 40] },
  { species: "sea bream", rarity: "uncommon", water: ["ocean"], activeTime: ["day", "dusk"], sizeCm: [20, 50] },
  { species: "pufferfish", rarity: "rare", water: ["ocean"], activeTime: ["day"], seasons: ["summer"], sizeCm: [10, 30] },
  { species: "moonfish", rarity: "legendary", water: ["ocean", "lake"], activeTime: ["night"], sizeCm: [60, 150] },
  { species: "ice char", rarity: "rare", water: ["lake", "river"], activeTime: ["day"], seasons: ["winter"], sizeCm: [25, 55] }
];
var EVENTS = [
  { id: "rainbow", title: "Double Rainbow", description: "A double rainbow arcs over {place}.", weight: 3, rarity: "uncommon", weather: ["rainy", "cloudy"], phases: ["day"], durationHours: [1, 1] },
  { id: "meteor_shower", title: "Meteor Shower", description: "Shooting stars streak across the sky above {place}.", weight: 1, rarity: "rare", weather: ["sunny"], phases: ["night"], durationHours: [2, 4], rewards: ["star_fragment"] },
  { id: "traveling_merchant", title: "Traveling Merchant", description: "A merchant with a creaky cart sets up near {place}.", weight: 4, rarity: "common", phases: ["day"], durationHours: [3, 8] },
  { id: "firefly_dance", title: "Firefly Dance", description: "Thousands of fireflies glow in rhythm around {place}.", weight: 3, rarity: "uncommon", seasons: ["summer"], phases: ["dusk", "night"], biomes: ["swamp", "forest", "grassland", "lake"], durationHours: [1, 3] },
  { id: "mushroom_bloom", title: "Mushroom Bloom", description: "Mushrooms sprouted overnight all over {place}.", weight: 4, rarity: "common", weather: ["rainy", "foggy"], biomes: ["forest", "swamp"], durationHours: [6, 24], rewards: ["mushroom"] },
  { id: "first_snow", title: "First Snowfall", description: "Soft flakes settle on {place} for the first time this year.", weight: 3, rarity: "uncommon", weather: ["snowy"], seasons: ["winter", "autumn"], durationHours: [4, 12] },
  { id: "picnic", title: "Village Picnic", description: "Neighbors gather for a picnic at {place}.", weight: 4, rarity: "common", weather: ["sunny", "cloudy"], seasons: ["spring", "summer"], phases: ["day"], durationHours: [2, 5] },
  { id: "lost_kitten", title: "Lost Kitten", description: "A tiny kitten mews somewhere around {place}.", weight: 3, rarity: "common", durationHours: [1, 6] },
  { id: "fish_frenzy", title: "Fish Frenzy", description: "The water near {place} is bubbling with fish.", weight: 3, rarity: "uncommon", biomes: ["lake", "beach"], phases: ["dawn", "dusk"], durationHours: [1, 2], rewards: ["worm"] },
  { id: "storm_shelter", title: "Cozy Storm", description: "Thunder rolls over {place}; perfect weather for tea indoors.", weight: 3, rarity: "common", weather: ["stormy"], durationHours: [1, 4] },
  { id: "fog_lanterns", title: "Lanterns in the Fog", description: "Mysterious lanterns bob through the mist at {place}.", weight: 2, rarity: "rare", weather: ["foggy"], phases: ["dusk", "night"], durationHours: [1, 3] },
  { id: "aurora", title: "Aurora Lights", description: "Green ribbons of light dance above {place}.", weight: 1, rarity: "epic", biomes: ["snowfield", "mountain"], phases: ["night"], durationHours: [1, 3] },
  { id: "harvest_festival", title: "Harvest Festival", description: "Pumpkins and music fill {place}.", weight: 2, rarity: "uncommon", seasons: ["autumn"], durationHours: [6, 12] },
  { id: "desert_bloom", title: "Desert Bloom", description: "After rain, {place} is carpeted in flowers.", weight: 2, rarity: "rare", biomes: ["desert"], weather: ["cloudy", "rainy", "stormy"], durationHours: [12, 48] }
];
var DISCOVERY_KINDS = [
  { kind: "hidden grotto", poi: ["glowing pool", "crystal stalactites"] },
  { kind: "fairy ring", poi: ["perfect mushroom circle", "tiny footprints"] },
  { kind: "abandoned observatory", poi: ["brass telescope", "star charts"] },
  { kind: "sunken shrine", poi: ["mossy altar", "offering bowl"] },
  { kind: "secret garden", poi: ["overgrown gate", "ancient rose bush"] },
  { kind: "giant's tree", poi: ["hollow trunk", "rope ladder"] }
];

// src/content/common.ts
function rollRarity(rng, luck = 0, minRarity = "common") {
  const minIdx = RARITY_ORDER.indexOf(minRarity);
  const entries = RARITY_ORDER.map((r, i) => ({
    value: r,
    weight: i < minIdx ? 0 : RARITY_WEIGHTS[r] * Math.pow(1 + luck * 2, i)
  }));
  return rng.weighted(entries);
}
function rarityAtLeast(r, min) {
  return RARITY_ORDER.indexOf(r) >= RARITY_ORDER.indexOf(min);
}
function pickCell(map, rng, predicate) {
  const n = map.width * map.height;
  for (let t = 0; t < 64; t++) {
    const i = rng.int(0, n - 1);
    if (predicate(i)) return i;
  }
  const start = rng.int(0, n - 1);
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (predicate(i)) return i;
  }
  throw new CozyWorldError("NO_VALID_CELL", "No cell in the world matches the requested constraints");
}

// src/content/locations.ts
function biomeIndex(map, biome) {
  if (biome === void 0) return -1;
  const idx = map.biomeKeys.indexOf(biome);
  if (idx === -1) throw new CozyWorldError("UNKNOWN_BIOME", `Biome "${biome}" is not part of this world`);
  return idx;
}
function isNearWater(map, i) {
  const x = i % map.width;
  const y = (i - x) / map.width;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
    if (map.water[ny * map.width + nx] !== WaterKind.Land) return true;
  }
  return false;
}
function makeName(rng, biome) {
  const pre = NAME_PREFIXES[biome] ?? NAME_PREFIXES["default"];
  const suf = NAME_SUFFIXES[biome] ?? NAME_SUFFIXES["default"];
  return `${rng.pick(pre)} ${rng.pick(suf)}`;
}
function describe(rng, biome, kind) {
  const details = DESCRIPTION_DETAILS[biome] ?? DESCRIPTION_DETAILS["default"];
  const [a, b] = rng.shuffle(details);
  const article = /^[aeiou]/.test(kind) ? "an" : "a";
  return `${rng.pick(DESCRIPTION_OPENERS)} ${a}${b ? ` and ${b}` : ""}. You find ${article} ${kind} here.`;
}
function buildPois(rng, map, cx, cy, names) {
  const count = Math.min(names.length, rng.int(1, 3));
  return rng.shuffle(names).slice(0, count).map((name) => ({
    id: rng.id("poi", 1),
    name,
    x: Math.max(0, Math.min(map.width - 1, cx + rng.int(-2, 2))),
    y: Math.max(0, Math.min(map.height - 1, cy + rng.int(-2, 2)))
  }));
}
function generateLocation(map, rng, opts = {}) {
  const bi = biomeIndex(map, opts.biome);
  const i = pickCell(
    map,
    rng,
    (c) => map.water[c] === WaterKind.Land && (bi === -1 || map.biomeIds[c] === bi) && (!opts.nearWater || isNearWater(map, c))
  );
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i]];
  const kind = rng.weighted(LOCATION_KINDS.map((k) => ({ value: k, weight: k.weight })));
  const name = `${makeName(rng, biome)} ${kind.kind === "clearing" ? "" : capitalizeWord(kind.kind)}`.trim();
  return {
    id: rng.id("loc"),
    name,
    kind: kind.kind,
    description: describe(rng, biome, kind.kind),
    biome,
    x,
    y,
    elevation: map.heightmap[i],
    regionId: map.regionIds[i],
    rarity: rollRarity(rng, opts.luck ?? 0),
    hidden: false,
    pointsOfInterest: buildPois(rng, map, x, y, kind.poi)
  };
}
function capitalizeWord(s) {
  return s.replace(/(^|\s)\S/g, (m) => m.toUpperCase());
}
function generateDiscovery(map, rng, opts = {}) {
  const bi = biomeIndex(map, opts.biome);
  const i = pickCell(map, rng, (c) => map.water[c] === WaterKind.Land && (bi === -1 || map.biomeIds[c] === bi));
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i]];
  const kind = rng.pick(DISCOVERY_KINDS);
  return {
    id: rng.id("disc"),
    name: `The ${makeName(rng, biome)} ${capitalizeWord(kind.kind)}`,
    kind: kind.kind,
    description: `${describe(rng, biome, kind.kind)} It does not appear on any map.`,
    biome,
    x,
    y,
    elevation: map.heightmap[i],
    regionId: map.regionIds[i],
    rarity: rollRarity(rng, opts.luck ?? 0, "rare"),
    hidden: true,
    pointsOfInterest: buildPois(rng, map, x, y, kind.poi)
  };
}

// src/content/creatures.ts
var DIFFICULTY = { common: 1, uncommon: 2, rare: 4, epic: 7, legendary: 10 };
function fits(t, ctx) {
  if (ctx.season && t.seasons && !t.seasons.includes(ctx.season)) return false;
  if (ctx.weather && t.weather && !t.weather.includes(ctx.weather)) return false;
  if (ctx.phase && !t.activeTime.includes(ctx.phase)) return false;
  return true;
}
function generateCreature(biomes, rng, ctx = {}, luck = 0) {
  const pool = [];
  for (const b of biomes) for (const w of b.wildlife) {
    const t2 = CREATURES[w];
    if (t2) pool.push({ t: t2, biome: b.id });
  }
  if (pool.length === 0) throw new CozyWorldError("NO_VALID_CELL", "No wildlife is defined for the selected biomes");
  let candidates = pool.filter((p) => fits(p.t, ctx));
  if (candidates.length === 0) candidates = pool;
  const chosen = rng.weighted(candidates.map((p) => ({
    value: p,
    weight: RARITY_WEIGHTS[p.t.rarity] * (p.t.rarity === "common" ? 1 : 1 + luck * 2)
  })));
  const t = chosen.t;
  return {
    id: rng.id("cre"),
    species: t.species,
    name: rng.pick(CREATURE_NAMES),
    biome: chosen.biome,
    rarity: t.rarity,
    temperament: t.temperament,
    activeTime: [...t.activeTime],
    spawnConditions: { seasons: t.seasons ? [...t.seasons] : "any", weather: t.weather ? [...t.weather] : "any", phases: [...t.activeTime] },
    traits: rng.shuffle(t.traits),
    befriendDifficulty: DIFFICULTY[t.rarity] * rng.int(8, 12)
  };
}

// src/content/items.ts
function generateLoot(rng, opts = {}) {
  const biome = opts.biome ?? null;
  const minRarity = opts.minRarity ?? "common";
  const valid = ITEMS.filter((it) => it.biomes === "any" || biome === null || it.biomes.includes(biome));
  let rarity = rollRarity(rng, opts.luck ?? 0, minRarity);
  let pool = [];
  for (let idx = RARITY_ORDER.indexOf(rarity); idx >= 0; idx--) {
    rarity = RARITY_ORDER[idx];
    pool = valid.filter((it) => it.rarity === rarity);
    if (pool.length > 0) break;
  }
  if (pool.length === 0) pool = valid.filter((it) => rarityAtLeast(it.rarity, minRarity));
  if (pool.length === 0) pool = valid;
  const item = rng.pick(pool);
  const quantity = item.rarity === "common" ? rng.int(1, 5) : item.rarity === "uncommon" ? rng.int(1, 2) : 1;
  return {
    id: rng.id("item"),
    itemId: item.id,
    name: item.name,
    category: item.category,
    rarity: item.rarity,
    quantity,
    value: item.value * quantity,
    biome
  };
}

// src/content/events.ts
function eventApplies(t, ctx) {
  if (t.biomes && !t.biomes.includes(ctx.biome)) return false;
  if (t.weather && ctx.weather && !t.weather.includes(ctx.weather)) return false;
  if (t.seasons && ctx.season && !t.seasons.includes(ctx.season)) return false;
  if (t.phases && ctx.phase && !t.phases.includes(ctx.phase)) return false;
  return true;
}
function generateEvent(rng, ctx, luck = 0) {
  let pool = EVENTS.filter((e) => eventApplies(e, ctx));
  if (pool.length === 0) pool = EVENTS.filter((e) => !e.biomes && !e.weather && !e.seasons && !e.phases);
  const t = rng.weighted(pool.map((e) => ({ value: e, weight: e.weight * (e.rarity === "common" ? 1 : 1 + luck) })));
  const conditions = {};
  if (ctx.weather) conditions.weather = ctx.weather;
  if (ctx.season) conditions.season = ctx.season;
  if (ctx.phase) conditions.phase = ctx.phase;
  return {
    id: rng.id("evt"),
    eventId: t.id,
    title: t.title,
    description: t.description.replace("{place}", ctx.place),
    rarity: t.rarity,
    biome: ctx.biome,
    place: ctx.place,
    startHour: ctx.hour,
    durationHours: rng.int(t.durationHours[0], t.durationHours[1]),
    rewards: t.rewards ? [...t.rewards] : [],
    conditions
  };
}

// src/content/fishing.ts
var KIND_MAP = { [WaterKind.Ocean]: "ocean", [WaterKind.Lake]: "lake", [WaterKind.River]: "river" };
function generateFishingSpot(map, rng, water) {
  const target = water === "ocean" ? WaterKind.Ocean : water === "lake" ? WaterKind.Lake : water === "river" ? WaterKind.River : -1;
  let i;
  try {
    i = pickCell(map, rng, (c) => target === -1 ? map.water[c] !== WaterKind.Land : map.water[c] === target);
  } catch {
    throw new CozyWorldError("NO_VALID_CELL", `This world has no ${water ?? "water"} cells to fish in`);
  }
  const kind = KIND_MAP[map.water[i]];
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i]];
  const pool = FISH.filter((f) => f.water.includes(kind));
  const selected = rng.shuffle(pool).slice(0, Math.max(1, Math.min(pool.length, rng.int(3, 5))));
  const total = selected.reduce((s, f) => s + RARITY_WEIGHTS[f.rarity], 0);
  return {
    id: rng.id("fish"),
    name: `${makeName(rng, kind === "ocean" ? "beach" : "lake")} ${kind === "river" ? "Bend" : "Spot"}`,
    water: kind,
    x,
    y,
    biome,
    fish: selected.map((f) => ({
      species: f.species,
      rarity: f.rarity,
      activeTime: [...f.activeTime],
      seasons: f.seasons ? [...f.seasons] : "any",
      sizeCm: [...f.sizeCm],
      catchChance: RARITY_WEIGHTS[f.rarity] / total
    }))
  };
}
function castLine(spot, rng, phase, season) {
  const active = spot.fish.filter(
    (f2) => (!phase || f2.activeTime.includes(phase)) && (!season || f2.seasons === "any" || f2.seasons.includes(season))
  );
  if (active.length === 0 || !rng.chance(0.7)) return null;
  const f = rng.weighted(active.map((a) => ({ value: a, weight: a.catchChance })));
  return { id: rng.id("catch", 1), species: f.species, rarity: f.rarity, sizeCm: Math.round(rng.float(f.sizeCm[0], f.sizeCm[1]) * 10) / 10 };
}

// src/world.ts
var CozyWorld = class {
  options;
  biomes;
  _map = null;
  root;
  streams = /* @__PURE__ */ new Map();
  hour;
  dayOfYear;
  weatherState = null;
  constructor(options = {}, registry) {
    this.options = resolveOptions(options);
    this.biomes = registry ?? new BiomeRegistry();
    if (this.options.biomes) for (const id of this.options.biomes) this.biomes.get(id);
    this.root = new SeededRandom(this.options.seed);
    this.hour = this.options.time.hour;
    this.dayOfYear = this.options.time.dayOfYear;
  }
  get seed() {
    return this.options.seed;
  }
  stream(name) {
    let s = this.streams.get(name);
    if (!s) {
      s = this.root.fork(name);
      this.streams.set(name, s);
    }
    return s;
  }
  activeBiomes() {
    const ids = this.options.biomes ?? this.biomes.ids();
    return ids.map((id) => this.biomes.get(id));
  }
  /** Generate (once, then cached) the terrain map. */
  generate() {
    if (!this._map) this._map = generateWorldMap(this.options, this.activeBiomes());
    return this._map;
  }
  get map() {
    return this.generate();
  }
  /** Discard the cached map (e.g. after registering biomes). */
  regenerate() {
    this._map = null;
    this.streams.clear();
    return this.generate();
  }
  getCell(x, y) {
    const m = this.map;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= m.width || y >= m.height) {
      throw new CozyWorldError("INVALID_OPTION", `Cell (${x}, ${y}) is outside the ${m.width}x${m.height} world`);
    }
    const i = y * m.width + x;
    return {
      x,
      y,
      elevation: m.heightmap[i],
      temperature: m.temperature[i],
      moisture: m.moisture[i],
      biome: m.biomeKeys[m.biomeIds[i]],
      water: m.water[i],
      traversable: m.traversable[i] === 1,
      regionId: m.regionIds[i]
    };
  }
  generateLocation(opts) {
    return generateLocation(this.map, this.stream("locations"), opts);
  }
  generateDiscovery(opts) {
    return generateDiscovery(this.map, this.stream("discoveries"), opts);
  }
  generateCreature(opts = {}) {
    const pool = opts.biome ? [this.biomes.get(opts.biome)] : this.activeBiomes();
    const env = this.getEnvironment();
    return generateCreature(pool, this.stream("creatures"), {
      season: opts.season ?? env.season.season,
      weather: opts.weather ?? env.weather?.type,
      phase: opts.phase ?? env.dayNight?.phase
    }, opts.luck ?? 0);
  }
  generateLoot(opts) {
    return generateLoot(this.stream("loot"), opts);
  }
  generateEvent(opts = {}) {
    const rng = this.stream("events");
    const biome = opts.biome ?? rng.pick(this.activeBiomes().filter((b) => !b.aquatic).map((b) => b.id));
    const env = this.getEnvironment();
    return generateEvent(rng, {
      biome,
      place: makeName(rng, biome),
      hour: this.hour,
      weather: env.weather?.type,
      season: env.season.season,
      phase: env.dayNight?.phase
    }, opts.luck ?? 0);
  }
  generateFishingSpot(water) {
    return generateFishingSpot(this.map, this.stream("fishing"), water);
  }
  fish(spot) {
    const env = this.getEnvironment();
    return castLine(spot, this.stream("casts"), env.dayNight?.phase, env.season.season);
  }
  /** Current environment (season, day/night, weather). Weather is per world, biased by `biome` if given. */
  getEnvironment(biome) {
    const season = getSeason(this.dayOfYear, this.options.latitude);
    const dayNight = this.options.dayNightCycle ? getDayNight(this.hour, this.dayOfYear, this.options.latitude) : null;
    if (this.options.weather && (!this.weatherState || biome)) {
      const b = this.biomes.get(biome ?? this.activeBiomes().find((x) => !x.aquatic)?.id ?? this.activeBiomes()[0].id);
      this.weatherState = generateWeather(this.stream("weather"), b, season);
    }
    return { time: { dayOfYear: this.dayOfYear, hour: this.hour }, season, dayNight, weather: this.options.weather ? this.weatherState : null };
  }
  /** Advance time; weather re-rolls when its duration elapses. */
  advanceTime(hours) {
    if (!Number.isFinite(hours) || hours < 0) throw new CozyWorldError("INVALID_OPTION", "hours must be a non-negative number");
    let remaining = hours;
    while (remaining > 0) {
      const step = Math.min(remaining, this.weatherState?.durationHours ?? remaining);
      remaining -= step;
      this.hour += step;
      while (this.hour >= 24) {
        this.hour -= 24;
        this.dayOfYear = (this.dayOfYear + 1) % 364;
      }
      if (this.weatherState) {
        this.weatherState = { ...this.weatherState, durationHours: this.weatherState.durationHours - step };
        if (this.weatherState.durationHours <= 0) this.weatherState = null;
      }
    }
    return this.getEnvironment();
  }
  /** JSON-safe snapshot (typed arrays become plain arrays). */
  toJSON() {
    const m = this.map;
    return {
      seed: m.seed,
      width: m.width,
      height: m.height,
      dimension: m.dimension,
      seaLevel: m.seaLevel,
      biomeKeys: m.biomeKeys,
      heightmap: Array.from(m.heightmap, (v) => Math.round(v * 1e4) / 1e4),
      biomeIds: Array.from(m.biomeIds),
      water: Array.from(m.water),
      regions: m.regions,
      features: m.features,
      stats: m.stats
    };
  }
};
function createWorld(options) {
  return new CozyWorld(options);
}

// src/export.ts
function toHeightmapMesh(map, { cellSize = 1, clampWater = true } = {}) {
  const { width: w, height: h } = map;
  const positions = new Float32Array(w * h * 3);
  const colors = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const e = clampWater && map.water[i] !== WaterKind.Land ? Math.max(map.heightmap[i], map.seaLevel) : map.heightmap[i];
    positions.set([x * cellSize, e * map.heightScale, y * cellSize], i * 3);
    colors.set(biomeColor(map, i).map((c) => c / 255), i * 3);
  }
  const indices = new Uint32Array(Math.max(0, (w - 1) * (h - 1) * 6));
  let k = 0;
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const a = y * w + x, b = a + 1, c = a + w, d = c + 1;
    indices.set([a, c, b, b, c, d], k);
    k += 6;
  }
  return { positions, colors, indices, width: w, height: h };
}
var WATER = { 1: [52, 112, 170], 2: [86, 160, 200], 3: [96, 170, 210] };
function biomeColor(map, i) {
  return WATER[map.water[i]] ?? map.biomeColors[map.biomeIds[i]] ?? [120, 170, 90];
}
function toImageData(map) {
  const data = new Uint8ClampedArray(map.width * map.height * 4);
  for (let i = 0; i < map.width * map.height; i++) {
    const [r, g, b] = biomeColor(map, i);
    const shade = 0.75 + map.heightmap[i] * 0.4;
    data[i * 4] = r * shade;
    data[i * 4 + 1] = g * shade;
    data[i * 4 + 2] = b * shade;
    data[i * 4 + 3] = 255;
  }
  return { data, width: map.width, height: map.height };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BUILTIN_BIOMES,
  BiomeRegistry,
  CozyWorld,
  CozyWorldError,
  DEFAULT_TERRAIN,
  Noise2D,
  SeededRandom,
  WaterKind,
  createWorld,
  generateWeather,
  getDayNight,
  getSeason,
  hashSeed,
  resolveOptions,
  selectBiome,
  toHeightmapMesh,
  toImageData,
  validateBiome
});
