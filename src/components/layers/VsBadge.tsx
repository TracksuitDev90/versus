import { Line, Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'
import { roughStarburstPoints } from '../../lib/starburst'

const CY = BASE_HEIGHT / 2
const SPIKES = 16
const SEED = 20240620 // shared so every ring's hand-drawn wobble lines up

// Same seed => aligned silhouette; descending radii give uneven, inked rims
// instead of a flat machine-cut star.
const outlinePts = roughStarburstPoints(CX, CY, 312, 192, SPIKES, SEED)
const bodyPts = roughStarburstPoints(CX, CY, 292, 178, SPIKES, SEED)

/** The centerpiece: a hand-drawn red "punch" burst with a bold "VS" on top. */
export default function VsBadge() {
  return (
    <>
      {/* Soft drop shadow for depth. */}
      <Line
        points={outlinePts}
        closed
        fill="#000000"
        opacity={0.32}
        shadowColor="#000000"
        shadowBlur={40}
        shadowOpacity={0.55}
        listening={false}
      />
      {/* Dark inked outline. */}
      <Line points={outlinePts} closed fill="#141414" listening={false} />
      {/* Red body. */}
      <Line points={bodyPts} closed fill="#e11d2a" listening={false} />

      {/* VS text — heavier Bowlby One face, perfectly centered on the punch. */}
      <Text
        text="VS"
        x={CX - 270}
        y={CY - 150}
        width={540}
        height={300}
        align="center"
        verticalAlign="middle"
        fontFamily={VS_FONT_FAMILY}
        fontSize={180}
        letterSpacing={9}
        fill="#ffffff"
        stroke="#141414"
        strokeWidth={5}
        fillAfterStrokeEnabled
        shadowColor="#000000"
        shadowBlur={12}
        shadowOpacity={0.5}
        listening={false}
      />
    </>
  )
}
