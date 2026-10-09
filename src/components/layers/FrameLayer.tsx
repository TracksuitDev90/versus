import { Line } from 'react-konva'
import { PAPER, type SideId } from '../../constants'
import { BLOCK_OFFSET, flatten, framePolygon, imagePolygon, ORB_CENTER } from '../../lib/geometry'
import { frameFillProps } from '../../lib/gradient'
import { inkOf, useEditorStore } from '../../store/useEditorStore'

/** A flat block of the side's spot ink behind its photo plate, nudged toward
 *  the outer bottom corner so a sliver shows on two edges — the look of a
 *  misregistered second ink on a press sheet, not a drop shadow. Over it sits
 *  the empty plate: black stock washed with the side's ink, brightest by the
 *  orb as if its light were spilling across. A photo covers the plate fully. */
export default function FrameLayer({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const polygon = framePolygon(side)
  const fill = frameFillProps(frame, polygon)
  const dx = side === 'left' ? -BLOCK_OFFSET : BLOCK_OFFSET
  const ink = inkOf(frame)

  return (
    <>
      <Line
        points={flatten(polygon)}
        closed
        x={dx}
        y={BLOCK_OFFSET}
        listening={false}
        {...fill}
      />
      <Line points={flatten(imagePolygon(side))} closed fill={PAPER} listening={false} />
      <Line
        points={flatten(imagePolygon(side))}
        closed
        listening={false}
        fillRadialGradientStartPoint={ORB_CENTER}
        fillRadialGradientEndPoint={ORB_CENTER}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={980}
        fillRadialGradientColorStops={[0, withAlpha(ink, 0.5), 0.45, withAlpha(ink, 0.16), 1, withAlpha(ink, 0)]}
      />
    </>
  )
}

/** `#rrggbb` + alpha → `#rrggbbaa`, which canvas gradients accept. */
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex.slice(0, 7)}${a}`
}
