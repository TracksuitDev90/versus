import { Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'

const CY = BASE_HEIGHT / 2

/**
 * The bold "VS" riding the center of the poster. No decoration behind it —
 * the flame vortex leaves a dark eye at the canvas center, and the heavier
 * stroke + shadow keep the glyphs crisp over flames and photos alike.
 */
export default function VsBadge() {
  return (
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
      strokeWidth={6}
      fillAfterStrokeEnabled
      shadowColor="#000000"
      shadowBlur={26}
      shadowOpacity={0.75}
      listening={false}
    />
  )
}
