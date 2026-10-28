import type { Region } from "../types/index.js";
import { WaterKind } from "../types/index.js";


export function computeTraversable(
  heightmap: Float32Array, water: Uint8Array, width: number, height: number, maxSlope: number,
): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (water[i] !== WaterKind.Land) continue;
      const h = heightmap[i] as number;
      let steep = false;
      if (x + 1 < width && Math.abs((heightmap[i + 1] as number) - h) > maxSlope) steep = true;
      if (x > 0 && Math.abs((heightmap[i - 1] as number) - h) > maxSlope) steep = true;
      if (y + 1 < height && Math.abs((heightmap[i + width] as number) - h) > maxSlope) steep = true;
      if (y > 0 && Math.abs((heightmap[i - width] as number) - h) > maxSlope) steep = true;
      if (!steep) out[i] = 1;
    }
  }
  return out;
}

/** 4-connected flood fill over traversable cells. Regions sorted by id (discovery order). */
export function labelRegions(
  traversable: Uint8Array, biomeIds: Uint8Array, biomeKeys: readonly string[], width: number, height: number,
): { regionIds: Int32Array; regions: Region[] } {
  const n = width * height;
  const regionIds = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  const regions: Region[] = [];
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
      const i = queue[head++] as number;
      const x = i % width;
      const y = (i - x) / width;
      size++; sx += x; sy += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      counts[biomeIds[i] as number]!++;
      const nb = [x + 1 < width ? i + 1 : -1, x > 0 ? i - 1 : -1, y + 1 < height ? i + width : -1, y > 0 ? i - width : -1];
      for (const j of nb) {
        if (j >= 0 && traversable[j] === 1 && regionIds[j] === -1) { regionIds[j] = id; queue[tail++] = j; }
      }
    }
    let dom = 0;
    for (let b = 1; b < counts.length; b++) if ((counts[b] as number) > (counts[dom] as number)) dom = b;
    regions.push({
      id, size,
      dominantBiome: biomeKeys[dom] as string,
      centroid: { x: sx / size, y: sy / size },
      bounds: { minX, minY, maxX, maxY },
    });
  }
  return { regionIds, regions };
}
