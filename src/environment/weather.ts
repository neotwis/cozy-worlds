import type { SeededRandom } from "../core/random.js";
import type { BiomeDefinition, SeasonInfo, WeatherState, WeatherType } from "../types/index.js";

const SEASON_MODIFIERS: Record<SeasonInfo["season"], Partial<Record<WeatherType, number>>> = {
  spring: { rainy: 1.4, cloudy: 1.1, foggy: 1.2 },
  summer: { sunny: 1.5, stormy: 1.3, foggy: 0.6 },
  autumn: { foggy: 1.5, rainy: 1.2, cloudy: 1.2 },
  winter: { snowy: 2, cloudy: 1.2, sunny: 0.7, stormy: 0.7 },
};

const ALL: WeatherType[] = ["sunny", "cloudy", "rainy", "foggy", "stormy", "snowy"];

/** Normalized biome temperature (0..1) + season offset → °C. */
export function toCelsius(normalizedTemp: number, seasonOffset: number): number {
  return Math.round((-15 + normalizedTemp * 45 + seasonOffset * 10) * 10) / 10;
}

export function generateWeather(
  rng: SeededRandom,
  biome: BiomeDefinition,
  season: SeasonInfo,
): WeatherState {
  const midTemp = (biome.temperature[0] + biome.temperature[1]) / 2;
  const temperatureC = toCelsius(midTemp, season.temperatureOffset) + Math.round(rng.float(-3, 3) * 10) / 10;
  const freezing = temperatureC <= 1;
  const entries = ALL.map((type) => {
    let w = (biome.weather[type] ?? 0) * (SEASON_MODIFIERS[season.season][type] ?? 1);
    if (type === "snowy" && !freezing) w = 0;
    if (type === "rainy" && freezing) w = 0;
    if (type === "snowy" && freezing && w === 0) w = biome.weather.rainy ?? 0.5; // rain turns to snow
    return { value: type, weight: w };
  });
  if (!entries.some((e) => e.weight > 0)) entries[0] = { value: "sunny", weight: 1 };
  const type = rng.weighted(entries);
  const intensity = Math.round(rng.float(type === "stormy" ? 0.6 : 0.1, 1) * 100) / 100;
  const baseWind = type === "stormy" ? 40 : type === "foggy" ? 3 : 12;
  const windKph = Math.round(baseWind * (0.5 + intensity) * 10) / 10;
  const precipitation =
    type === "rainy" ? intensity * 8 : type === "stormy" ? intensity * 20 : type === "snowy" ? intensity * 4 : 0;
  return {
    type,
    intensity,
    temperatureC,
    windKph,
    precipitation: Math.round(precipitation * 10) / 10,
    durationHours: rng.int(type === "stormy" ? 1 : 2, type === "stormy" ? 4 : 12),
    biome: biome.id,
    season: season.season,
  };
}
