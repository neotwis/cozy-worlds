import type { CozyWorldOptions, ResolvedOptions, TerrainOptions } from "../types/index.js";
import { CozyWorldError, assertBoolean, assertInteger, assertNumber } from "./validation.js";

export const DEFAULT_TERRAIN: TerrainOptions = {
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
  maxTraversableSlope: 0.06,
};

export const MAX_DIMENSION = 4096;
export const DEFAULT_MAX_CELLS = 2048 * 2048;

export function resolveOptions(input: CozyWorldOptions = {}): ResolvedOptions {
  if (input === null || typeof input !== "object") {
    throw new CozyWorldError("INVALID_OPTION", "Options must be an object");
  }
  const seed = input.seed ?? "cozy";
  if (typeof seed !== "string" && !(typeof seed === "number" && Number.isFinite(seed))) {
    throw new CozyWorldError("INVALID_OPTION", "\"seed\" must be a string or finite number");
  }
  const size = input.size ?? 128;
  assertInteger("size", size, 1, MAX_DIMENSION);
  const width = assertInteger("width", input.width ?? size, 1, MAX_DIMENSION);
  const height = assertInteger("height", input.height ?? size, 1, MAX_DIMENSION);
  const maxCells = assertInteger("maxCells", input.maxCells ?? DEFAULT_MAX_CELLS, 1, MAX_DIMENSION * MAX_DIMENSION);
  if (width * height > maxCells) {
    throw new CozyWorldError(
      "WORLD_TOO_LARGE",
      `World of ${width}x${height} (${width * height} cells) exceeds maxCells=${maxCells}. ` +
        `Each cell uses ~19 bytes; raise maxCells explicitly if you accept the memory cost.`,
    );
  }
  const dimension = input.dimension ?? "2d";
  if (dimension !== "2d" && dimension !== "3d") {
    throw new CozyWorldError("INVALID_OPTION", "\"dimension\" must be \"2d\" or \"3d\"");
  }
  let biomes: string[] | null = null;
  if (input.biomes !== undefined) {
    if (!Array.isArray(input.biomes) || input.biomes.length === 0 || input.biomes.some((b) => typeof b !== "string")) {
      throw new CozyWorldError("INVALID_OPTION", "\"biomes\" must be a non-empty array of biome ids");
    }
    biomes = [...new Set(input.biomes)];
  }
  const t = { ...DEFAULT_TERRAIN, ...(input.terrain ?? {}) };
  assertNumber("terrain.scale", t.scale, 0.01, 1000);
  assertInteger("terrain.octaves", t.octaves, 1, 12);
  assertNumber("terrain.persistence", t.persistence, 0, 1);
  assertNumber("terrain.lacunarity", t.lacunarity, 1, 4);
  assertNumber("terrain.seaLevel", t.seaLevel, 0, 1);
  assertBoolean("terrain.island", t.island);
  assertNumber("terrain.islandFalloff", t.islandFalloff, 0, 3);
  assertNumber("terrain.mountainIntensity", t.mountainIntensity, 0, 1);
  assertNumber("terrain.redistribution", t.redistribution, 0.1, 5);
  assertInteger("terrain.riverCount", t.riverCount, 0, 1000);
  assertInteger("terrain.lakeCount", t.lakeCount, 0, 1000);
  assertNumber("terrain.heightScale", t.heightScale, 0, 100000);
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
    maxFeatures: assertInteger("maxFeatures", input.maxFeatures ?? 50000, 0, 10_000_000),
    maxCells,
  };
}
