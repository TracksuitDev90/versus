import { Line } from 'react-konva'
import { lightningPoints } from '../../lib/geometry'

/** Jagged lightning bolt running along the diagonal seam: a wide dark backing,
 *  a bright yellow body, and a thin white core for a glowing look. Strokes are
 *  ~10% thicker than the base so the divide reads as a confident separator. */
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
      <Line {...common} stroke="#141414" strokeWidth={38} />
      <Line
        {...common}
        stroke="#ffd400"
        strokeWidth={22}
        shadowColor="#ffe600"
        shadowBlur={26}
        shadowOpacity={0.9}
      />
      <Line {...common} stroke="#ffffff" strokeWidth={8} opacity={0.95} />
    </>
  )
}
