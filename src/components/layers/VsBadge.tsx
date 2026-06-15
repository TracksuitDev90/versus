import { Line, Text } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH, FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'
import { starburstPoints } from '../../lib/starburst'

const CY = BASE_HEIGHT / 2

/** The centerpiece: layered starburst explosion with a bold "VS" on top. */
export default function VsBadge() {
  return (
    <>
      {/* Outer dark burst for contrast */}
      <Line
        points={starburstPoints(CX, CY, 200, 96, 16, 0)}
        closed
        fill="#1b1b1b"
        listening={false}
      />
      {/* Red mid burst */}
      <Line
        points={starburstPoints(CX, CY, 178, 90, 16, Math.PI / 16)}
        closed
        fill="#e11d2a"
        listening={false}
      />
      {/* Bright yellow inner burst */}
      <Line
        points={starburstPoints(CX, CY, 150, 80, 12, Math.PI / 12)}
        closed
        fillRadialGradientStartPoint={{ x: CX, y: CY }}
        fillRadialGradientEndPoint={{ x: CX, y: CY }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={150}
        fillRadialGradientColorStops={[0, '#fff4b8', 1, '#ffcf00']}
        listening={false}
      />
      {/* VS text */}
      <Text
        text="VS"
        x={CX - BASE_WIDTH / 2}
        y={CY - 90}
        width={BASE_WIDTH}
        align="center"
        fontFamily={FONT_FAMILY}
        fontStyle="bold"
        fontSize={140}
        fill="#ffffff"
        stroke="#1b1b1b"
        strokeWidth={6}
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.45}
        listening={false}
      />
    </>
  )
}
