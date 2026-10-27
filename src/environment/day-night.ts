import type { DayNightInfo, DayPhase } from "../types/index.js";

const DEG = Math.PI / 180;

/**
 * Approximate solar position using the standard declination formula.
 * `dayOfYear` 0 is treated as the March equinox (day 80 of the calendar).
 */
export function getDayNight(hour: number, dayOfYear: number, latitude = 45): DayNightInfo {
  const h = ((hour % 24) + 24) % 24;
  const calendarDay = (dayOfYear + 80) % 365;
  const decl = 23.44 * Math.sin(((360 / 365) * (calendarDay - 81)) * DEG);
  const lat = Math.max(-80, Math.min(80, latitude));
  const hourAngle = (h - 12) * 15;
  const sinEl =
    Math.sin(lat * DEG) * Math.sin(decl * DEG) +
    Math.cos(lat * DEG) * Math.cos(decl * DEG) * Math.cos(hourAngle * DEG);
  const sunElevation = Math.asin(Math.max(-1, Math.min(1, sinEl))) / DEG;

  const cosH0 = -Math.tan(lat * DEG) * Math.tan(decl * DEG);
  const H0 = cosH0 <= -1 ? 180 : cosH0 >= 1 ? 0 : Math.acos(cosH0) / DEG;
  const daylightHours = (2 * H0) / 15;
  const sunrise = 12 - daylightHours / 2;
  const sunset = 12 + daylightHours / 2;

  let phase: DayPhase;
  if (sunElevation > 6) phase = "day";
  else if (sunElevation > -6) phase = h < 12 ? "dawn" : "dusk";
  else phase = "night";

  // Smooth light curve from civil twilight (-6°) to 30°.
  const t = Math.max(0, Math.min(1, (sunElevation + 6) / 36));
  const lightLevel = 0.05 + 0.95 * t * t * (3 - 2 * t);

  return { hour: h, phase, sunElevation, lightLevel, sunrise, sunset, daylightHours };
}
