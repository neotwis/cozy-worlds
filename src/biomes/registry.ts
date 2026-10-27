import type { BiomeDefinition } from "../types/index.js";
import { CozyWorldError, assertRange } from "../core/validation.js";
import { BUILTIN_BIOMES } from "./builtin.js";

const ID_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/;

function cloneBiome(b: BiomeDefinition): BiomeDefinition {
  return {
    ...b,
    temperature: [...b.temperature],
    moisture: [...b.moisture],
    elevation: [...b.elevation],
    vegetation: b.vegetation.map((v) => ({ ...v })),
    resources: [...b.resources],
    wildlife: [...b.wildlife],
    weather: { ...b.weather },
    color: [...b.color],
  };
}

export function validateBiome(b: BiomeDefinition): void {
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

/** A per-world, mutable set of biome definitions. */
export class BiomeRegistry {
  private readonly biomes = new Map<string, BiomeDefinition>();

  constructor(initial: readonly BiomeDefinition[] = BUILTIN_BIOMES) {
    for (const b of initial) this.register(b);
  }

  register(biome: BiomeDefinition, { replace = false } = {}): void {
    validateBiome(biome);
    if (this.biomes.has(biome.id) && !replace) {
      throw new CozyWorldError("DUPLICATE_BIOME", `Biome "${biome.id}" is already registered (pass { replace: true } to override)`);
    }
    if (!this.biomes.has(biome.id) && this.biomes.size >= 255) {
      throw new CozyWorldError("INVALID_BIOME", "A registry supports at most 255 biomes");
    }
    this.biomes.set(biome.id, cloneBiome(biome));
  }

  unregister(id: string): boolean {
    return this.biomes.delete(id);
  }

  has(id: string): boolean {
    return this.biomes.has(id);
  }

  get(id: string): BiomeDefinition {
    const b = this.biomes.get(id);
    if (!b) throw new CozyWorldError("UNKNOWN_BIOME", `Unknown biome "${id}". Registered: ${this.ids().join(", ")}`);
    return cloneBiome(b);
  }

  /** Internal fast access without cloning. */
  peek(id: string): BiomeDefinition | undefined {
    return this.biomes.get(id);
  }

  ids(): string[] {
    return [...this.biomes.keys()];
  }

  list(): BiomeDefinition[] {
    return [...this.biomes.values()].map(cloneBiome);
  }
}

function rangeDistance(v: number, [lo, hi]: [number, number]): number {
  if (v < lo) return lo - v;
  if (v > hi) return v - hi;
  return 0;
}

/**
 * Choose the best-fitting biome for a cell. Aquatic biomes are preferred for
 * water cells; land biomes for land. Falls back to the other group when the
 * preferred group is empty.
 */
export function selectBiome(
  candidates: readonly BiomeDefinition[],
  temperature: number,
  moisture: number,
  elevationAboveSea: number,
  isWater: boolean,
): BiomeDefinition {
  let pool = candidates.filter((b) => Boolean(b.aquatic) === isWater);
  if (pool.length === 0) pool = candidates as BiomeDefinition[];
  let best = pool[0] as BiomeDefinition;
  let bestScore = Infinity;
  for (const b of pool) {
    const d =
      rangeDistance(temperature, b.temperature) * 1.2 +
      rangeDistance(moisture, b.moisture) +
      rangeDistance(elevationAboveSea, b.elevation) * 2;
    // Smaller distance wins; priority breaks ties and gives a small bonus when fitting.
    const score = d - (d === 0 ? (b.priority ?? 0) * 0.01 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = b;
    }
  }
  return best;
}
