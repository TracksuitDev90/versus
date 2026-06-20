// Deterministic 0..1 hash so spike lengths are irregular but stable across renders
// (no flicker). Same (n, seed) always yields the same value.
function hash(n: number, seed: number): number {
  const x = Math.sin((n + 1) * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Generate a spiky starburst polygon centered at (cx, cy): `spikes` outer points
 * alternating with `spikes` inner points, returned as a flat [x,y,...] array for a
 * Konva closed Line.
 *
 * `jitter` (0..1) randomizes each outer spike's length by up to that fraction,
 * producing an irregular comic-explosion look instead of a uniform star. `rotation`
 * and `seed` let layered bursts share the same silhouette so they nest cleanly.
 */
export function starburstPoints(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  spikes: number,
  rotation = 0,
  jitter = 0,
  seed = 1,
): number[] {
  const pts: number[] = []
  const step = Math.PI / spikes // half-step: alternate outer/inner each step
  for (let i = 0; i < spikes * 2; i++) {
    let r = i % 2 === 0 ? outerR : innerR
    if (i % 2 === 0 && jitter > 0) {
      // Shorten some outer spikes by up to `jitter` of the radius.
      r = outerR * (1 - jitter * hash(i / 2, seed))
    }
    const a = i * step + rotation - Math.PI / 2
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
  }
  return pts
}
