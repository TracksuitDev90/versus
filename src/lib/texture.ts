import type { Pt } from './geometry'
import { bbox } from './geometry'

/** Tiny deterministic PRNG (mulberry32) so splatter is stable across re-renders
 *  and exports instead of dancing around on every draw. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Splat {
  x: number
  y: number
  r: number
  opacity: number
  light: boolean
}

/**
 * A handful of small splatter dots scattered within a polygon's bounding box.
 * Positions/sizes are seeded so they stay put; they're clipped to the frame
 * shape by the caller, so dots that fall off-side simply don't show.
 */
export function makeSplatter(seed: number, polygon: Pt[], count = 26): Splat[] {
  const box = bbox(polygon)
  const rand = mulberry32(seed)
  const splats: Splat[] = []
  for (let i = 0; i < count; i++) {
    splats.push({
      x: box.x + rand() * box.width,
      y: box.y + rand() * box.height,
      r: 1.2 + rand() * 3.8,
      opacity: 0.05 + rand() * 0.13,
      light: rand() > 0.5,
    })
  }
  return splats
}
