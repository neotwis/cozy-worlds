export function islandMask(x: number, y: number, width: number, height: number, strength: number): number {
  if (strength <= 0) return 1;
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = cx === 0 ? 0 : (x - cx) / cx;
  const dy = cy === 0 ? 0 : (y - cy) / cy;
  const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / Math.SQRT2 * 1.4);
  const m = 1 - strength * d * d;
  return m < 0 ? 0 : m;
}
