import { Line } from 'react-konva'
import { INK } from '../../constants'
import {
  flatten,
  imagePolygon,
  PLATE_BOTTOM,
  PLATE_LEFT,
  PLATE_RIGHT,
  PLATE_TOP,
  seamBottom,
  seamTop,
} from '../../lib/geometry'

// Crop-mark geometry: short ticks floating just off the four outer plate
// corners, exactly like trim marks on an untrimmed press sheet.
const MARK_LEN = 26
const MARK_GAP = 10

/**
 * The print finishing pass: hairline keylines around each photo plate, a thin
 * ink rule down the middle of the paper gutter (overshooting the plates a
 * touch, like a score line), and trim marks at the sheet's corners. All flat.
 */
export default function DividerLayer() {
  // Extend the seam rule slightly past the plates along its own direction.
  const dx = seamBottom.x - seamTop.x
  const dy = seamBottom.y - seamTop.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const overshoot = 26

  return (
    <>
      {/* Keylines around each plate. */}
      {(['left', 'right'] as const).map((side) => (
        <Line
          key={side}
          points={flatten(imagePolygon(side))}
          closed
          stroke={INK}
          strokeWidth={3}
          listening={false}
        />
      ))}

      {/* Score line down the center of the gutter. */}
      <Line
        points={[
          seamTop.x - ux * overshoot,
          seamTop.y - uy * overshoot,
          seamBottom.x + ux * overshoot,
          seamBottom.y + uy * overshoot,
        ]}
        stroke={INK}
        strokeWidth={2.5}
        listening={false}
      />

      <CropMarks />
    </>
  )
}

function CropMarks() {
  const corners = [
    { x: PLATE_LEFT, y: PLATE_TOP, sx: -1, sy: -1 },
    { x: PLATE_RIGHT, y: PLATE_TOP, sx: 1, sy: -1 },
    { x: PLATE_LEFT, y: PLATE_BOTTOM, sx: -1, sy: 1 },
    { x: PLATE_RIGHT, y: PLATE_BOTTOM, sx: 1, sy: 1 },
  ]

  return (
    <>
      {corners.map((c, i) => (
        <Line
          key={`h${i}`}
          points={[c.x + c.sx * (MARK_GAP + MARK_LEN), c.y, c.x + c.sx * MARK_GAP, c.y]}
          stroke={INK}
          strokeWidth={2}
          listening={false}
        />
      ))}
      {corners.map((c, i) => (
        <Line
          key={`v${i}`}
          points={[c.x, c.y + c.sy * (MARK_GAP + MARK_LEN), c.x, c.y + c.sy * MARK_GAP]}
          stroke={INK}
          strokeWidth={2}
          listening={false}
        />
      ))}
    </>
  )
}
