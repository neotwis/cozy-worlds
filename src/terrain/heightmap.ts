import { Noise2D } from "../core/noise.js";
import type { SeededRandom } from "../core/random.js";
import type { TerrainOptions } from "../types/index.js";
import { islandMask } from "./islands.js";

/**
 * Generate an elevation field in [0, 1] combining fBm hills, ridged
 * mountains, optional island falloff and a redistribution curve for plains.
 */
export function generateHeightmap(
  width: number,
  height: number,
  opts: TerrainOptions,
  rng: SeededRandom,
): Float32Array {
  const base = new Noise2D(rng.fork("base"));
  const ridge = new Noise2D(rng.fork("ridge"));
  const out = new Float32Array(width * height);
  const span = Math.max(width, height);
  const fbm = { octaves: opts.octaves, persistence: opts.persistence, lacunarity: opts.lacunarity };
  const mi = opts.mountainIntensity;
  // Random offset so different seeds sample different noise regions.
  const ox = rng.float(0, 1000);
  const oy = rng.float(0, 1000);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / span) * opts.scale + ox;
      const ny = (y / span) * opts.scale + oy;
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
