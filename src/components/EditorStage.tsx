import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { Layer, Rect, Stage } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH, FONT_OPTIONS, VS_FONT_FAMILY, type SideId } from '../constants'
import { CX, imagePolygon } from '../lib/geometry'
import { zoomKeepingCenter } from '../lib/image'
import { FLAME_BACKDROP } from '../lib/flames'
import { useResponsiveStage } from '../lib/useResponsiveStage'
import { useEditorStore } from '../store/useEditorStore'
import DividerLayer from './layers/DividerLayer'
import FlameBackdrop from './layers/FlameBackdrop'
import ImageHalf, { MAX_ZOOM_FACTOR } from './layers/ImageHalf'
import LabelsLayer from './layers/LabelsLayer'
import VsBadge from './layers/VsBadge'

/**
 * Konva draws text to a canvas, which paints with a fallback font if the web
 * font isn't loaded yet and never repaints on its own. So eagerly fetch every
 * display face up front (canvas alone won't trigger the download) and flip a flag
 * once they're ready, which we use to remount the text layer with correct glyphs
 * and metrics.
 */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (!document.fonts) {
      setReady(true)
      return
    }
    let cancelled = false
    const families = [VS_FONT_FAMILY, ...FONT_OPTIONS.map((f) => f.value)]
    Promise.all(
      families.flatMap((fam) => [
        document.fonts.load(`bold 96px "${fam}"`),
        document.fonts.load(`400 120px "${fam}"`),
      ]),
    )
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return ready
}

/** The scaled Konva stage hosting every layer. Forwards the stage ref so the
 *  export helper can rasterize it at high resolution. */
const EditorStage = forwardRef<Konva.Stage>((_, ref) => {
  const { containerRef, scale } = useResponsiveStage()
  const fontsReady = useFontsReady()
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
        {/* Backdrop gets its own layer so the flame animation redraws only two
            cached bitmaps, never the photos above. */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
            fill={FLAME_BACKDROP}
            listening={false}
          />
          <FlameBackdrop />
        </Layer>
        <Layer>
          <ImageHalf side="left" />
          <ImageHalf side="right" />
          {/* Soft radial vignette pushes the eye toward the center clash. */}
          <Rect
            x={0}
            y={0}
            width={BASE_WIDTH}
            height={BASE_HEIGHT}
            fillRadialGradientStartPoint={{ x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2 }}
            fillRadialGradientEndPoint={{ x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2 }}
            fillRadialGradientStartRadius={520}
            fillRadialGradientEndRadius={1110}
            fillRadialGradientColorStops={[0, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.28)']}
            listening={false}
          />
        </Layer>
        {/* Remount once fonts are ready so canvas text re-measures and re-rasterizes
            with the real faces instead of the fallback. */}
        <Layer key={fontsReady ? 'fonts-ready' : 'fonts-loading'} listening={false}>
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
