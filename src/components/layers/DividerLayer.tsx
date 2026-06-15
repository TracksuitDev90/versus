import { Line } from 'react-konva'
import { lightningPoints } from '../../lib/geometry'

/** Jagged lightning bolt running along the diagonal seam: a wide dark backing,
 *  a bright yellow body, and a thin white core for a glowing look. */
export default function DividerLayer() {
  const points = lightningPoints()
  const common = {
    points,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    listening: false,
  }
  return (
    <>
      <Line {...common} stroke="#1b1b1b" strokeWidth={34} />
      <Line
        {...common}
        stroke="#ffd400"
        strokeWidth={20}
        shadowColor="#ffe600"
        shadowBlur={24}
        shadowOpacity={0.9}
      />
      <Line {...common} stroke="#ffffff" strokeWidth={7} />
    </>
  )
}
