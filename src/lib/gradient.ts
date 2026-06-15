import type { FrameColor } from '../store/useEditorStore'
import type { Pt } from './geometry'
import { bbox } from './geometry'

/**
 * Konva fill props for a frame shape, supporting both solid and linear-gradient
 * modes. Gradient start/end points are derived from the angle across the polygon's
 * bounding box (coordinates are in the same design space as the shape's points).
 */
export function frameFillProps(frame: FrameColor, polygon: Pt[]) {
  if (frame.mode === 'solid') {
    return { fill: frame.solid, fillLinearGradientColorStops: undefined }
  }

  const box = bbox(polygon)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const rad = (frame.gradient.angle * Math.PI) / 180
  const half = Math.max(box.width, box.height) / 2
  const dx = Math.cos(rad) * half
  const dy = Math.sin(rad) * half

  return {
    fill: undefined,
    fillLinearGradientStartPoint: { x: cx - dx, y: cy - dy },
    fillLinearGradientEndPoint: { x: cx + dx, y: cy + dy },
    fillLinearGradientColorStops: [0, frame.gradient.from, 1, frame.gradient.to],
  }
}
