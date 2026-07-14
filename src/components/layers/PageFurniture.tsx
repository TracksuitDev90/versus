import { Rect, Text } from 'react-konva'
import { BASE_HEIGHT, INK, MONO_FONT_FAMILY } from '../../constants'
import { PLATE_LEFT, PLATE_RIGHT } from '../../lib/geometry'
import { useEditorStore } from '../../store/useEditorStore'

const WIDTH = PLATE_RIGHT - PLATE_LEFT

// Shared style for every caption: bold typewriter mono, tracked out, flat ink.
const mono = {
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 19,
  fontStyle: 'bold',
  letterSpacing: 2.5,
  fill: INK,
  wrap: 'none',
  ellipsis: true,
  listening: false,
} as const

/**
 * The magazine chrome baked into every export: a thick-and-thin double rule up
 * top (a classic masthead device), mono caption lines, and a folio strip along
 * the foot that quotes the two labels like a running head.
 */
export default function PageFurniture() {
  const labels = useEditorStore((s) => s.labels)
  const matchup = `${labels.left.text} vs. ${labels.right.text}`.toUpperCase()

  return (
    <>
      {/* Masthead double rule: one heavy, one hairline. */}
      <Rect x={PLATE_LEFT} y={48} width={WIDTH} height={8} fill={INK} listening={false} />
      <Rect x={PLATE_LEFT} y={62} width={WIDTH} height={2} fill={INK} listening={false} />

      <Text {...mono} x={PLATE_LEFT} y={82} width={WIDTH * 0.6} text="A HEAD-TO-HEAD IN TWO PICTURES" />
      <Text
        {...mono}
        x={PLATE_LEFT + WIDTH * 0.6}
        y={82}
        width={WIDTH * 0.4}
        align="right"
        text="№ 001 — FREE EDITION"
      />

      {/* Foot rule + folio line. The left slot quotes the current matchup. */}
      <Rect x={PLATE_LEFT} y={BASE_HEIGHT - 82} width={WIDTH} height={2} fill={INK} listening={false} />
      <Text {...mono} x={PLATE_LEFT} y={BASE_HEIGHT - 64} width={WIDTH * 0.62} text={matchup} />
      <Text
        {...mono}
        x={PLATE_LEFT + WIDTH * 0.62}
        y={BASE_HEIGHT - 64}
        width={WIDTH * 0.38}
        align="right"
        text="PRINTED IN THE BROWSER"
      />
    </>
  )
}
