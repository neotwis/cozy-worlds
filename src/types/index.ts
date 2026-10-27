import type { Seed } from "../core/random.js";

export type Dimension = "2d" | "3d";
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type WeatherType = "sunny" | "cloudy" | "rainy" | "foggy" | "stormy" | "snowy";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type DayPhase = "night" | "dawn" | "day" | "dusk";

/** Water classification per cell. */
export const WaterKind = { Land: 0, Ocean: 1, Lake: 2, River: 3 } as const;
export type WaterKind = (typeof WaterKind)[keyof typeof WaterKind];

export interface TerrainOptions {
  /** Noise frequency across the whole map. Higher = more, smaller features. */
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  /** Fraction of the height range below which cells are water (0..1). */
  seaLevel: number;
  /** Push edges down to form an island/archipelago. */
  island: boolean;
  /** Island falloff strength (0..3). */
  islandFalloff: number;
  /** Blend of ridged noise for mountains (0..1). */
  mountainIntensity: number;
  /** Exponent applied to elevation; >1 flattens lowlands into plains. */
  redistribution: number;
  riverCount: number;
  lakeCount: number;
  /** World units of height at elevation 1 (used by 3D outputs). */
  heightScale: number;
  /** Cells whose neighbor height delta exceeds this are not traversable. */
  maxTraversableSlope: number;
}

export interface EnvironmentTime {
  /** 0..364 */
  dayOfYear: number;
  /** 0..24 (fractional) */
  hour: number;
}

export interface CozyWorldOptions {
  seed?: Seed;
  /** Square world size; overridden by width/height. */
  size?: number;
  width?: number;
  height?: number;
  dimension?: Dimension;
  /** Restrict biome placement to these ids. Defaults to every registered biome. */
  biomes?: string[];
  weather?: boolean;
  dayNightCycle?: boolean;
  terrain?: Partial<TerrainOptions>;
  time?: Partial<EnvironmentTime>;
  /** Latitude in degrees (-80..80) used for day length. */
  latitude?: number;
  /** Multiplier on vegetation density (0..5). */
  vegetationDensity?: number;
  /** Cap on generated vegetation/object features. */
  maxFeatures?: number;
  /** Safety cap on width*height. */
  maxCells?: number;
}

export interface ResolvedOptions {
  seed: Seed;
  width: number;
  height: number;
  dimension: Dimension;
  biomes: string[] | null;
  weather: boolean;
  dayNightCycle: boolean;
  terrain: TerrainOptions;
  time: EnvironmentTime;
  latitude: number;
  vegetationDensity: number;
  maxFeatures: number;
  maxCells: number;
}

export interface VegetationRule {
  type: string;
  /** Probability per land cell (0..1) before the global density multiplier. */
  density: number;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  /** Normalized ranges (0..1) used for scoring. */
  temperature: [number, number];
  moisture: [number, number];
  /** Elevation above sea level, normalized to 0..1 for land. */
  elevation: [number, number];
  /** True for biomes that occupy water cells (e.g. lake). */
  aquatic?: boolean;
  /** Tie-breaker / preference bonus; higher wins. */
  priority?: number;
  vegetation: VegetationRule[];
  resources: string[];
  wildlife: string[];
  /** Relative weather weights for this biome. */
  weather: Partial<Record<WeatherType, number>>;
  /** sRGB color 0..255 for renderers. */
  color: [number, number, number];
  description?: string;
}

export interface WorldFeature {
  id: string;
  /** Vegetation or object type, e.g. "oak_tree". */
  type: string;
  category: "vegetation" | "object";
  biome: string;
  x: number;
  y: number;
  /** World height of the feature base (elevation * heightScale). */
  z: number;
  rotation: number;
  scale: number;
}

export interface Region {
  id: number;
  size: number;
  dominantBiome: string;
  centroid: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface WorldStats {
  landCells: number;
  oceanCells: number;
  lakeCells: number;
  riverCells: number;
  traversableCells: number;
  biomeCounts: Record<string, number>;
  generationMs: number;
}

export interface WorldMap {
  seed: Seed;
  width: number;
  height: number;
  dimension: Dimension;
  seaLevel: number;
  heightScale: number;
  /** Elevation per cell, 0..1, row-major (index = y * width + x). */
  heightmap: Float32Array;
  temperature: Float32Array;
  moisture: Float32Array;
  /** Index into biomeKeys per cell. */
  biomeIds: Uint8Array;
  biomeKeys: string[];
  /** sRGB color per biome key. */
  biomeColors: [number, number, number][];
  /** WaterKind per cell. */
  water: Uint8Array;
  /** 1 if walkable land. */
  traversable: Uint8Array;
  /** Region id per cell, -1 for non-traversable. */
  regionIds: Int32Array;
  regions: Region[];
  features: WorldFeature[];
  stats: WorldStats;
}

export interface WorldCell {
  x: number;
  y: number;
  elevation: number;
  temperature: number;
  moisture: number;
  biome: string;
  water: WaterKind;
  traversable: boolean;
  regionId: number;
}

export interface WeatherState {
  type: WeatherType;
  /** 0..1 */
  intensity: number;
  temperatureC: number;
  windKph: number;
  /** mm/h */
  precipitation: number;
  durationHours: number;
  biome: string;
  season: Season;
}

export interface SeasonInfo {
  season: Season;
  /** 0..1 progress through the season. */
  progress: number;
  /** Temperature offset (-1..1 normalized) applied to biomes. */
  temperatureOffset: number;
}

export interface DayNightInfo {
  hour: number;
  phase: DayPhase;
  /** Degrees above horizon. */
  sunElevation: number;
  /** 0..1 ambient light. */
  lightLevel: number;
  sunrise: number;
  sunset: number;
  daylightHours: number;
}

export interface EnvironmentState {
  time: EnvironmentTime;
  season: SeasonInfo;
  dayNight: DayNightInfo | null;
  weather: WeatherState | null;
}
