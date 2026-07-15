import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Label, Tag, Text } from 'react-konva'
import type { SideId } from '../../constants'
import {
  PLATE_BOTTOM,
  PLATE_LEFT,
  PLATE_RIGHT,
  PLATE_TOP,
} from '../../lib/geometry'
import { useEditorStore } from '../../store/useEditorStore'
import type { FrameColor } from '../../store/useEditorStore'

// Inset from the plate edges. Placement is deliberately asymmetric — left label
// top-left, right label bottom-right — so the headlines balance the diagonal.
// Kept tight so the labels hug the corners and cover as little photo as possible.
const INSET = 16

/** The strip inherits the side's spot ink so type and color stay one system. */
function stripColor(frame: FrameColor): string {
  return frame.mode === 'gradient' ? frame.gradient.from : frame.solid
}

/** Editorial headline labels: heavy flat type, optionally on a kicker strip. */
export default function LabelsLayer() {
  return (
    <>
      <HeadlineLabel side="left" />
      <HeadlineLabel side="right" />
    </>
  )
}

function HeadlineLabel({ side }: { side: SideId }) {
  const label = useEditorStore((s) => s.labels[side])
  const frame = useEditorStore((s) => s.frames[side])

  const labelRef = useRef<Konva.Label>(null)
  const textRef = useRef<Konva.Text>(null)

  // The right label hangs from the plate's bottom-right corner, so it must be
  // offset by its own rendered size — which Konva only knows after layout.
  useEffect(() => {
    const node = labelRef.current ?? textRef.current
    if (!node || side !== 'right') return
    node.offsetX(node.width())
    node.offsetY(node.height())
    node.getLayer()?.batchDraw()
  }, [side, label.text, label.fontFamily, label.fontSize, label.strip])

  const x = side === 'left' ? PLATE_LEFT + INSET : PLATE_RIGHT - INSET
  const y = side === 'left' ? PLATE_TOP + INSET : PLATE_BOTTOM - INSET

  const textProps = {
    text: label.text,
    fontFamily: label.fontFamily,
    // The curated options are all single-weight black faces; faux-bold synthesis
    // both looks muddy and breaks web-font resolution for multi-word families.
    fontStyle: 'normal',
    fontSize: label.fontSize,
    letterSpacing: 1,
    fill: label.fill,
    listening: false,
  } as const

  if (!label.strip) {
    return <Text ref={textRef} x={x} y={y} {...textProps} />
  }

  return (
    <Label ref={labelRef} x={x} y={y} listening={false}>
      <Tag fill={stripColor(frame)} listening={false} />
      <Text {...textProps} padding={Math.round(label.fontSize * 0.3)} />
    </Label>
  )
}
