import type Konva from 'konva'
import { Circle, Group, Line, Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'
import { roughStarburstPoints } from '../../lib/starburst'

const CY = BASE_HEIGHT / 2
const SPIKES = 16
const SEED = 20240620 // shared so every ring's hand-drawn wobble lines up

// Pre-compute the rings once. Same seed => aligned silhouette; descending radii
// give uneven, inked rims instead of a flat machine-cut star.
const outlinePts = roughStarburstPoints(CX, CY, 318, 198, SPIKES, SEED)
const rimPts = roughStarburstPoints(CX, CY, 300, 186, SPIKES, SEED)
const bodyPts = roughStarburstPoints(CX, CY, 285, 174, SPIKES, SEED)

const DISC_R = 178

/** The centerpiece: a hand-drawn starburst seal, halftone-shaded so it feels
 *  screen-printed rather than a flat, cheap solid, with a bold "VS" on top. */
export default function VsBadge() {
  return (
    <>
      {/* Soft drop shadow for depth. */}
      <Line
        points={outlinePts}
        closed
        fill="#000000"
        opacity={0.32}
        shadowColor="#000000"
        shadowBlur={40}
        shadowOpacity={0.55}
        listening={false}
      />
      {/* Dark inked outline. */}
      <Line points={outlinePts} closed fill="#141414" listening={false} />
      {/* Cream rim peeking between the ink and the red body. */}
      <Line points={rimPts} closed fill="#fdf3da" listening={false} />
      {/* Red body. */}
      <Line points={bodyPts} closed fill="#e11d2a" listening={false} />

      {/* Halftone shading on the red ring, lighter top-left -> darker bottom-right. */}
      <Group clipFunc={(ctx) => traceFlat(ctx, bodyPts)} listening={false}>
        {halftone()}
      </Group>

      {/* Golden disc base for the VS, with a hand-inked uneven rim. */}
      <Line
        points={roughStarburstPoints(CX, CY, DISC_R + 6, DISC_R, 40, SEED + 9, 0.03, 0.6)}
        closed
        fill="#141414"
        listening={false}
      />
      <Circle
        x={CX}
        y={CY}
        radius={DISC_R - 4}
        fillRadialGradientStartPoint={{ x: -40, y: -40 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={DISC_R}
        fillRadialGradientColorStops={[0, '#fff6cc', 0.65, '#ffd400', 1, '#f0aa00']}
        listening={false}
      />

      {/* VS text — heavier Bowlby One face, perfectly centered on the seal. */}
      <Text
        text="VS"
        x={CX - 270}
        y={CY - 150}
        width={540}
        height={300}
        align="center"
        verticalAlign="middle"
        fontFamily={VS_FONT_FAMILY}
        fontSize={180}
        letterSpacing={9}
        fill="#ffffff"
        stroke="#141414"
        strokeWidth={4}
        fillAfterStrokeEnabled
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.4}
        listening={false}
      />
    </>
  )
}

/** A directional halftone dot field across the red ring's bounding box. */
function halftone() {
  const R = 300
  const top = CY - R
  const left = CX - R
  const span = R * 2
  const step = 26
  const dots = []
  for (let x = left; x <= CX + R; x += step) {
    for (let y = top; y <= CY + R; y += step) {
      // 0 at top-left -> 1 at bottom-right gives a lit/shaded gradient.
      const f = ((y - top) / span) * 0.65 + ((x - left) / span) * 0.35
      const r = 1.2 + 4.4 * f * f
      dots.push(
        <Circle
          key={`${x}-${y}`}
          x={x}
          y={y}
          radius={r}
          fill="#3d0509"
          opacity={0.4}
          listening={false}
        />,
      )
    }
  }
  return dots
}

function traceFlat(ctx: Konva.Context, flat: number[]) {
  ctx.beginPath()
  ctx.moveTo(flat[0], flat[1])
  for (let i = 2; i < flat.length; i += 2) ctx.lineTo(flat[i], flat[i + 1])
  ctx.closePath()
}
