import Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Circle, Group, Rect } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH } from '../../constants'
import { makeFlecks } from '../../lib/texture'

// Seeded (differently from the sheet underneath) so the overlay is stable
// across re-renders and exports.
const flecks = makeFlecks(19871123, BASE_WIDTH, BASE_HEIGHT, 220)

/**
 * A grain pass laid over the photos: a mid-gray sheet run through the Noise
 * filter and composited in soft-light, so only the noise deviations show —
 * uploaded photos pick up the same paper tooth as the sheet they sit on.
 * A second scatter of fiber flecks rides along so the stock's impurities
 * read on top of the pictures too. Cached once at 2× for sharp exports.
 */
export default function GrainLayer() {
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.cache({ pixelRatio: 2 })
    node.getLayer()?.batchDraw()
  }, [])

  return (
    <Group
      ref={ref}
      listening={false}
      filters={[Konva.Filters.Noise]}
      noise={0.55}
      globalCompositeOperation="soft-light"
      opacity={0.65}
    >
      <Rect x={0} y={0} width={BASE_WIDTH} height={BASE_HEIGHT} fill="#808080" listening={false} />
      {flecks.map((f, i) => (
        <Circle
          key={i}
          x={f.x}
          y={f.y}
          radius={f.r}
          fill={f.dark ? '#3a352b' : '#e8e2d2'}
          opacity={f.opacity * 3}
          listening={false}
        />
      ))}
    </Group>
  )
}
