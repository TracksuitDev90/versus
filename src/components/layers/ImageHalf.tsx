import type { KonvaEventObject } from 'konva/lib/Node'
import { Group, Image as KonvaImage, Line } from 'react-konva'
import type { SideId } from '../../constants'
import { flatten, imagePolygon, traceClip } from '../../lib/geometry'
import { clampToCover, zoomKeepingCenter } from '../../lib/image'
import { useEditorStore } from '../../store/useEditorStore'

export const MAX_ZOOM_FACTOR = 4 // 4x past the cover baseline

/** A photo clipped to its diagonal half, draggable to reposition and zoomable
 *  via the mouse wheel (sliders/pinch are handled in the controls). */
export default function ImageHalf({ side }: { side: SideId }) {
  const img = useEditorStore((s) => s.images[side])
  const setImage = useEditorStore((s) => s.setImage)
  const polygon = imagePolygon(side)

  if (!img.image) return null

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target
    node.position(clampToCover({ ...img, x: node.x(), y: node.y() }, polygon))
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    setImage(side, { x: e.target.x(), y: e.target.y() })
  }

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const factor = e.evt.deltaY > 0 ? 0.94 : 1.06
    const min = img.coverScale
    const max = img.coverScale * MAX_ZOOM_FACTOR
    const next = Math.min(max, Math.max(min, img.scale * factor))
    setImage(side, zoomKeepingCenter(img, next, polygon))
  }

  return (
    <Group clipFunc={(ctx) => traceClip(ctx, polygon)}>
      <KonvaImage
        image={img.image}
        x={img.x}
        y={img.y}
        width={img.naturalWidth * img.scale}
        height={img.naturalHeight * img.scale}
        draggable
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onWheel={handleWheel}
      />
      {/* Stroke centered on the clip edge: the outer half is clipped away,
          leaving an inner shadow that seats the photo into the frame. */}
      <Line
        points={flatten(polygon)}
        closed
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={22}
        listening={false}
      />
    </Group>
  )
}
