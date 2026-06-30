import { Circle, Line } from 'react-konva'
import { lightningPoints, seamSamples } from '../../lib/geometry'

/** Jagged lightning bolt running along the diagonal seam: a dark backing, a
 *  yellow body, a patchy halftone shade, and a thin white core. Kept restrained
 *  so it reads as a structural divider rather than competing with the artwork. */
export default function DividerLayer() {
  const points = lightningPoints()
  const common = {
    points,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    listening: false,
  }

  return (
    <>
      <Line {...common} stroke="#141414" strokeWidth={40} />
      <Line
        {...common}
        stroke="#ffd400"
        strokeWidth={22}
        shadowColor="#ffe600"
        shadowBlur={16}
        shadowOpacity={0.45}
      />
      <HalftoneShade />
      <Line {...common} stroke="#ffffff" strokeWidth={8} opacity={0.7} />
    </>
  )
}

/** Subtle halftone dots laid across the yellow body, fading in and out in
 *  patches along the bolt so it reads as hand-screened rather than flat. */
function HalftoneShade() {
  const samples = seamSamples(120)
  const cols = [-8, -3, 3, 8] // offsets across the band (within the thinner body)
  const dots: { x: number; y: number; r: number; o: number }[] = []

  samples.forEach((s, i) => {
    const t = i / (samples.length - 1)
    // Three soft lobes along the length => halftone appears "in places".
    const patch = Math.max(0, Math.sin(t * Math.PI * 3))
    if (patch < 0.2) return
    cols.forEach((c, j) => {
      const r = (1.2 + 1.4 * patch) * (j % 2 ? 0.75 : 1)
      dots.push({
        x: s.x + s.nx * c,
        y: s.y + s.ny * c,
        r,
        o: 0.08 + 0.12 * patch,
      })
    })
  })

  return (
    <>
      {dots.map((d, i) => (
        <Circle key={i} x={d.x} y={d.y} radius={d.r} fill="#1b1200" opacity={d.o} listening={false} />
      ))}
    </>
  )
}
