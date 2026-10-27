import type { SeededRandom } from "../core/random.js";
import { CozyWorldError } from "../core/validation.js";
import type { BiomeDefinition, DayPhase, Rarity, Season, WeatherType } from "../types/index.js";
import { CREATURES, CREATURE_NAMES, RARITY_WEIGHTS, type CreatureTemplate } from "./tables.js";

export interface Creature {
  id: string;
  species: string;
  name: string;
  biome: string;
  rarity: Rarity;
  temperament: CreatureTemplate["temperament"];
  activeTime: DayPhase[];
  spawnConditions: { seasons: Season[] | "any"; weather: WeatherType[] | "any"; phases: DayPhase[] };
  traits: string[];
  /** Friendship points needed to befriend, scaled by rarity. */
  befriendDifficulty: number;
}

export interface CreatureContext {
  season?: Season;
  weather?: WeatherType;
  phase?: DayPhase;
}

const DIFFICULTY: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 4, epic: 7, legendary: 10 };

function fits(t: CreatureTemplate, ctx: CreatureContext): boolean {
  if (ctx.season && t.seasons && !t.seasons.includes(ctx.season)) return false;
  if (ctx.weather && t.weather && !t.weather.includes(ctx.weather)) return false;
  if (ctx.phase && !t.activeTime.includes(ctx.phase)) return false;
  return true;
}

/**
 * Generate a creature from a biome's wildlife list. When context is given,
 * only species whose spawn conditions match are considered; if none match,
 * conditions are relaxed so a creature is always returned.
 */
export function generateCreature(
  biomes: readonly BiomeDefinition[], rng: SeededRandom, ctx: CreatureContext = {}, luck = 0,
): Creature {
  const pool: { t: CreatureTemplate; biome: string }[] = [];
  for (const b of biomes) for (const w of b.wildlife) {
    const t = CREATURES[w];
    if (t) pool.push({ t, biome: b.id });
  }
  if (pool.length === 0) throw new CozyWorldError("NO_VALID_CELL", "No wildlife is defined for the selected biomes");
  let candidates = pool.filter((p) => fits(p.t, ctx));
  if (candidates.length === 0) candidates = pool;
  const chosen = rng.weighted(candidates.map((p) => ({
    value: p,
    weight: RARITY_WEIGHTS[p.t.rarity] * (p.t.rarity === "common" ? 1 : 1 + luck * 2),
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
    befriendDifficulty: DIFFICULTY[t.rarity] * rng.int(8, 12),
  };
}
