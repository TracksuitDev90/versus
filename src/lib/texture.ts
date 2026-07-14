/** Tiny deterministic PRNG (mulberry32) so paper flecks are stable across
 *  re-renders and exports instead of dancing around on every draw. */
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

export interface Fleck {
  x: number
  y: number
  r: number
  opacity: number
  dark: boolean
}

/**
 * Tiny fiber flecks scattered across the sheet, like the impurities in uncoated
 * recycled stock. Seeded so they stay put; drawn under the photos, so only the
 * flecks on visible paper (margins and gutter) actually show.
 */
export function makeFlecks(seed: number, width: number, height: number, count = 170): Fleck[] {
  const rand = mulberry32(seed)
  const flecks: Fleck[] = []
  for (let i = 0; i < count; i++) {
    flecks.push({
      x: rand() * width,
      y: rand() * height,
      r: 0.7 + rand() * 1.9,
      opacity: 0.04 + rand() * 0.08,
      dark: rand() > 0.3,
    })
  }
  return flecks
}
