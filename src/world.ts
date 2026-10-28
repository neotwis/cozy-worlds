import { SeededRandom } from "./core/random.js";
import { resolveOptions } from "./core/options.js";
import { CozyWorldError } from "./core/validation.js";
import { BiomeRegistry } from "./biomes/registry.js";
import { generateWorldMap } from "./terrain/generate.js";
import { getSeason } from "./environment/seasons.js";
import { getDayNight } from "./environment/day-night.js";
import { generateWeather } from "./environment/weather.js";
import { generateLocation, generateDiscovery, makeName, type Location, type LocationOptions } from "./content/locations.js";
import { generateCreature, type Creature, type CreatureContext } from "./content/creatures.js";
import { generateLoot, type LootItem, type LootOptions } from "./content/items.js";
import { generateEvent, type WorldEvent } from "./content/events.js";
import { generateFishingSpot, castLine, type FishingSpot, type FishingWater, type CaughtFish } from "./content/fishing.js";
import type {
  BiomeDefinition, CozyWorldOptions, EnvironmentState, ResolvedOptions, WeatherState, WorldCell, WorldMap,
} from "./types/index.js";
import { WaterKind } from "./types/index.js";


export class CozyWorld {
  readonly options: ResolvedOptions;
  readonly biomes: BiomeRegistry;
  private _map: WorldMap | null = null;
  private readonly root: SeededRandom;
  private readonly streams = new Map<string, SeededRandom>();
  private hour: number;
  private dayOfYear: number;
  private weatherState: WeatherState | null = null;

  constructor(options: CozyWorldOptions = {}, registry?: BiomeRegistry) {
    this.options = resolveOptions(options);
    this.biomes = registry ?? new BiomeRegistry();
    if (this.options.biomes) for (const id of this.options.biomes) this.biomes.get(id); // validates
    this.root = new SeededRandom(this.options.seed);
    this.hour = this.options.time.hour;
    this.dayOfYear = this.options.time.dayOfYear;
  }

  get seed() { return this.options.seed; }

  private stream(name: string): SeededRandom {
    let s = this.streams.get(name);
    if (!s) { s = this.root.fork(name); this.streams.set(name, s); }
    return s;
  }

  private activeBiomes(): BiomeDefinition[] {
    const ids = this.options.biomes ?? this.biomes.ids();
    return ids.map((id) => this.biomes.get(id));
  }

  /** Generate (once, then cached) the terrain map. */
  generate(): WorldMap {
    if (!this._map) this._map = generateWorldMap(this.options, this.activeBiomes());
    return this._map;
  }

  get map(): WorldMap { return this.generate(); }

  /** Discard the cached map (e.g. after registering biomes). */
  regenerate(): WorldMap { this._map = null; this.streams.clear(); return this.generate(); }

  getCell(x: number, y: number): WorldCell {
    const m = this.map;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= m.width || y >= m.height) {
      throw new CozyWorldError("INVALID_OPTION", `Cell (${x}, ${y}) is outside the ${m.width}x${m.height} world`);
    }
    const i = y * m.width + x;
    return {
      x, y,
      elevation: m.heightmap[i]!, temperature: m.temperature[i]!, moisture: m.moisture[i]!,
      biome: m.biomeKeys[m.biomeIds[i]!]!, water: m.water[i] as WaterKind,
      traversable: m.traversable[i] === 1, regionId: m.regionIds[i]!,
    };
  }

  generateLocation(opts?: LocationOptions): Location { return generateLocation(this.map, this.stream("locations"), opts); }
  generateDiscovery(opts?: LocationOptions): Location { return generateDiscovery(this.map, this.stream("discoveries"), opts); }

  generateCreature(opts: CreatureContext & { biome?: string; luck?: number } = {}): Creature {
    const pool = opts.biome ? [this.biomes.get(opts.biome)] : this.activeBiomes();
    const env = this.getEnvironment();
    return generateCreature(pool, this.stream("creatures"), {
      season: opts.season ?? env.season.season,
      weather: opts.weather ?? env.weather?.type,
      phase: opts.phase ?? env.dayNight?.phase,
    }, opts.luck ?? 0);
  }

  generateLoot(opts?: LootOptions): LootItem { return generateLoot(this.stream("loot"), opts); }

  generateEvent(opts: { biome?: string; luck?: number } = {}): WorldEvent {
    const rng = this.stream("events");
    const biome = opts.biome ?? rng.pick(this.activeBiomes().filter((b) => !b.aquatic).map((b) => b.id));
    const env = this.getEnvironment();
    return generateEvent(rng, {
      biome, place: makeName(rng, biome), hour: this.hour,
      weather: env.weather?.type, season: env.season.season, phase: env.dayNight?.phase,
    }, opts.luck ?? 0);
  }

  generateFishingSpot(water?: FishingWater): FishingSpot { return generateFishingSpot(this.map, this.stream("fishing"), water); }

  fish(spot: FishingSpot): CaughtFish | null {
    const env = this.getEnvironment();
    return castLine(spot, this.stream("casts"), env.dayNight?.phase, env.season.season);
  }

  /** Current environment (season, day/night, weather). Weather is per world, biased by `biome` if given. */
  getEnvironment(biome?: string): EnvironmentState {
    const season = getSeason(this.dayOfYear, this.options.latitude);
    const dayNight = this.options.dayNightCycle ? getDayNight(this.hour, this.dayOfYear, this.options.latitude) : null;
    if (this.options.weather && (!this.weatherState || biome)) {
      const b = this.biomes.get(biome ?? this.activeBiomes().find((x) => !x.aquatic)?.id ?? this.activeBiomes()[0]!.id);
      this.weatherState = generateWeather(this.stream("weather"), b, season);
    }
    return { time: { dayOfYear: this.dayOfYear, hour: this.hour }, season, dayNight, weather: this.options.weather ? this.weatherState : null };
  }

  /** Advance time; weather re-rolls when its duration elapses. */
  advanceTime(hours: number): EnvironmentState {
    if (!Number.isFinite(hours) || hours < 0) throw new CozyWorldError("INVALID_OPTION", "hours must be a non-negative number");
    let remaining = hours;
    while (remaining > 0) {
      const step = Math.min(remaining, this.weatherState?.durationHours ?? remaining);
      remaining -= step;
      this.hour += step;
      while (this.hour >= 24) { this.hour -= 24; this.dayOfYear = (this.dayOfYear + 1) % 364; }
      if (this.weatherState) {
        this.weatherState = { ...this.weatherState, durationHours: this.weatherState.durationHours - step };
        if (this.weatherState.durationHours <= 0) this.weatherState = null;
      }
    }
    return this.getEnvironment();
  }

  /** JSON-safe snapshot (typed arrays become plain arrays). */
  toJSON() {
    const m = this.map;
    return {
      seed: m.seed, width: m.width, height: m.height, dimension: m.dimension, seaLevel: m.seaLevel,
      biomeKeys: m.biomeKeys, heightmap: Array.from(m.heightmap, (v) => Math.round(v * 1e4) / 1e4),
      biomeIds: Array.from(m.biomeIds), water: Array.from(m.water), regions: m.regions, features: m.features, stats: m.stats,
    };
  }
}

export function createWorld(options?: CozyWorldOptions): CozyWorld { return new CozyWorld(options); }
