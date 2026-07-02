import type { FrameColor } from '../store/useEditorStore'
import { hexToHsl, hslToHex } from './palette'
import { mulberry32 } from './texture'

/**
 * The flame vortex: bold flat-vector flame tendrils spiraling inward from all
 * edges toward a dark open "eye" at the canvas center, in the style of a
 * screen-printed poster (three flat tones per side, no gradients).
 *
 * All geometry lives in local coordinates centered on (0,0); the rendering
 * component places the group at the canvas center and rotates it, so shapes
 * are emitted once at module load (seeded) and stay identical across renders,
 * re-tints and PNG export.
 */

export const FLAME_SEED = 20260702
/** Must clear the canvas half-diagonal (~1101) so rotation never bares a corner. */
export const OUTER_RADIUS = 1250
/** Dark clear eye around the center that keeps the VS text legible. */
export const INNER_RADIUS = 240
export const TENDRIL_COUNT = 12
/** Shared very-dark navy behind both halves. */
export const FLAME_BACKDROP = '#17132b'

const SWEEP = 1.9 // radians a tendril winds while falling inward
const SAMPLES = 26 // centerline samples per outline edge
const TIER_WIDTH = [230, 160, 72] // max widths: shade body, base, highlight ribbon
const BACK_TENDRIL_COUNT = 5 // extra-wide highlight tongues peeking out at the rim

export type FlameTone = 0 | 1 | 2 // 0 shade · 1 base · 2 highlight

export type FlameShape =
  | { kind: 'path'; data: string; tone: FlameTone }
  | { kind: 'circle'; x: number; y: number; r: number; tone: FlameTone }

interface P {
  x: number
  y: number
}

const r1 = (v: number) => Math.round(v * 10) / 10

/** Closed Catmull-Rom loop → cubic-bezier SVG path data. */
function closedLoopPath(pts: P[]): string {
  const n = pts.length
  const at = (i: number) => pts[((i % n) + n) % n]
  let d = `M${r1(pts[0].x)} ${r1(pts[0].y)}`
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += `C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2.x)} ${r1(p2.y)}`
  }
  return d + 'Z'
}

/**
 * A log-spiral tendril spine: exponential radius fall-off from the rim to its
 * tip while the angle advances by `sweep`, evaluated analytically so any tier
 * can sample any sub-range of t. Returns the point and the unit normal
 * (perpendicular to the local tangent).
 */
function makeSpine(phi0: number, sweep: number, tipR: number) {
  const k = Math.log(tipR / OUTER_RADIUS)
  return (t: number): { c: P; n: P } => {
    const r = OUTER_RADIUS * Math.exp(k * t)
    const phi = phi0 + sweep * t
    const cos = Math.cos(phi)
    const sin = Math.sin(phi)
    // d/dt of (r·cosφ, r·sinφ): radial shrink + angular advance.
    const dx = r * k * cos - r * sweep * sin
    const dy = r * k * sin + r * sweep * cos
    const len = Math.hypot(dx, dy) || 1
    return { c: { x: r * cos, y: r * sin }, n: { x: -dy / len, y: dx / len } }
  }
}

/** Widest just inside the rim (small bulge near t≈0.12), tapering to a point. */
function widthProfile(t: number): number {
  return 0.85 * (1 - t) ** 1.35 + 0.15 * Math.sin(Math.PI * Math.min(1, t * 4))
}

/**
 * Per-edge flame-lick modulation: two seeded sine waves plus a few sharp
 * spikes. The Catmull-Rom smoothing rounds the spikes into the licking
 * tongue cusps of the reference art.
 */
function makeLick(rand: () => number): (t: number) => number {
  const f1 = 2 + rand()
  const f2 = 4 + rand() * 2
  const p1 = rand() * Math.PI * 2
  const p2 = rand() * Math.PI * 2
  const spikes: { t: number; amp: number }[] = []
  const count = 2 + Math.floor(rand() * 2)
  for (let i = 0; i < count; i++) {
    spikes.push({ t: 0.12 + rand() * 0.68, amp: 0.7 + rand() * 0.5 })
  }
  return (t: number) => {
    let v = 0.3 * Math.sin(2 * Math.PI * f1 * t + p1) + 0.18 * Math.sin(2 * Math.PI * f2 * t + p2)
    for (const s of spikes) {
      const d = Math.abs(t - s.t)
      if (d < 0.05) v += s.amp * (1 - d / 0.05)
    }
    return v
  }
}

