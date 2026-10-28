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
  /** Noise frequency across the whole map . Higher = more, smaller features! */
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seaLevel: number;
  island: boolean;
  islandFalloff: number;
  mountainIntensity: number;
  riverCount: number;
  lakeCount: number;
  heightScale: number;
  maxTraversableSlope: number;
}

export interface EnvironmentTime {
  dayOfYear: number;
  hour: number;
}

export interface CozyWorldOptions {
  seed?: Seed;
  /** Square world size; overridden by width/height. */
  size?: number;
  width?: number;
  height?: number;
  dimension?: Dimension;
  biomes?: string[];
  weather?: boolean;
  dayNightCycle?: boolean;
  terrain?: Partial<TerrainOptions>;
  time?: Partial<EnvironmentTime>;
  latitude?: number;
  vegetationDensity?: number;
  maxFeatures?: number;
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
  density: number;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  temperature: [number, number];
  moisture: [number, number];
  elevation: [number, number];
  aquatic?: boolean;
  priority?: number;
  vegetation: VegetationRule[];
  resources: string[];
  wildlife: string[];
  weather: Partial<Record<WeatherType, number>>;
  color: [number, number, number];
  description?: string;
}

export interface WorldFeature {
  id: string;
  type: string;
  category: "vegetation" | "object";
  biome: string;
  x: number;
  y: number;
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
  heightmap: Float32Array;
  temperature: Float32Array;
  moisture: Float32Array;
  /** Index into biomeKeys per cell. */
  biomeIds: Uint8Array;
  biomeKeys: string[];
  biomeColors: [number, number, number][];
  water: Uint8Array;
  traversable: Uint8Array;
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
  intensity: number;
  temperatureC: number;
  windKph: number;
  precipitation: number;
  durationHours: number;
  biome: string;
  season: Season;
}

export interface SeasonInfo {
  season: Season;
  progress: number;
  temperatureOffset: number;
}

export interface DayNightInfo {
  hour: number;
  phase: DayPhase;
  sunElevation: number;
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
