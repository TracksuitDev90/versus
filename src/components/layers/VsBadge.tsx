import { Circle, Line, Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'
import { starburstPoints } from '../../lib/starburst'

const CY = BASE_HEIGHT / 2

// Every burst ring shares the same center, spike count and rotation so the layers
// nest perfectly concentric — that's what makes it read as polished rather than
// a pile of mismatched stars.
const SPIKES = 18

/** The centerpiece: a clean, concentric starburst seal with a bold "VS" on top. */
export default function VsBadge() {
  return (
    <>
      {/* Soft drop shadow for depth, blurred well behind the seal. */}
      <Line
        points={starburstPoints(CX, CY, 214, 132, SPIKES)}
        closed
        fill="#000000"
        opacity={0.35}
        shadowColor="#000000"
        shadowBlur={30}
        shadowOpacity={0.6}
        listening={false}
      />
      {/* Dark outline burst. */}
      <Line
        points={starburstPoints(CX, CY, 212, 130, SPIKES)}
        closed
        fill="#141414"
        listening={false}
      />
      {/* Crisp white rim peeking between the dark outline and the red body. */}
      <Line
        points={starburstPoints(CX, CY, 200, 122, SPIKES)}
        closed
        fill="#ffffff"
        listening={false}
      />
      {/* Red body burst. */}
      <Line
        points={starburstPoints(CX, CY, 190, 116, SPIKES)}
        closed
        fill="#e11d2a"
        listening={false}
      />
      {/* Solid golden disc gives the VS a clean, even base to sit on. */}
      <Circle
        x={CX}
        y={CY}
        radius={120}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={120}
        fillRadialGradientColorStops={[0, '#fff6cc', 0.7, '#ffd400', 1, '#f5b400']}
        listening={false}
      />
      {/* Thin dark ring to define the disc edge. */}
      <Circle x={CX} y={CY} radius={120} stroke="#141414" strokeWidth={4} listening={false} />
      {/* VS text — heavier Bowlby One face, perfectly centered on the seal. */}
      <Text
        text="VS"
        x={CX - 180}
        y={CY - 100}
        width={360}
        height={200}
        align="center"
        verticalAlign="middle"
        fontFamily={VS_FONT_FAMILY}
        fontSize={120}
        letterSpacing={6}
        fill="#ffffff"
        stroke="#141414"
        strokeWidth={3}
        fillAfterStrokeEnabled
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.4}
        listening={false}
      />
    </>
  )
}
