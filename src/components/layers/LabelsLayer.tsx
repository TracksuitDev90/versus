import { Group, Text } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH } from '../../constants'
import { hexToHsl, hslToHex } from '../../lib/palette'
import { useEditorStore } from '../../store/useEditorStore'
import type { LabelState } from '../../store/useEditorStore'

const MARGIN = 69
const BOX_WIDTH = BASE_WIDTH / 2 - MARGIN * 1.5

// Perspective ground-tilt tuning. Rather than a floating 3D block, the label is
// foreshortened and leaned so it reads as printed onto the angled surface and
// tilting toward the viewer. A single dark copy behind it grounds it with a
// contact shadow.
const LEAN = -0.12 // skewX; negative = top leans right (forward like gig-poster type)
const FORESHORTEN = 0.82 // scaleY; <1 squashes the height for the tilted-plane look
const CONTACT_DX = 4 // contact-shadow offset behind the fill (design units)
const CONTACT_DY = 8

/** Darken the label color for the contact shadow so it stays tied to the fill. */
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

/** A single side's label — flat, or tilted into perspective when `perspective`. */
function LabelText({
  label,
  x,
  align,
}: {
  label: LabelState
  x: number
  align: 'left' | 'right'
}) {
  const textProps = {
    text: label.text,
    width: BOX_WIDTH,
    align,
    fontFamily: label.fontFamily,
    // The curated options are all heavy display faces; faux-bold synthesis both
    // looks muddy and breaks web-font resolution for multi-word families.
    fontStyle: 'normal',
    fontSize: label.fontSize,
    letterSpacing: 2,
  } as const

  if (!label.perspective) {
    const y = BASE_HEIGHT - label.fontSize - MARGIN
    return <Text x={x} y={y} fill={label.fill} {...textProps} {...labelOutline} />
  }

  const shade = extrudeShade(label.fill)

  // Pin the near (bottom) edge a fixed margin from the canvas bottom and lay the
  // text out *above* the origin, so foreshorten + skew tilt the plane upward and
  // away from the viewer while the baseline stays put as the size changes.
  const baselineY = BASE_HEIGHT - MARGIN
  // The lean shifts the top rightward; nudge the group left by ~half that reach
  // over the text height to keep the slanted text inside its box.
  const skewShift = LEAN * label.fontSize * 0.5

  return (
    <Group x={x + skewShift} y={baselineY} skewX={LEAN} scaleY={FORESHORTEN}>
      {/* Contact shadow: one dark copy nudged down/back to ground the text. */}
      <Text
        x={CONTACT_DX}
        y={-label.fontSize + CONTACT_DY}
        fill={shade}
        listening={false}
        {...textProps}
      />
      {/* Bright fill on top, with the existing stroke + shadow for legibility. */}
      <Text x={0} y={-label.fontSize} fill={label.fill} {...textProps} {...labelOutline} />
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
