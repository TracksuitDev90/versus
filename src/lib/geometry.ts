import type Konva from 'konva'
import type { SideId } from '../constants'
import { BASE_HEIGHT, BASE_WIDTH } from '../constants'

export interface Pt {
  x: number
  y: number
}

// Diagonal divider geometry. The seam runs from a point slightly right of center
// at the top to a point slightly left of center at the bottom (a "/" lean).
export const CX = BASE_WIDTH / 2
export const DIVIDER_OFFSET = 105 // horizontal lean of the diagonal
export const BORDER = 39 // colored frame thickness around the outer edges
export const GAP = 27 // half-width of the colored seam along the divider

export const dividerTop: Pt = { x: CX + DIVIDER_OFFSET, y: 0 }
export const dividerBottom: Pt = { x: CX - DIVIDER_OFFSET, y: BASE_HEIGHT }

// Shape of the jagged seam. The same path is used for the color split, the photo
// gaps, and the lightning bolt, so the divide traces the bolt exactly — no red
// bleeding onto the blue side or vice versa.
export const SEAM_SEGMENTS = 9
export const SEAM_AMPLITUDE = 39

/** Flatten a list of points into the [x0,y0,x1,y1,...] array Konva's Line wants. */
export function flatten(points: Pt[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

/** Trace a polygon into a Konva clip context (shared by the clipped layers). */
export function traceClip(ctx: Konva.Context, polygon: Pt[]) {
  const flat = flatten(polygon)
  ctx.beginPath()
  ctx.moveTo(flat[0], flat[1])
  for (let i = 2; i < flat.length; i += 2) ctx.lineTo(flat[i], flat[i + 1])
  ctx.closePath()
}

/**
 * The single jagged seam, sampled top→bottom. Points are offset perpendicular to
 * the diagonal, alternating sides, with the very ends pinned to the diagonal so
 * the seam meets the top/bottom canvas edges cleanly.
 */
export function seamPoints(segments = SEAM_SEGMENTS, amplitude = SEAM_AMPLITUDE): Pt[] {
  const dx = dividerBottom.x - dividerTop.x
  const dy = dividerBottom.y - dividerTop.y
  const len = Math.hypot(dx, dy)
  // Unit perpendicular to the seam direction.
  const px = -dy / len
  const py = dx / len

  const pts: Pt[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const baseX = dividerTop.x + dx * t
    const baseY = dividerTop.y + dy * t
    const edge = i === 0 || i === segments
    const sign = i % 2 === 0 ? 1 : -1
    const amp = edge ? 0 : amplitude
    pts.push({ x: baseX + px * amp * sign, y: baseY + py * amp * sign })
  }
  return pts
}

// --- Frame polygons (full canvas, split along the seam, drawn behind images) ---
// Splitting along the jagged seam (rather than a straight diagonal) is what keeps
// each side's color strictly on its own side of the bolt.
export function leftFramePolygon(): Pt[] {
  return [{ x: 0, y: 0 }, ...seamPoints(), { x: 0, y: BASE_HEIGHT }]
}

export function rightFramePolygon(): Pt[] {
  return [
    ...seamPoints(),
    { x: BASE_WIDTH, y: BASE_HEIGHT },
    { x: BASE_WIDTH, y: 0 },
  ]
}

/**
 * The seam edge of one image: the jagged seam shifted GAP to that side and
 * trimmed to the BORDER inset top and bottom (interpolating where the seam
 * crosses those y values). Returned top→bottom.
 */
function seamEdge(side: SideId): Pt[] {
  const seam = seamPoints()
  const off = side === 'left' ? -GAP : GAP
  const top = BORDER
  const bottom = BASE_HEIGHT - BORDER

  const interpX = (a: Pt, b: Pt, y: number) => a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y)
  const topX = interpX(seam[0], seam[1], top)
  const botX = interpX(seam[seam.length - 2], seam[seam.length - 1], bottom)
  const middle = seam.filter((p) => p.y > top && p.y < bottom)

  const edge: Pt[] = [{ x: topX, y: top }, ...middle, { x: botX, y: bottom }]
  return edge.map((p) => ({ x: p.x + off, y: p.y }))
}

// --- Image clip polygons (inset by BORDER on outer edges, GAP from the seam) ---
export function leftImagePolygon(): Pt[] {
  return [
    { x: BORDER, y: BORDER },
    ...seamEdge('left'),
    { x: BORDER, y: BASE_HEIGHT - BORDER },
  ]
}

export function rightImagePolygon(): Pt[] {
  return [
    ...seamEdge('right'),
    { x: BASE_WIDTH - BORDER, y: BASE_HEIGHT - BORDER },
    { x: BASE_WIDTH - BORDER, y: BORDER },
  ]
}

export function framePolygon(side: SideId): Pt[] {
  return side === 'left' ? leftFramePolygon() : rightFramePolygon()
}

export function imagePolygon(side: SideId): Pt[] {
  return side === 'left' ? leftImagePolygon() : rightImagePolygon()
}

/** Axis-aligned bounding box of a polygon — used to fit/cover photos. */
export function bbox(points: Pt[]) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** The lightning bolt that rides the seam, as a flat [x,y,...] array. */
export function lightningPoints(): number[] {
  return flatten(seamPoints())
}

export interface SeamSample extends Pt {
  nx: number // unit normal (perpendicular to the seam direction)
  ny: number
}

/**
 * Walk the seam polyline and return `count` evenly spaced samples, each carrying
 * the local perpendicular normal. Used to lay halftone dots across the bolt body.
 */
export function seamSamples(count: number): SeamSample[] {
  const pts = seamPoints()
  const segLen: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
    segLen.push(l)
    total += l
  }

  const out: SeamSample[] = []
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total
    let acc = 0
    let seg = 0
    while (seg < segLen.length - 1 && acc + segLen[seg] < target) {
      acc += segLen[seg]
      seg++
    }
    const f = segLen[seg] ? (target - acc) / segLen[seg] : 0
    const a = pts[seg]
    const b = pts[seg + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    out.push({
      x: a.x + dx * f,
      y: a.y + dy * f,
      nx: -dy / len,
      ny: dx / len,
    })
  }
  return out
}