/**
 * Build one closed tendril outline over t ∈ [t0, t1]: walk edge A out, edge B
 * back, both offset from the (possibly shifted) spine by the tapered,
 * lick-modulated half-width.
 */
function tendrilPath(
  spine: (t: number) => { c: P; n: P },
  wMax: number,
  t0: number,
  t1: number,
  lickA: (t: number) => number,
  lickB: (t: number) => number,
  spineShift: number,
): string {
  const edgeA: P[] = []
  const edgeB: P[] = []
  for (let s = 0; s <= SAMPLES; s++) {
    const u = s / SAMPLES
    const t = t0 + (t1 - t0) * u
    const { c, n } = spine(t)
    // Ramp sub-range tiers closed at their own ends; full-range ends keep the
    // plain width profile (the rim cap sits off-canvas, the tip tapers itself).
    const ramp = Math.min(1, t0 <= 0.001 ? 1 : u * 4, t1 >= 0.999 ? 1 : (1 - u) * 2.5)
    const half = (wMax / 2) * widthProfile(t) * ramp
    const cx = c.x + n.x * spineShift
    const cy = c.y + n.y * spineShift
    edgeA.push({
      x: cx + n.x * half * Math.max(0.05, 1 + lickA(t)),
      y: cy + n.y * half * Math.max(0.05, 1 + lickA(t)),
    })
    edgeB.push({
      x: cx - n.x * half * Math.max(0.05, 1 + lickB(t)),
      y: cy - n.y * half * Math.max(0.05, 1 + lickB(t)),
    })
  }
  const loop = edgeA.concat(edgeB.reverse())
  // Drop near-duplicate neighbors (the tip pinches both edges together).
  const clean = loop.filter((p, i) => {
    const prev = loop[(i - 1 + loop.length) % loop.length]
    return Math.hypot(p.x - prev.x, p.y - prev.y) > 1.5
  })
  return closedLoopPath(clean)
}

/** A droplet: a small ring of points with one pulled out into a tail. */
function teardropPath(x: number, y: number, r: number, tailAngle: number): string {
  const pts: P[] = []
  for (let i = 0; i < 6; i++) {
    const a = tailAngle + (i / 6) * Math.PI * 2
    const rad = i === 0 ? r * 2.4 : r
    pts.push({ x: x + Math.cos(a) * rad, y: y + Math.sin(a) * rad })
  }
  return closedLoopPath(pts)
}

