import { Group, Text } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH } from '../../constants'
import { hexToHsl, hslToHex } from '../../lib/palette'
import { useEditorStore } from '../../store/useEditorStore'
import type { LabelState } from '../../store/useEditorStore'

const MARGIN = 69
const BOX_WIDTH = BASE_WIDTH / 2 - MARGIN * 1.5

// "3D block" tuning. The extrusion is a stack of offset copies drawn behind the
// bright fill; the slant leans the whole label forward like the gig-poster type.
const EXTRUDE_STEPS = 9 // number of stacked copies behind the fill
const EXTRUDE_DX = 3 // per-step offset toward bottom-right (design units)
const EXTRUDE_DY = 3
const SLANT = -0.18 // skewX; negative = top leans right (forward italic)

/** Darken the label color for the extrusion so the depth stays tied to the fill. */
function extrudeShade(fill: string): string {
  const { h, s, l } = hexToHsl(fill)
  return hslToHex(h, s, Math.max(0, l * 0.35))
}

/** Bold corner labels with stroke + shadow for legibility over the photos. */
export default function LabelsLayer() {
  const labels = useEditorStore((s) => s.labels)

  return (
    <>
      <LabelText
        label={labels.left}
        x={MARGIN}
        align="left"
      />
      <LabelText
        label={labels.right}
        x={BASE_WIDTH - MARGIN - BOX_WIDTH}
        align="right"
      />
    </>
  )
}

/** A single side's label — flat, or slanted + extruded when `dimensional`. */
function LabelText({
  label,
  x,
  align,
}: {
  label: LabelState
  x: number
  align: 'left' | 'right'
}) {
  const y = BASE_HEIGHT - label.fontSize - MARGIN

  const textProps = {
    text: label.text,
    width: BOX_WIDTH,
    align,
    fontFamily: label.fontFamily,
    fontStyle: 'bold',
    fontSize: label.fontSize,
    letterSpacing: 2,
  } as const

  if (!label.dimensional) {
    return <Text x={x} y={y} fill={label.fill} {...textProps} {...labelOutline} />
  }

  const shade = extrudeShade(label.fill)

  // Skew shears about the node origin, pushing the (lower) baseline left; nudge x
  // right by roughly half the slant's reach over the text height to keep it in box.
  const skewShift = -SLANT * label.fontSize * 0.5

  return (
    <Group x={x + skewShift} y={y} skewX={SLANT}>
      {/* Extrusion: deepest copy first, nearest last, all in the dark shade. */}
      {Array.from({ length: EXTRUDE_STEPS }, (_, i) => {
        const depth = EXTRUDE_STEPS - i // farthest gets the largest offset
        return (
          <Text
            key={i}
            x={depth * EXTRUDE_DX}
            y={depth * EXTRUDE_DY}
            fill={shade}
            listening={false}
            {...textProps}
          />
        )
      })}
      {/* Bright fill on top, with the existing stroke + shadow for legibility. */}
      <Text x={0} y={0} fill={label.fill} {...textProps} {...labelOutline} />
    </Group>
  )
}

const labelOutline = {
  // A restrained outline reads as professional; the shadow does the heavy
  // lifting for legibility over busy photos.
  stroke: '#000000',
  strokeWidth: 2.5,
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  shadowOpacity: 0.55,
  listening: false,
  // Paint fill over stroke so the text color stays crisp.
  fillAfterStrokeEnabled: true,
} as const
