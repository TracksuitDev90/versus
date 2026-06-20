import Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Circle, Group, Line } from 'react-konva'
import type { SideId } from '../../constants'
import { flatten, framePolygon, type Pt } from '../../lib/geometry'
import { frameFillProps } from '../../lib/gradient'
import { makeSplatter } from '../../lib/texture'
import { useEditorStore } from '../../store/useEditorStore'

/** The colored backing for one side; the photo is inset on top, so this shows
 *  as the frame/border and the seam along the divider. The gradient carries a
 *  subtle film grain plus a sprinkle of splatter for a richer, printed feel. */
export default function FrameLayer({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const polygon = framePolygon(side)
  const fill = frameFillProps(frame, polygon)
  const points = flatten(polygon)

  const fillRef = useRef<Konva.Line>(null)

  // Cache the gradient shape so the Noise filter can stipple grain into it.
  // Re-cache whenever the fill changes (mode/colors/angle).
  useEffect(() => {
    const node = fillRef.current
    if (!node) return
    node.cache({ pixelRatio: 2 })
    node.getLayer()?.batchDraw()
  }, [frame.mode, frame.solid, frame.gradient.from, frame.gradient.to, frame.gradient.angle, side])

  const splats = makeSplatter(side === 'left' ? 1337 : 7331, polygon, 40)

  return (
    <Group clipFunc={(ctx) => traceClip(ctx, polygon)} listening={false}>
      <Line
        ref={fillRef}
        points={points}
        closed
        listening={false}
        filters={[Konva.Filters.Noise]}
        noise={0.16}
        {...fill}
      />
      {splats.map((s, i) => (
        <Circle
          key={i}
          x={s.x}
          y={s.y}
          radius={s.r}
          fill={s.light ? '#ffffff' : '#000000'}
          opacity={s.opacity}
          listening={false}
        />
      ))}
    </Group>
  )
}

function traceClip(ctx: Konva.Context, polygon: Pt[]) {
  const flat = flatten(polygon)
  ctx.beginPath()
  ctx.moveTo(flat[0], flat[1])
  for (let i = 2; i < flat.length; i += 2) ctx.lineTo(flat[i], flat[i + 1])
  ctx.closePath()
}
