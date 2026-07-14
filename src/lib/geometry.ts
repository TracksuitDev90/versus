import type { SideId } from '../constants'
import { BASE_WIDTH } from '../constants'

export interface Pt {
  x: number
  y: number
}

export const CX = BASE_WIDTH / 2

// --- The page grid -----------------------------------------------------------
// The canvas is laid out like a printed spread: a paper margin all around, page
// furniture (rules + captions) above and below, and two photo "plates" split by
// a clean diagonal gutter of bare paper.
export const PLATE_LEFT = 72
export const PLATE_RIGHT = BASE_WIDTH - 72
export const PLATE_TOP = 150
export const PLATE_BOTTOM = 944

export const SEAM_LEAN = 150 // horizontal lean of the diagonal ("/" direction)
export const GUTTER = 20 // half-width of the bare-paper gutter along the seam

// Flat ink block behind each plate, offset like misregistered print. Purely
// flat color — it reads as a printing artifact, not a drop shadow.
export const BLOCK_OFFSET = 18

export const seamTop: Pt = { x: CX + SEAM_LEAN, y: PLATE_TOP }
export const seamBottom: Pt = { x: CX - SEAM_LEAN, y: PLATE_BOTTOM }

/** Flatten a list of points into the [x0,y0,x1,y1,...] array Konva's Line wants. */
export function flatten(points: Pt[]): number[] {
  return points.flatMap((p) => [p.x, p.y])
}

// --- Plate polygons (the photo clip shapes) ----------------------------------
export function leftImagePolygon(): Pt[] {
  return [
    { x: PLATE_LEFT, y: PLATE_TOP },
    { x: seamTop.x - GUTTER, y: PLATE_TOP },
    { x: seamBottom.x - GUTTER, y: PLATE_BOTTOM },
    { x: PLATE_LEFT, y: PLATE_BOTTOM },
  ]
}

export function rightImagePolygon(): Pt[] {
  return [
    { x: seamTop.x + GUTTER, y: PLATE_TOP },
    { x: PLATE_RIGHT, y: PLATE_TOP },
    { x: PLATE_RIGHT, y: PLATE_BOTTOM },
    { x: seamBottom.x + GUTTER, y: PLATE_BOTTOM },
  ]
}

export function imagePolygon(side: SideId): Pt[] {
  return side === 'left' ? leftImagePolygon() : rightImagePolygon()
}

/** The colored ink block behind a plate shares the plate's shape; FrameLayer
 *  offsets it so a flat sliver of color shows on two edges. */
export function framePolygon(side: SideId): Pt[] {
  return imagePolygon(side)
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
