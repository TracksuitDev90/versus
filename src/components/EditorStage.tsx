import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { forwardRef, useRef } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH, type SideId } from '../constants'
import { CX, imagePolygon } from '../lib/geometry'
import { zoomKeepingCenter } from '../lib/image'
import { useResponsiveStage } from '../lib/useResponsiveStage'
import { useEditorStore } from '../store/useEditorStore'
import DividerLayer from './layers/DividerLayer'
import FrameLayer from './layers/FrameLayer'
import ImageHalf, { MAX_ZOOM_FACTOR } from './layers/ImageHalf'
import LabelsLayer from './layers/LabelsLayer'
import VsBadge from './layers/VsBadge'

/** The scaled Konva stage hosting every layer. Forwards the stage ref so the
 *  export helper can rasterize it at high resolution. */
const EditorStage = forwardRef<Konva.Stage>((_, ref) => {
  const { containerRef, scale } = useResponsiveStage()
  const lastDist = useRef(0)
  const pinchSide = useRef<SideId | null>(null)

  // Two-finger pinch zoom on touch devices: scales whichever side the pinch is over.
  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length !== 2) return
    e.evt.preventDefault()
    const [t1, t2] = [touches[0], touches[1]]
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const midXDesign = ((t1.clientX + t2.clientX) / 2 - rect.left) / scale

    if (!lastDist.current) {
      lastDist.current = dist
      pinchSide.current = midXDesign < CX ? 'left' : 'right'
      return
    }

    const side = pinchSide.current!
    const img = useEditorStore.getState().images[side]
    if (img.image) {
      const ratio = dist / lastDist.current
      const min = img.coverScale
      const max = img.coverScale * MAX_ZOOM_FACTOR
      const next = Math.min(max, Math.max(min, img.scale * ratio))
      useEditorStore.getState().setImage(side, zoomKeepingCenter(img, next, imagePolygon(side)))
    }
    lastDist.current = dist
  }

  const endPinch = () => {
    lastDist.current = 0
    pinchSide.current = null
  }

  return (
    <div ref={containerRef} className="stage-container">
      <Stage
        ref={ref}
        width={BASE_WIDTH * scale}
        height={BASE_HEIGHT * scale}
        scaleX={scale}
        scaleY={scale}
        onTouchMove={handleTouchMove}
        onTouchEnd={endPinch}
      >
        <Layer>
          <Rect x={0} y={0} width={BASE_WIDTH} height={BASE_HEIGHT} fill="#0b0b0b" listening={false} />
          <FrameLayer side="left" />
          <FrameLayer side="right" />
          <ImageHalf side="left" />
          <ImageHalf side="right" />
        </Layer>
        <Layer listening={false}>
          <DividerLayer />
          <VsBadge />
          <LabelsLayer />
        </Layer>
      </Stage>
    </div>
  )
})

EditorStage.displayName = 'EditorStage'
export default EditorStage
