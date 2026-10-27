import type { SeededRandom } from "../core/random.js";
import { CozyWorldError } from "../core/validation.js";
import type { DayPhase, Rarity, Season, WorldMap } from "../types/index.js";
import { WaterKind } from "../types/index.js";
import { pickCell } from "./common.js";
import { makeName } from "./locations.js";
import { FISH, RARITY_WEIGHTS } from "./tables.js";

export type FishingWater = "lake" | "river" | "ocean";

export interface FishSpecies {
  species: string;
  rarity: Rarity;
  activeTime: DayPhase[];
  seasons: Season[] | "any";
  sizeCm: [number, number];
  /** Catch chance relative to other fish at this spot (sums to 1). */
  catchChance: number;
}

export interface FishingSpot {
  id: string;
  name: string;
  water: FishingWater;
  x: number;
  y: number;
  biome: string;
  fish: FishSpecies[];
}

export interface CaughtFish {
  id: string;
  species: string;
  rarity: Rarity;
  sizeCm: number;
}

const KIND_MAP: Record<number, FishingWater> = { [WaterKind.Ocean]: "ocean", [WaterKind.Lake]: "lake", [WaterKind.River]: "river" };

export function generateFishingSpot(map: WorldMap, rng: SeededRandom, water?: FishingWater): FishingSpot {
  const target = water === "ocean" ? WaterKind.Ocean : water === "lake" ? WaterKind.Lake : water === "river" ? WaterKind.River : -1;
  let i: number;
  try {
    i = pickCell(map, rng, (c) => (target === -1 ? map.water[c] !== WaterKind.Land : map.water[c] === target));
  } catch {
    throw new CozyWorldError("NO_VALID_CELL", `This world has no ${water ?? "water"} cells to fish in`);
  }
  const kind = KIND_MAP[map.water[i] as number] as FishingWater;
  const x = i % map.width;
  const y = (i - x) / map.width;
  const biome = map.biomeKeys[map.biomeIds[i] as number] as string;
  const pool = FISH.filter((f) => f.water.includes(kind));
  const selected = rng.shuffle(pool).slice(0, Math.max(1, Math.min(pool.length, rng.int(3, 5))));
  const total = selected.reduce((s, f) => s + RARITY_WEIGHTS[f.rarity], 0);
  return {
    id: rng.id("fish"),
    name: `${makeName(rng, kind === "ocean" ? "beach" : "lake")} ${kind === "river" ? "Bend" : "Spot"}`,
    water: kind,
    x, y, biome,
    fish: selected.map((f) => ({
      species: f.species,
      rarity: f.rarity,
      activeTime: [...f.activeTime],
      seasons: f.seasons ? [...f.seasons] : "any",
      sizeCm: [...f.sizeCm] as [number, number],
      catchChance: RARITY_WEIGHTS[f.rarity] / total,
    })),
  };
}

/** Simulate a catch at a spot for the given time/season. Returns null when nothing bites. */
export function castLine(spot: FishingSpot, rng: SeededRandom, phase?: DayPhase, season?: Season): CaughtFish | null {
  const active = spot.fish.filter(
    (f) => (!phase || f.activeTime.includes(phase)) && (!season || f.seasons === "any" || f.seasons.includes(season)),
  );
  if (active.length === 0 || !rng.chance(0.7)) return null;
  const f = rng.weighted(active.map((a) => ({ value: a, weight: a.catchChance })));
  return { id: rng.id("catch", 1), species: f.species, rarity: f.rarity, sizeCm: Math.round(rng.float(f.sizeCm[0], f.sizeCm[1]) * 10) / 10 };
}
