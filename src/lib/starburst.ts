/**
 * Generate a spiky starburst polygon centered at (cx, cy): `spikes` outer points
 * alternating with `spikes` inner points, returned as a flat [x,y,...] array for
 * a Konva closed Line. `rotation` (radians) lets you offset layered bursts.
 */
export function starburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  spikes: number,
  rotation = 0,
): number[] {
  const pts: number[] = []
  const step = Math.PI / spikes // half-step: alternate outer/inner each step
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = i * step + rotation - Math.PI / 2
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  return pts
}
