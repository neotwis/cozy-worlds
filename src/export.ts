import type { WorldMap } from "./types/index.js";
import { WaterKind } from "./types/index.js";

/** Renderer-agnostic triangle mesh (works with Three.js BufferGeometry, Babylon, etc). */
export function toHeightmapMesh(map: WorldMap, { cellSize = 1, clampWater = true } = {}) {
  const { width: w, height: h } = map;
  const positions = new Float32Array(w * h * 3);
  const colors = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const e = clampWater && map.water[i] !== WaterKind.Land ? Math.max(map.heightmap[i]!, map.seaLevel) : map.heightmap[i]!;
    positions.set([x * cellSize, e * map.heightScale, y * cellSize], i * 3);
    colors.set(biomeColor(map, i).map((c) => c / 255), i * 3);
  }
  const indices = new Uint32Array(Math.max(0, (w - 1) * (h - 1) * 6));
  let k = 0;
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const a = y * w + x, b = a + 1, c = a + w, d = c + 1;
    indices.set([a, c, b, b, c, d], k); k += 6;
  }
  return { positions, colors, indices, width: w, height: h };
}

const WATER: Record<number, [number, number, number]> = { 1: [52, 112, 170], 2: [86, 160, 200], 3: [96, 170, 210] };

function biomeColor(map: WorldMap, i: number): [number, number, number] {
  return WATER[map.water[i]!] ?? map.biomeColors[map.biomeIds[i]!] ?? [120, 170, 90];
}

/** RGBA pixels (one per cell) for a 2D canvas: `new ImageData(data, width, height)`. */
export function toImageData(map: WorldMap): { data: Uint8ClampedArray; width: number; height: number } {
  const data = new Uint8ClampedArray(map.width * map.height * 4);
  for (let i = 0; i < map.width * map.height; i++) {
    const [r, g, b] = biomeColor(map, i);
    const shade = 0.75 + map.heightmap[i]! * 0.4;
    data[i * 4] = r * shade; data[i * 4 + 1] = g * shade; data[i * 4 + 2] = b * shade; data[i * 4 + 3] = 255;
  }
  return { data, width: map.width, height: map.height };
}
