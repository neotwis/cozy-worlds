import type { SeededRandom } from "../core/random.js";
import type { DayPhase, Rarity, Season, WeatherType } from "../types/index.js";
import { EVENTS, type EventTemplate } from "./tables.js";

export interface WorldEvent {
  id: string;
  eventId: string;
  title: string;
  description: string;
  rarity: Rarity;
  biome: string;
  place: string;
  startHour: number;
  durationHours: number;
  rewards: string[];
  conditions: { weather?: WeatherType; season?: Season; phase?: DayPhase };
}

export interface EventContext {
  biome: string;
  place: string;
  hour: number;
  weather?: WeatherType;
  season?: Season;
  phase?: DayPhase;
}

export function eventApplies(t: EventTemplate, ctx: EventContext): boolean {
  if (t.biomes && !t.biomes.includes(ctx.biome)) return false;
  if (t.weather && ctx.weather && !t.weather.includes(ctx.weather)) return false;
  if (t.seasons && ctx.season && !t.seasons.includes(ctx.season)) return false;
  if (t.phases && ctx.phase && !t.phases.includes(ctx.phase)) return false;
  return true;
}

/** Pick an event whose conditions match the context (unconditioned events always qualify). */
export function generateEvent(rng: SeededRandom, ctx: EventContext, luck = 0): WorldEvent {
  let pool = EVENTS.filter((e) => eventApplies(e, ctx));
  if (pool.length === 0) pool = EVENTS.filter((e) => !e.biomes && !e.weather && !e.seasons && !e.phases);
  const t = rng.weighted(pool.map((e) => ({ value: e, weight: e.weight * (e.rarity === "common" ? 1 : 1 + luck) })));
  const conditions: WorldEvent["conditions"] = {};
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
    conditions,
  };
}
