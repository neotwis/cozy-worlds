import type { Season, SeasonInfo } from "../types/index.js";

const ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

/**
 * Northern-hemisphere meteorological seasons on a 364-day year split into
 * four 91-day seasons; day 0 is the first day of spring. Pass a negative
 * latitude to flip hemispheres.
 */
export function getSeason(dayOfYear: number, latitude = 45): SeasonInfo {
  const d = ((Math.floor(dayOfYear) % 364) + 364) % 364;
  let idx = Math.floor(d / 91);
  if (latitude < 0) idx = (idx + 2) % 4;
  const progress = (d % 91) / 91;
  // Warmest mid-summer (day ~136), coldest mid-winter (day ~318).
  const angle = ((d - 136) / 364) * Math.PI * 2;
  const temperatureOffset = Math.cos(angle) * (latitude < 0 ? -1 : 1) * Math.min(1, Math.abs(latitude) / 45);
  return { season: ORDER[idx] as Season, progress, temperatureOffset };
}
