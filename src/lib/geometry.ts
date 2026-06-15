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

/** Flatten a list of points into the [x0,y0,x1,y1,...] array Konva's Line wants. */
export function flatten(points: Pt[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

// --- Frame polygons (full canvas, split by the divider, drawn behind images) ---
export function leftFramePolygon(): Pt[] {
  return [
    { x: 0, y: 0 },
    { x: CX + DIVIDER_OFFSET, y: 0 },
    { x: CX - DIVIDER_OFFSET, y: BASE_HEIGHT },
    { x: 0, y: BASE_HEIGHT },
  ]
}

export function rightFramePolygon(): Pt[] {
  return [
    { x: CX + DIVIDER_OFFSET, y: 0 },
    { x: BASE_WIDTH, y: 0 },
    { x: BASE_WIDTH, y: BASE_HEIGHT },
    { x: CX - DIVIDER_OFFSET, y: BASE_HEIGHT },
  ]
}

// --- Image clip polygons (inset by BORDER on outer edges and GAP at the seam) ---
export function leftImagePolygon(): Pt[] {
  return [
    { x: BORDER, y: BORDER },
    { x: CX + DIVIDER_OFFSET - GAP, y: BORDER },
    { x: CX - DIVIDER_OFFSET - GAP, y: BASE_HEIGHT - BORDER },
    { x: BORDER, y: BASE_HEIGHT - BORDER },
  ]
}

export function rightImagePolygon(): Pt[] {
  return [
    { x: CX + DIVIDER_OFFSET + GAP, y: BORDER },
    { x: BASE_WIDTH - BORDER, y: BORDER },
    { x: BASE_WIDTH - BORDER, y: BASE_HEIGHT - BORDER },
    { x: CX - DIVIDER_OFFSET + GAP, y: BASE_HEIGHT - BORDER },
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

/**
 * A jagged lightning bolt that follows the divider seam. Samples points along the
 * divider and offsets them perpendicular to the seam, alternating sides.
 */
export function lightningPoints(segments = 9, amplitude = 26): number[] {
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
    // No offset at the very ends so the bolt meets the canvas edges cleanly.
    const edge = i === 0 || i === segments
    const sign = i % 2 === 0 ? 1 : -1
    const amp = edge ? 0 : amplitude
    pts.push({ x: baseX + px * amp * sign, y: baseY + py * amp * sign })
  }
  return flatten(pts)
}