export function buildFlameVortex(seed = FLAME_SEED): FlameShape[] {
  const rand = mulberry32(seed)
  const back: FlameShape[] = []
  const shade: FlameShape[] = []
  const base: FlameShape[] = []
  const highlight: FlameShape[] = []
  const blobs: FlameShape[] = []

  // Wide highlight tongues behind everything, only near the rim — the bright
  // color peeking out from behind the main flames, as in the reference.
  for (let i = 0; i < BACK_TENDRIL_COUNT; i++) {
    const phi0 = (i / BACK_TENDRIL_COUNT) * Math.PI * 2 + 0.35 + (rand() - 0.5) * 0.5
    const sweep = SWEEP * (0.85 + rand() * 0.3)
    const spine = makeSpine(phi0, sweep, INNER_RADIUS * 1.25)
    back.push({
      kind: 'path',
      data: tendrilPath(spine, 235 * (0.85 + rand() * 0.3), 0, 0.55, makeLick(rand), makeLick(rand), 0),
      tone: 2,
    })
  }

  for (let i = 0; i < TENDRIL_COUNT; i++) {
    const phi0 = (i / TENDRIL_COUNT) * Math.PI * 2 + (rand() - 0.5) * 0.5
    const sweep = SWEEP * (0.85 + rand() * 0.3)
    const tipR = INNER_RADIUS * (1 + rand() * 0.35)
    const spine = makeSpine(phi0, sweep, tipR)
    const jitter = 0.85 + rand() * 0.3

    shade.push({
      kind: 'path',
      data: tendrilPath(spine, TIER_WIDTH[0] * jitter, 0, 1, makeLick(rand), makeLick(rand), 0),
      tone: 0,
    })
    base.push({
      kind: 'path',
      data: tendrilPath(spine, TIER_WIDTH[1] * jitter, 0, 1, makeLick(rand), makeLick(rand), -12),
      tone: 1,
    })
    // Highlight ribbon hugging the spine's leading edge on most tendrils;
    // stops short of the tip so tips stay in the base tone.
    if (i % 3 !== 2) {
      highlight.push({
        kind: 'path',
        data: tendrilPath(
          spine,
          TIER_WIDTH[2] * jitter,
          0.05,
          0.7,
          makeLick(rand),
          makeLick(rand),
          -18,
        ),
        tone: 2,
      })
    }

    // Detached sparks: droplets flying ahead of the tip toward the eye, and
    // dots thrown off the outer edges.
    const blobCount = 2 + Math.floor(rand() * 3)
    for (let k = 0; k < blobCount; k++) {
      const tone: FlameTone = rand() < 0.45 ? 2 : 1
      if (rand() < 0.5) {
        const t = 1.05 + rand() * 0.25
        const { c } = spine(t)
        const dist = Math.hypot(c.x, c.y)
        // Clamp toward the eye so the center stays clear for the VS text.
        const minR = INNER_RADIUS * 0.8
        const f = dist < minR ? minR / dist : 1
        const x = c.x * f
        const y = c.y * f
        const r = 5 + rand() * 9
        if (rand() < 0.5) {
          blobs.push({ kind: 'path', data: teardropPath(x, y, r, Math.atan2(y, x)), tone })
        } else {
          blobs.push({ kind: 'circle', x, y, r, tone })
        }
      } else {
        const t = 0.08 + rand() * 0.5
        const { c, n } = spine(t)
        const side = rand() < 0.5 ? 1 : -1
        const off = TIER_WIDTH[0] / 2 + 25 + rand() * 45
        blobs.push({
          kind: 'circle',
          x: c.x + n.x * off * side,
          y: c.y + n.y * off * side,
          r: 6 + rand() * 22,
          tone,
        })
      }
    }
  }

  // Array order = draw order (back-to-front): rim tongues, shade bodies,
  // base bodies, highlight ribbons, sparks on top.
  return [...back, ...shade, ...base, ...highlight, ...blobs]
}

/** Built once at module load; both sides render the same geometry. */
export const FLAME_SHAPES = buildFlameVortex()

export interface FlameTones {
  shade: string
  base: string
  highlight: string
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Derive the three flat flame tones for one side from its frame color state —
 * the color controls keep working, they now drive the tint. In gradient mode
 * the hue leans a quarter of the way toward the far stop (shortest arc) so
 * both stops matter; the angle no longer affects rendering.
 */
export function flameTones(frame: FrameColor): FlameTones {
  const a = hexToHsl(frame.mode === 'solid' ? frame.solid : frame.gradient.from)
  let h = a.h
  let s = a.s
  if (frame.mode === 'gradient') {
    const b = hexToHsl(frame.gradient.to)
    const d = ((b.h - a.h + 540) % 360) - 180
    h = a.h + d * 0.25
    s = Math.max(a.s, b.s)
  }
  // Slight hue spread across the tiers reads as real fire (yellow→orange→red).
  return {
    highlight: hslToHex(h + 16, clamp(s, 0.75, 1), 0.58),
    base: hslToHex(h, clamp(s, 0.6, 0.95), 0.46),
    shade: hslToHex(h - 8, clamp(s * 0.95, 0.45, 0.9), 0.31),
  }
}

export interface Ember {
  x: number
  y: number
  r: number
  phase: number
  speed: number
  baseOpacity: number
}

/** Seeded drifting sparks; positions are animated purely from time so they
 *  stay deterministic and freeze into a valid poster when motion stops. */
export function buildEmbers(seed: number, count: number, width: number, height: number): Ember[] {
  const rand = mulberry32(seed)
  const embers: Ember[] = []
  for (let i = 0; i < count; i++) {
    embers.push({
      x: rand() * width,
      y: rand() * height,
      r: 2 + rand() * 3,
      phase: rand() * Math.PI * 2,
      speed: 14 + rand() * 10,
      baseOpacity: 0.35 + rand() * 0.4,
    })
  }
  return embers
}
