import { mulberry32 } from './texture'

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

/**
 * A hand-drawn looking starburst. Spike lengths alternate long/short and every
 * vertex is nudged in radius and angle by a seeded jitter, so the silhouette is
 * irregular and organic instead of a perfect, cheap-looking machine star.
 *
 * Passing the same `seed` to stacked layers keeps their wobble aligned, so the
 * rings read as one inked shape with uneven, drawn rims.
 */
export function roughStarburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  spikes: number,
  seed: number,
  radiusJitter = 0.1,
  angleJitter = 0.4,
): number[] {
  const rand = mulberry32(seed)
  const pts: number[] = []
  const step = Math.PI / spikes
  for (let i = 0; i < spikes * 2; i++) {
    const outer = i % 2 === 0
    // Alternate long / short spikes for a comic-burst rhythm.
    const base = outer ? (Math.floor(i / 2) % 2 === 0 ? outerR : outerR * 0.84) : innerR
    const r = base * (1 + (rand() - 0.5) * 2 * radiusJitter)
    const a = i * step - Math.PI / 2 + (rand() - 0.5) * 2 * angleJitter * step
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  return pts
}
