import { useEffect, useRef } from 'react'
import { PAPER } from '../constants'
import { AuraRenderer, auraFill, auraStops, rgbFloats, type AuraFrame } from '../lib/aura'
import { currentTick, kick, subscribe, surfaceAmp, type AuraTick } from '../lib/auraMotion'
import { inkOf, useEditorStore } from '../store/useEditorStore'

const BODY = rgbFloats(PAPER)

/**
 * The masthead's mark: a small live copy of the stage orb, lit by the same two
 * inks and breathing on the same clock. Hover or tap it to make it ripple.
 */
export default function AuraMark() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<AuraRenderer | null>(null)
  const tickRef = useRef<AuraTick>(currentTick())

  const left = useEditorStore((s) => inkOf(s.frames.left))
  const right = useEditorStore((s) => inkOf(s.frames.right))
  const ripple = useEditorStore((s) => s.aura.ripple)
  const glow = useEditorStore((s) => s.aura.glow)

  // Latest look, read by the animation callback without re-subscribing.
  const look = useRef<Omit<AuraFrame, 'time' | 'amp' | 'seed'> & { ripple: number }>()
  look.current = {
    stops: auraStops(left, right),
    fill: auraFill(left, right),
    body: BODY,
    tremble: 0.006,
    glow,
    grain: 0.45,
    ripple,
  }

  const paint = (tick: AuraTick) => {
    tickRef.current = tick
    const r = rendererRef.current
    const l = look.current
    if (!r || !l) return
    r.render({ ...l, time: tick.time, amp: surfaceAmp(l.ripple, tick), seed: tick.seed })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = AuraRenderer.create(canvas)
    if (!renderer) {
      canvas.hidden = true
      return
    }
    rendererRef.current = renderer

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      renderer.setSize(canvas.clientWidth * dpr, canvas.clientHeight * dpr)
      paint(tickRef.current)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const unsubscribe = subscribe(paint)
    return () => {
      ro.disconnect()
      unsubscribe()
      rendererRef.current = null
    }
  }, [])

  // Repaint on look changes too, so a frozen mark still follows the inks.
  useEffect(() => paint(tickRef.current), [left, right, ripple, glow])

  return (
    <canvas
      ref={canvasRef}
      className="masthead__mark"
      aria-hidden="true"
      onPointerEnter={() => kick(0.6)}
      onPointerDown={() => kick(1)}
    />
  )
}
