import { Noise2D } from "../core/noise.js";
import { SeededRandom } from "../core/random.js";
import { selectBiome } from "../biomes/registry.js";
import type { BiomeDefinition, ResolvedOptions, WorldFeature, WorldMap } from "../types/index.js";
import { WaterKind } from "../types/index.js";
import { generateHeightmap } from "./heightmap.js";
import { carveLakes, carveRivers, classifyWater } from "./water.js";
import { computeTraversable, labelRegions } from "./regions.js";

const now = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

/** Run the full terrain → water → climate → biome → regions → vegetation pipeline. */
export function generateWorldMap(opts: ResolvedOptions, biomes: readonly BiomeDefinition[], seasonOffset = 0): WorldMap {
  const start = now();
  const { width, height, terrain } = opts;
  const n = width * height;
  const root = new SeededRandom(opts.seed);
  const terrainRng = root.fork("terrain");

  const heightmap = generateHeightmap(width, height, terrain, terrainRng.fork("heightmap"));
  const water = classifyWater(heightmap, width, height, terrain.seaLevel);
  carveLakes(heightmap, water, width, height, terrain.seaLevel, terrain.lakeCount, terrainRng.fork("lakes"));
  carveRivers(heightmap, water, width, height, terrain.seaLevel, terrain.riverCount, terrainRng.fork("rivers"));

  // Climate fields.
  const climateRng = root.fork("climate");
  const tNoise = new Noise2D(climateRng.fork("temperature"));
  const mNoise = new Noise2D(climateRng.fork("moisture"));
  const temperature = new Float32Array(n);
  const moisture = new Float32Array(n);
  const span = Math.max(width, height);
  const sea = terrain.seaLevel;
  for (let y = 0; y < height; y++) {
    const lat = height === 1 ? 0.5 : y / (height - 1);
    const latTemp = 1 - Math.abs(lat - 0.5) * 1.2; // warm equator band in the middle
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const h = heightmap[i] as number;
      const above = h > sea ? (h - sea) / (1 - sea || 1) : 0;
      const tn = tNoise.fbm((x / span) * 2, (y / span) * 2, { octaves: 3 }) * 0.35;
      let t = latTemp * 0.7 + 0.15 + tn - above * 0.55 + seasonOffset * 0.08;
      temperature[i] = t < 0 ? 0 : t > 1 ? 1 : t;
      let m = mNoise.fbm((x / span) * 2.5, (y / span) * 2.5, { octaves: 4 }) * 0.6 + 0.5;
      if (water[i] !== WaterKind.Land) m += 0.2;
      moisture[i] = m < 0 ? 0 : m > 1 ? 1 : m;
    }
  }
  // Moisture spreads one cell from rivers/lakes.
  for (let i = 0; i < n; i++) {
    if (water[i] === WaterKind.River || water[i] === WaterKind.Lake) {
      const x = i % width;
      for (const j of [x + 1 < width ? i + 1 : -1, x > 0 ? i - 1 : -1, i + width < n ? i + width : -1, i - width]) {
        if (j >= 0 && water[j] === WaterKind.Land) moisture[j] = Math.min(1, (moisture[j] as number) + 0.12);
      }
    }
  }

  // Biomes.
  const biomeKeys = biomes.map((b) => b.id);
  const biomeIds = new Uint8Array(n);
  const counts: Record<string, number> = Object.fromEntries(biomeKeys.map((k) => [k, 0]));
  for (let i = 0; i < n; i++) {
    const h = heightmap[i] as number;
    const isWater = water[i] !== WaterKind.Land;
    const above = isWater ? 0 : (h - sea) / (1 - sea || 1);
    const b = selectBiome(biomes, temperature[i] as number, moisture[i] as number, above, isWater);
    const idx = biomeKeys.indexOf(b.id);
    biomeIds[i] = idx;
    counts[b.id] = (counts[b.id] ?? 0) + 1;
  }

  const traversable = computeTraversable(heightmap, water, width, height, terrain.maxTraversableSlope);
  const { regionIds, regions } = labelRegions(traversable, biomeIds, biomeKeys, width, height);

  // Vegetation/object placement.
  const vegRng = root.fork("vegetation");
  const features: WorldFeature[] = [];
  const objectTypes = new Set(["boulder", "driftwood", "fallen_log", "seashell_pile", "sandstone_rock", "crystal_outcrop", "snow_drift", "ice_crystal"]);
  if (opts.vegetationDensity > 0 && opts.maxFeatures > 0) {
    outer: for (let i = 0; i < n; i++) {
      const b = biomes[biomeIds[i] as number] as BiomeDefinition;
      const isWater = water[i] !== WaterKind.Land;
      // Aquatic vegetation only in lakes; land vegetation only on land.
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
            z: (isWater ? sea : (heightmap[i] as number)) * terrain.heightScale,
            rotation: vegRng.float(0, Math.PI * 2),
            scale: vegRng.float(0.75, 1.3),
          });
          if (features.length >= opts.maxFeatures) break outer;
          break; // at most one feature per cell
        }
      }
    }
  }

  let land = 0, ocean = 0, lake = 0, river = 0, trav = 0;
  for (let i = 0; i < n; i++) {
    const w = water[i];
    if (w === WaterKind.Land) land++; else if (w === WaterKind.Ocean) ocean++; else if (w === WaterKind.Lake) lake++; else river++;
    if (traversable[i] === 1) trav++;
  }

  return {
    seed: opts.seed,
    width, height,
    dimension: opts.dimension,
    seaLevel: sea,
    heightScale: terrain.heightScale,
    heightmap, temperature, moisture, biomeIds, biomeKeys, biomeColors: biomes.map((b) => [...b.color] as [number, number, number]), water, traversable, regionIds, regions, features,
    stats: {
      landCells: land, oceanCells: ocean, lakeCells: lake, riverCells: river, traversableCells: trav,
      biomeCounts: counts,
      generationMs: Math.round((now() - start) * 100) / 100,
    },
  };
}
