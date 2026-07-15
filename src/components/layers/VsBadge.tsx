import { Text } from 'react-konva'
import { INK, VS_FONT_FAMILY } from '../../constants'
import { CX, PLATE_BOTTOM, PLATE_TOP } from '../../lib/geometry'

const CY = (PLATE_TOP + PLATE_BOTTOM) / 2

/**
 * The centerpiece: a gigantic, dead-flat "VS" in the heavy grotesque, solid
 * ink, tilted off-axis so it reads as slapped-on rather than typeset. No
 * shadow, no glow — just type doing the work.
 */
export default function VsBadge() {
  return (
    <Text
      text="VS"
      x={CX}
      y={CY}
      width={800}
      height={400}
      offsetX={400}
      offsetY={200}
      rotation={-20}
      align="center"
      verticalAlign="middle"
      fontFamily={VS_FONT_FAMILY}
      fontSize={270}
      letterSpacing={-8}
      fill={INK}
      listening={false}
    />
  )
}
