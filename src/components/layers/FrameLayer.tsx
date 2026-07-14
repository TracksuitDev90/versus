import { Line } from 'react-konva'
import type { SideId } from '../../constants'
import { BLOCK_OFFSET, flatten, framePolygon } from '../../lib/geometry'
import { frameFillProps } from '../../lib/gradient'
import { useEditorStore } from '../../store/useEditorStore'

/** A flat block of the side's spot ink behind its photo plate, nudged toward
 *  the outer bottom corner so a sliver shows on two edges — the look of a
 *  misregistered second ink on a press sheet, not a drop shadow. */
export default function FrameLayer({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const polygon = framePolygon(side)
  const fill = frameFillProps(frame, polygon)
  const dx = side === 'left' ? -BLOCK_OFFSET : BLOCK_OFFSET

  return (
    <Line
      points={flatten(polygon)}
      closed
      x={dx}
      y={BLOCK_OFFSET}
      listening={false}
      {...fill}
    />
  )
}
