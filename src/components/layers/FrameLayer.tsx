import { Line } from 'react-konva'
import type { SideId } from '../../constants'
import { flatten, framePolygon } from '../../lib/geometry'
import { frameFillProps } from '../../lib/gradient'
import { useEditorStore } from '../../store/useEditorStore'

/** The colored backing for one side; the photo is inset on top, so this shows
 *  as the frame/border and the seam along the divider. */
export default function FrameLayer({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const polygon = framePolygon(side)
  const fill = frameFillProps(frame, polygon)

  return <Line points={flatten(polygon)} closed listening={false} {...fill} />
}
