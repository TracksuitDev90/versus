import Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Image as KonvaImage } from 'react-konva'
import { PAPER } from '../../constants'
import { AURA_EXTENT, auraFill, auraStops, getStageAura, rgbFloats } from '../../lib/aura'
import { currentTick, subscribe, surfaceAmp, type AuraTick } from '../../lib/auraMotion'
import { ORB_CENTER, ORB_RADIUS } from '../../lib/geometry'
import { inkOf, useEditorStore } from '../../store/useEditorStore'

const BODY = rgbFloats(PAPER)
const SIZE = ORB_RADIUS * AURA_EXTENT * 2 // design units, square

/**
 * The centerpiece light: a dark orb on the seam, rim-lit by the two sides'
 * inks, its surface rippling like liquid. Rendered by WebGL into an offscreen
 * canvas that Konva draws as an image, sized to the orb's real on-screen pixel
 * footprint so the film grain stays fine. Its body is the stock color, so it
 * also gives the VS a dark ground that reads over any photo.
 */
export default function AuraLayer({ scale }: { scale: number }) {
  const enabled = useEditorStore((s) => s.aura.enabled)
  const ripple = useEditorStore((s) => s.aura.ripple)
  const glow = useEditorStore((s) => s.aura.glow)
  const left = useEditorStore((s) => inkOf(s.frames.left))
  const right = useEditorStore((s) => inkOf(s.frames.right))
  const imageRef = useRef<Konva.Image>(null)
  const tickRef = useRef<AuraTick>(currentTick())
  const renderer = getStageAura()

  // Latest look, read by the animation callback without re-subscribing (so
  // dragging a slider never restarts the clock).
  const look = { stops: auraStops(left, right), fill: auraFill(left, right), ripple, glow }
  const lookRef = useRef(look)
  lookRef.current = look

  const paint = (tick: AuraTick) => {
    tickRef.current = tick
    if (!renderer) return
    const l = lookRef.current
    renderer.render({
      stops: l.stops,
      fill: l.fill,
      body: BODY,
      time: tick.time,
      amp: surfaceAmp(l.ripple, tick),
      tremble: 0.006,
      glow: l.glow,
      grain: 0.45,
      seed: tick.seed,
    })
    imageRef.current?.getLayer()?.batchDraw()
  }

  // Match the canvas to the orb's device-pixel size on screen (capped at 2x).
  const pixelSize = SIZE * scale * Math.min(2, Konva.pixelRatio || 1)

  useEffect(() => {
    if (!renderer || !enabled) return
    renderer.setSize(pixelSize, pixelSize)
    return subscribe(paint)
  }, [renderer, enabled, pixelSize])

  // Repaint on look changes too, so a frozen orb still follows the controls.
  useEffect(() => paint(tickRef.current), [left, right, ripple, glow])

  if (!renderer || !enabled) return null

  return (
    <KonvaImage
      ref={imageRef}
      image={renderer.canvas}
      x={ORB_CENTER.x - SIZE / 2}
      y={ORB_CENTER.y - SIZE / 2}
      width={SIZE}
      height={SIZE}
      listening={false}
    />
  )
}
