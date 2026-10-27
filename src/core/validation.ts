export type CozyWorldErrorCode =
  | "INVALID_OPTION"
  | "WORLD_TOO_LARGE"
  | "UNKNOWN_BIOME"
  | "DUPLICATE_BIOME"
  | "INVALID_BIOME"
  | "NO_VALID_CELL";

export class CozyWorldError extends Error {
  readonly code: CozyWorldErrorCode;
  constructor(code: CozyWorldErrorCode, message: string) {
    super(message);
    this.name = "CozyWorldError";
    this.code = code;
  }
}

export function assertInteger(name: string, value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be an integer, received ${String(value)}`);
  }
  if (value < min || value > max) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be between ${min} and ${max}, received ${value}`);
  }
  return value;
}

export function assertNumber(name: string, value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be a finite number, received ${String(value)}`);
  }
  if (value < min || value > max) {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be between ${min} and ${max}, received ${value}`);
  }
  return value;
}

export function assertBoolean(name: string, value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new CozyWorldError("INVALID_OPTION", `"${name}" must be a boolean, received ${String(value)}`);
  }
  return value;
}

export function assertRange(name: string, value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    !Number.isFinite(value[0]) ||
    !Number.isFinite(value[1]) ||
    value[0] > value[1]
  ) {
    throw new CozyWorldError("INVALID_BIOME", `"${name}" must be a [min, max] tuple of finite numbers with min <= max`);
  }
  return [value[0], value[1]];
}
