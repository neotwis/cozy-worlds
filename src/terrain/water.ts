import type { SeededRandom } from "../core/random.js";
import { WaterKind } from "../types/index.js";

const N4X = [1, -1, 0, 0];
const N4Y = [0, 0, 1, -1];

/** Mark cells below sea level, then split into ocean (border-connected) and lakes. */
export function classifyWater(heightmap: Float32Array, width: number, height: number, seaLevel: number): Uint8Array {
  const n = width * height;
  const water = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < n; i++) if ((heightmap[i] as number) < seaLevel) water[i] = WaterKind.Lake;
  // Seed BFS from border water.
  for (let x = 0; x < width; x++) {
    for (const y of height > 1 ? [0, height - 1] : [0]) {
      const i = y * width + x;
      if (water[i] === WaterKind.Lake) { water[i] = WaterKind.Ocean; queue[tail++] = i; }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of width > 1 ? [0, width - 1] : [0]) {
      const i = y * width + x;
      if (water[i] === WaterKind.Lake) { water[i] = WaterKind.Ocean; queue[tail++] = i; }
    }
  }
  while (head < tail) {
    const i = queue[head++] as number;
    const x = i % width;
    const y = (i - x) / width;
    for (let k = 0; k < 4; k++) {
      const nx = x + (N4X[k] as number);
      const ny = y + (N4Y[k] as number);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (water[j] === WaterKind.Lake) { water[j] = WaterKind.Ocean; queue[tail++] = j; }
    }
  }
  return water;
}

/** Fill a small basin around (sx, sy) with lake water, flattening its surface. */
export function fillBasin(
  heightmap: Float32Array, water: Uint8Array, width: number, height: number,
  sx: number, sy: number, depth: number, maxCells: number,
): number {
  const start = sy * width + sx;
  const level = (heightmap[start] as number) + depth;
  const stack: number[] = [start];
  const seen = new Set<number>([start]);
  let filled = 0;
  while (stack.length > 0 && filled < maxCells) {
    const i = stack.pop() as number;
    if (water[i] !== WaterKind.Land || (heightmap[i] as number) > level) continue;
    water[i] = WaterKind.Lake;
    filled++;
    const x = i % width;
    const y = (i - x) / width;
    for (let k = 0; k < 4; k++) {
      const nx = x + (N4X[k] as number);
      const ny = y + (N4Y[k] as number);
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const j = ny * width + nx;
      if (!seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return filled;
}

/** Add `count` inland lakes in low-lying land. Returns lakes created. */
export function carveLakes(
  heightmap: Float32Array, water: Uint8Array, width: number, height: number,
  seaLevel: number, count: number, rng: SeededRandom,
): number {
  if (count <= 0 || width < 5 || height < 5) return 0;
  const maxCells = Math.max(4, Math.floor((width * height) / 120));
  let made = 0;
  for (let attempt = 0; attempt < count * 30 && made < count; attempt++) {
    const x = rng.int(2, width - 3);
    const y = rng.int(2, height - 3);
    const i = y * width + x;
    const h = heightmap[i] as number;
    if (water[i] !== WaterKind.Land || h > seaLevel + (1 - seaLevel) * 0.45) continue;
    if (fillBasin(heightmap, water, width, height, x, y, rng.float(0.01, 0.03), maxCells) >= 3) made++;
  }
  return made;
}

/**
 * Trace rivers from high land downhill (steepest 8-neighbor descent) until
 * they reach water. Rivers ending in a pit create a small lake.
 */
export function carveRivers(
  heightmap: Float32Array, water: Uint8Array, width: number, height: number,
  seaLevel: number, count: number, rng: SeededRandom,
): number {
  if (count <= 0 || width < 3 || height < 3) return 0;
  const minSource = seaLevel + (1 - seaLevel) * 0.45;
  const maxSteps = (width + height) * 3;
  let made = 0;
  for (let attempt = 0; attempt < count * 40 && made < count; attempt++) {
    let x = rng.int(1, width - 2);
    let y = rng.int(1, height - 2);
    let i = y * width + x;
    if (water[i] !== WaterKind.Land || (heightmap[i] as number) < minSource) continue;
    const path: number[] = [];
    const visited = new Set<number>();
    let reachedWater = false;
    for (let step = 0; step < maxSteps; step++) {
      path.push(i);
      visited.add(i);
      let best = -1;
      let bestH = heightmap[i] as number;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = ny * width + nx;
          if (visited.has(j)) continue;
          if (water[j] !== WaterKind.Land) { best = j; bestH = -1; break; }
          const hj = heightmap[j] as number;
          if (hj < bestH) { bestH = hj; best = j; }
        }
        if (bestH === -1) break;
      }
      if (best === -1) {
        // Pit: pool into a small lake.
        fillBasin(heightmap, water, width, height, x, y, 0.01, 12);
        break;
      }
      if (water[best] !== WaterKind.Land) { reachedWater = true; break; }
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
