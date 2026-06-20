import type { SideId } from '../constants'
import { BASE_HEIGHT, BASE_WIDTH } from '../constants'

export interface Pt {
  x: number
  y: number
}

// Diagonal divider geometry. The seam runs from a point slightly right of center
// at the top to a point slightly left of center at the bottom (a "/" lean).
export const CX = BASE_WIDTH / 2
export const DIVIDER_OFFSET = 70 // horizontal lean of the diagonal
export const BORDER = 26 // colored frame thickness around the outer edges
export const GAP = 16 // half-width of the colored seam along the divider

export const dividerTop: Pt = { x: CX + DIVIDER_OFFSET, y: 0 }
export const dividerBottom: Pt = { x: CX - DIVIDER_OFFSET, y: BASE_HEIGHT }

const SEAM_SEGMENTS = 9
const SEAM_AMPLITUDE = 26

/** Flatten a list of points into the [x0,y0,x1,y1,...] array Konva's Line wants. */
export function flatten(points: Pt[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

/**
 * The single jagged seam shared by the frame color split AND the lightning bolt.
 * Runs top→bottom along the leaning divider, offset perpendicular in an alternating
 * zigzag. Because the colored regions and the bolt use this exact path, the colors
 * meet right under the bolt with no straight-line bleed.
 */
export function seamPoints(
  segments = SEAM_SEGMENTS,
  amplitude = SEAM_AMPLITUDE,
): Pt[] {
  const dx = dividerBottom.x - dividerTop.x
  const dy = dividerBottom.y - dividerTop.y
  const len = Math.hypot(dx, dy)
  const px = -dy / len // unit perpendicular to the seam direction
  const py = dx / len

  const pts: Pt[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const baseX = dividerTop.x + dx * t
    const baseY = dividerTop.y + dy * t
    // No offset at the very ends so the seam meets the top/bottom edges cleanly.
    const edge = i === 0 || i === segments
    const sign = i % 2 === 0 ? 1 : -1
    const amp = edge ? 0 : amplitude
    pts.push({ x: baseX + px * amp * sign, y: baseY + py * amp * sign })
  }
  return pts
}

// --- Frame polygons (full canvas, split along the seam, drawn behind images) ---
export function leftFramePolygon(): Pt[] {
  return [{ x: 0, y: 0 }, ...seamPoints(), { x: 0, y: BASE_HEIGHT }]
}

export function rightFramePolygon(): Pt[] {
  return [{ x: BASE_WIDTH, y: 0 }, ...seamPoints(), { x: BASE_WIDTH, y: BASE_HEIGHT }]
}

// Seam shifted horizontally toward one side by GAP, with y clamped to the border
// inset so photos tuck just under the bolt (the bolt then hides the GAP).
function offsetSeam(side: SideId): Pt[] {
  const shift = side === 'left' ? -GAP : GAP
  return seamPoints().map((p) => ({
    x: p.x + shift,
    y: Math.min(BASE_HEIGHT - BORDER, Math.max(BORDER, p.y)),
  }))
}

// --- Image clip polygons (inset by BORDER on outer edges, seam-offset by GAP) ---
export function leftImagePolygon(): Pt[] {
  return [
    { x: BORDER, y: BORDER },
    ...offsetSeam('left'),
    { x: BORDER, y: BASE_HEIGHT - BORDER },
  ]
}

export function rightImagePolygon(): Pt[] {
  return [
    { x: BASE_WIDTH - BORDER, y: BORDER },
    ...offsetSeam('right'),
    { x: BASE_WIDTH - BORDER, y: BASE_HEIGHT - BORDER },
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

/** The lightning bolt is drawn on the exact same path as the frame color seam. */
export function lightningPoints(): number[] {
  return flatten(seamPoints())
}
