import type { FrameColor } from '../store/useEditorStore'
import type { Pt } from './geometry'
import { hexToHsl, hexToRgb, hslToHex } from './palette'
import { mulberry32 } from './texture'

/**
 * A cosmic color set derived from the two sides' frame colors. The burst reads
 * as "multicolored" by fanning hues out around each side's hue and pushing them
 * to a neon saturation/lightness, while a bright `core` and dark `backdropInner`
 * give the glowing-center-on-deep-space look of the reference image.
 */
export interface GalaxyPalette {
  backdropInner: string // dark tinted center of the disc
  core: string // bright near-white glow at the spiral center
  arm: string // dominant swirl color
  armSoft: string // lighter swirl glow variant
  blobs: string[] // accent "goo globe" colors from both sides + rotations
}

/** The representative, most vivid color of one side. */
function repColor(frame: FrameColor): string {
  return frame.mode === 'gradient' ? frame.gradient.from : frame.solid
}

/** A neon-tuned hex from a hue, with sensible saturation/lightness clamps. */
function neon(h: number, s: number, l: number): string {
  return hslToHex(h, Math.min(0.95, Math.max(0.55, s)), Math.min(0.92, Math.max(0.12, l)))
}

export function galaxyPalette(left: FrameColor, right: FrameColor): GalaxyPalette {
  const a = hexToHsl(repColor(left))
  const b = hexToHsl(repColor(right))
  const avg = (a.h + b.h) / 2

  // The arm leans to the more saturated side so the swirl keeps a clear identity.
  const armHue = a.s >= b.s ? a.h : b.h
  const armSat = Math.max(a.s, b.s, 0.7)

  return {
    backdropInner: hslToHex(avg, 0.55, 0.12),
    core: hslToHex(armHue, 0.45, 0.9),
    arm: neon(armHue, armSat, 0.56),
    armSoft: neon(armHue + 18, armSat, 0.66),
    // Fan both side hues out into a warm/cool spread for the goo blobs.
    blobs: [
      neon(a.h, a.s, 0.6),
      neon(b.h, b.s, 0.6),
      neon(a.h + 40, a.s, 0.62),
      neon(b.h - 40, b.s, 0.62),
      neon(avg + 180, 0.85, 0.6), // a complementary warm accent for variety
    ],
  }
}

/** Append an alpha channel to a hex color, returning an `rgba()` string. */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface Bolt {
  points: number[] // flat [x,y,...] from the inner (center) end out to the tip
  tip: Pt // outer tip, used as the stroke gradient's far point
}

/**
 * A radial burst of jagged lightning bolts converging on the center. Bolts are
 * evenly spaced around the circle (with a little angular wobble) and zig-zag
 * perpendicular to their ray. Geometry is seeded (via `mulberry32`) so the burst
 * is stable across re-renders and PNG export, like the old swirl. Paint each with
 * a stroke gradient that fades to transparent early so it falls off rapidly as it
 * leaves the center.
 */
export function radialBolts(
  seed: number,
  cx: number,
  cy: number,
  count: number,
  innerR: number,
  outerR: number,
  segments: number,
  jitter: number,
): Bolt[] {
  const rand = mulberry32(seed)
  const bolts: Bolt[] = []
  for (let i = 0; i < count; i++) {
    // Even angular spacing with a touch of wobble so it isn't mechanical.
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * ((Math.PI / count) * 0.8)
    const reach = outerR * (0.55 + rand() * 0.45) // randomized length, capped at outerR
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    const px = -dirY // unit perpendicular to the ray
    const py = dirX

    const pts: Pt[] = []
    for (let s = 0; s <= segments; s++) {
      const t = s / segments
      const r = innerR + (reach - innerR) * t
      // Pin the inner and outer ends to the ray; zig-zag the middle, splaying
      // a little wider toward the tip.
      const edge = s === 0 || s === segments
      const sign = s % 2 === 0 ? 1 : -1
      const amp = edge ? 0 : jitter * (0.4 + 0.6 * t) * (0.6 + rand() * 0.8)
      pts.push({ x: cx + dirX * r + px * amp * sign, y: cy + dirY * r + py * amp * sign })
    }

    const tip = pts[pts.length - 1]
    bolts.push({ points: pts.flatMap((p) => [p.x, p.y]), tip })
  }
  return bolts
}
