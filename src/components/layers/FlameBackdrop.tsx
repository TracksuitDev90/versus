import Konva from 'konva'
import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Path } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH } from '../../constants'
import { buildEmbers, FLAME_SHAPES, flameTones, type FlameTones } from '../../lib/flames'
import { CX, framePolygon, traceClip } from '../../lib/geometry'
import { useEditorStore } from '../../store/useEditorStore'

const CY = BASE_HEIGHT / 2
const SIDES = ['left', 'right'] as const

// The flame bitmap spans ~2.5k px square; caching at 2 like the other layers
// would cost ~100MB per side, so the editor caches lighter and the export
// path uncaches entirely to rasterize the vectors sharp at any pixelRatio.
const CACHE_RATIO = 1.25
const ROTATION_DEG_PER_SEC = 1.5
const EMBERS_PER_SIDE = 24

const toneKeys = ['shade', 'base', 'highlight'] as const

const embers = {
  left: buildEmbers(411, EMBERS_PER_SIDE, BASE_WIDTH, BASE_HEIGHT),
  right: buildEmbers(722, EMBERS_PER_SIDE, BASE_WIDTH, BASE_HEIGHT),
}

/**
 * The flame vortex backdrop: one shared geometry rendered twice, clipped to
 * each half and tinted from that side's frame color, so the swirl runs
 * continuously across the seam while the tone family flips on it. The vortex
 * slowly rotates about the canvas center in the editor (reduced-motion aware);
 * export freezes it wherever it is — the swirl is rotationally uniform, so any
 * angle is a valid poster.
 */
export default function FlameBackdrop() {
  const left = useEditorStore((s) => s.frames.left)
  const right = useEditorStore((s) => s.frames.right)
  const exporting = useEditorStore((s) => s.exporting)

  const tones: Record<(typeof SIDES)[number], FlameTones> = {
    left: useMemo(() => flameTones(left), [left]),
    right: useMemo(() => flameTones(right), [right]),
  }

  const rotRefs = { left: useRef<Konva.Group>(null), right: useRef<Konva.Group>(null) }
  const cacheRefs = { left: useRef<Konva.Group>(null), right: useRef<Konva.Group>(null) }
  const emberRefs = { left: useRef<Konva.Group>(null), right: useRef<Konva.Group>(null) }

  // Cache each side's flame group to a bitmap so the per-frame cost of the
  // animation is two cached draws; uncache while exporting for sharp vectors.
  const toneKey = SIDES.map((s) => Object.values(tones[s]).join('|')).join('|')
  useEffect(() => {
    for (const side of SIDES) {
      const node = cacheRefs[side].current
      if (!node) continue
      if (exporting) node.clearCache()
      else node.cache({ pixelRatio: CACHE_RATIO })
    }
    cacheRefs.left.current?.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toneKey, exporting])

  // One animation drives both halves: slow rotation + a barely-there breathing
  // pulse on the vortex, and time-derived drift/twinkle for the embers.
  useEffect(() => {
    if (exporting) return
    if (typeof window.matchMedia !== 'function') return

    const layer = rotRefs.left.current?.getLayer()
    if (!layer) return

    let anim: Konva.Animation | null = null
    const tick = (frame?: { time: number }) => {
      if (!frame) return
      const t = frame.time
      const rot = (t / 1000) * ROTATION_DEG_PER_SEC
      const pulse = 1 + 0.006 * Math.sin(t * 0.0015)
      for (const side of SIDES) {
        rotRefs[side].current?.rotation(rot)
        rotRefs[side].current?.scale({ x: pulse, y: pulse })
        const children = emberRefs[side].current?.getChildren() ?? []
        embers[side].forEach((e, i) => {
          const node = children[i]
          if (!node) return
          const range = BASE_HEIGHT + 60
          const y = ((((e.y - e.speed * (t / 1000)) % range) + range) % range) - 30
          node.y(y)
          node.x(e.x + 26 * Math.sin(t * 0.0004 + e.phase))
          node.opacity(e.baseOpacity * (0.7 + 0.3 * Math.sin(t * 0.001 + e.phase * 1.7)))
        })
      }
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const start = () => {
      if (anim) return
      anim = new Konva.Animation(tick, layer)
      anim.start()
    }
    const stop = () => {
      anim?.stop()
      anim = null
    }
    const sync = () => (media.matches ? stop() : start())
    sync()
    media.addEventListener('change', sync)
    return () => {
      media.removeEventListener('change', sync)
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exporting])

  return (
    <>
      {SIDES.map((side) => (
        <Group key={side} clipFunc={(ctx) => traceClip(ctx, framePolygon(side))} listening={false}>
          {/* Rotation happens inside the clip so the clip region stays put. */}
          <Group x={CX} y={CY} ref={rotRefs[side]}>
            <Group ref={cacheRefs[side]}>
              {FLAME_SHAPES.map((shape, i) =>
                shape.kind === 'circle' ? (
                  <Circle
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.r}
                    fill={tones[side][toneKeys[shape.tone]]}
                    listening={false}
                  />
                ) : (
                  <Path
                    key={i}
                    data={shape.data}
                    fill={tones[side][toneKeys[shape.tone]]}
                    listening={false}
                  />
                ),
              )}
            </Group>
          </Group>
          {/* Drifting sparks; when motion stops they freeze in place as static flecks. */}
          <Group ref={emberRefs[side]}>
            {embers[side].map((e, i) => (
              <Circle
                key={i}
                x={e.x}
                y={e.y}
                radius={e.r}
                fill={tones[side].highlight}
                opacity={e.baseOpacity}
                listening={false}
              />
            ))}
          </Group>
        </Group>
      ))}
    </>
  )
}
