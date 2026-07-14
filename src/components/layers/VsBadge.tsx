import { Text } from 'react-konva'
import { INK, PAPER, VS_FONT_FAMILY } from '../../constants'
import { CX, PLATE_BOTTOM, PLATE_TOP } from '../../lib/geometry'

const CY = (PLATE_TOP + PLATE_BOTTOM) / 2

/**
 * The centerpiece: a gigantic, dead-flat "VS" in the heavy grotesque, solid ink
 * with a thick paper keyline so it separates cleanly where it crosses the
 * photos. No shadow, no glow — just type doing the work.
 */
export default function VsBadge() {
  return (
    <Text
      text="VS"
      x={CX - 400}
      y={CY - 200}
      width={800}
      height={400}
      align="center"
      verticalAlign="middle"
      fontFamily={VS_FONT_FAMILY}
      fontSize={300}
      letterSpacing={-8}
      fill={INK}
      stroke={PAPER}
      strokeWidth={24}
      fillAfterStrokeEnabled
      listening={false}
    />
  )
}
