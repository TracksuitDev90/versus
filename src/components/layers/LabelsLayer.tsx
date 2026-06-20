import { Text } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH } from '../../constants'
import { useEditorStore } from '../../store/useEditorStore'

const MARGIN = 46
const BOX_WIDTH = BASE_WIDTH / 2 - MARGIN * 1.5

/** Bold corner labels with stroke + shadow for legibility over the photos. */
export default function LabelsLayer() {
  const labels = useEditorStore((s) => s.labels)

  return (
    <>
      <Text
        text={labels.left.text}
        x={MARGIN}
        y={BASE_HEIGHT - labels.left.fontSize - MARGIN}
        width={BOX_WIDTH}
        align="left"
        fontFamily={labels.left.fontFamily}
        fontStyle="bold"
        fontSize={labels.left.fontSize}
        fill={labels.left.fill}
        {...labelOutline}
      />
      <Text
        text={labels.right.text}
        x={BASE_WIDTH - MARGIN - BOX_WIDTH}
        y={BASE_HEIGHT - labels.right.fontSize - MARGIN}
        width={BOX_WIDTH}
        align="right"
        fontFamily={labels.right.fontFamily}
        fontStyle="bold"
        fontSize={labels.right.fontSize}
        fill={labels.right.fill}
        {...labelOutline}
      />
    </>
  )
}

const labelOutline = {
  stroke: '#000000',
  strokeWidth: 2,
  letterSpacing: 2,
  shadowColor: '#000000',
  shadowBlur: 6,
  shadowOffsetX: 1,
  shadowOffsetY: 2,
  shadowOpacity: 0.5,
  listening: false,
  // Paint fill over stroke so the text color stays crisp.
  fillAfterStrokeEnabled: true,
} as const
