import type { FrameColor } from '../store/useEditorStore'
import type { Pt } from './geometry'
import { hexToHsl, hexToRgb, hslToHex } from './palette'
import { starburstPoints } from './starburst'
import { mulberry32 } from './texture'

/**
 * A cosmic color set derived from the two sides' frame colors. The galaxy reads
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

/**
 * Sample a logarithmic spiral as a smooth point list. Radius grows exponentially
 * from `startR` to `endR` across `turns` revolutions, offset by `phase` (radians).
 * Feed the result to a Konva `Line` with `tension` for fluid, watery curves.
 */
export function logSpiral(
  cx: number,
  cy: number,
  startR: number,
  endR: number,
  turns: number,
  samples: number,
  phase: number,
): Pt[] {
  const pts: Pt[] = []
  const total = turns * Math.PI * 2
  const ratio = endR / startR
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const r = startR * Math.pow(ratio, t)
    const theta = phase + t * total
    pts.push({ x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r })
  }
  return pts
}

/** `count` spiral arms evenly spaced in phase — the galaxy's swirling bands. */
export function swirlArms(
  cx: number,
  cy: number,
  count: number,
  startR: number,
  endR: number,
  turns: number,
  samples = 80,
): Pt[][] {
  const arms: Pt[][] = []
  for (let i = 0; i < count; i++) {
    arms.push(logSpiral(cx, cy, startR, endR, turns, samples, (i / count) * Math.PI * 2))
  }
  return arms
}

export interface Globe {
  x: number
  y: number
  r: number
  colorA: string // bright core of the goo blob
  colorB: string // edge it fades toward
}

/**
 * Deterministic "water goo" blobs strung along the spiral arms. Positions, sizes
 * and colors are seeded (via `mulberry32`) so the galaxy is stable across
 * re-renders and PNG export, like the splatter system.
 */
export function gooGlobes(
  seed: number,
  cx: number,
  cy: number,
  palette: GalaxyPalette,
  count: number,
  startR: number,
  endR: number,
  turns: number,
): Globe[] {
  const rand = mulberry32(seed)
  const globes: Globe[] = []
  for (let i = 0; i < count; i++) {
    // Ride a spiral at a random distance out, then jitter off it for an organic clump.
    const phase = rand() * Math.PI * 2
    const t = rand()
    const r = startR * Math.pow(endR / startR, t)
    const theta = phase + t * turns * Math.PI * 2
    const jitter = 26 + rand() * 34
    const ja = rand() * Math.PI * 2
    const x = cx + Math.cos(theta) * r + Math.cos(ja) * jitter
    const y = cy + Math.sin(theta) * r + Math.sin(ja) * jitter
    const colorA = palette.blobs[Math.floor(rand() * palette.blobs.length)]
    globes.push({
      x,
      y,
      r: 26 + rand() * 58 * (0.5 + t), // blobs grow toward the outer rim
      colorA,
      colorB: withAlpha(colorA, 0),
    })
  }
  return globes
}

export interface Sparkle {
  points: number[] // flat [x,y,...] for a 4-point Konva star
  x: number
  y: number
}

/** A few 4-point sparkle stars scattered across the disc (seeded for stability). */
export function sparkles(
  seed: number,
  cx: number,
  cy: number,
  radius: number,
  count: number,
): Sparkle[] {
  const rand = mulberry32(seed)
  const out: Sparkle[] = []
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2
    const d = (0.25 + rand() * 0.75) * radius
    const x = cx + Math.cos(a) * d
    const y = cy + Math.sin(a) * d
    const outer = 10 + rand() * 26
    out.push({ x, y, points: starburstPoints(x, y, outer, outer * 0.22, 4) })
  }
  return out
}
