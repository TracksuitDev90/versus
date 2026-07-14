import Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Circle, Group, Rect } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH, PAPER } from '../../constants'
import { makeFlecks } from '../../lib/texture'

// Seeded once so the sheet is identical across re-renders and exports.
const flecks = makeFlecks(19450507, BASE_WIDTH, BASE_HEIGHT)

/**
 * The sheet itself: warm uncoated paper with a fine grain (Noise filter) and a
 * scatter of fiber flecks, like recycled stock. Cached once — the texture never
 * changes — at 2× so it stays convincing in high-resolution exports.
 */
export default function PaperLayer() {
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.cache({ pixelRatio: 2 })
    node.getLayer()?.batchDraw()
  }, [])

  return (
    <Group ref={ref} listening={false} filters={[Konva.Filters.Noise]} noise={0.055}>
      <Rect x={0} y={0} width={BASE_WIDTH} height={BASE_HEIGHT} fill={PAPER} listening={false} />
      {flecks.map((f, i) => (
        <Circle
          key={i}
          x={f.x}
          y={f.y}
          radius={f.r}
          fill={f.dark ? '#6f6553' : '#ffffff'}
          opacity={f.opacity}
          listening={false}
        />
      ))}
    </Group>
  )
}
