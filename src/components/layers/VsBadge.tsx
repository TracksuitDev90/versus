import Konva from 'konva'
import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Line, Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { galaxyPalette, radialBolts, withAlpha } from '../../lib/galaxy'
import { CX } from '../../lib/geometry'
import { useEditorStore } from '../../store/useEditorStore'

const CY = BASE_HEIGHT / 2
const DISC_R = 300

// Bolt geometry is fixed (only the colors track the sides), so the burst is
// generated once and stays put across re-renders and PNG export.
const BOLT_COUNT = 20
const BOLT_INNER_R = 30 // start just outside the VS glyph core
const BOLT_OUTER_R = DISC_R
const BOLT_SEGMENTS = 7
const BOLT_JITTER = 26
const bolts = radialBolts(
  20240608,
  CX,
  CY,
  BOLT_COUNT,
  BOLT_INNER_R,
  BOLT_OUTER_R,
  BOLT_SEGMENTS,
  BOLT_JITTER,
)

/**
 * The centerpiece: a radial burst of stylized lightning bolts converging on the
 * center, with the bold "VS" riding on top. Each bolt's stroke fades to
 * transparent early so the burst is brightest at the heart and falls off rapidly
 * outward. Colors are pulled from the two sides' frame colors.
 */
export default function VsBadge() {
  const left = useEditorStore((s) => s.frames.left)
  const right = useEditorStore((s) => s.frames.right)

  const palette = useMemo(() => galaxyPalette(left, right), [left, right])

  // Blur the soft glow pass into a halo. Re-cache when the colors change, mirroring
  // FrameLayer's noise-cache pattern; pixelRatio keeps the export sharp.
  const glowRef = useRef<Konva.Group>(null)
  const paletteKey = `${palette.arm}|${palette.armSoft}|${palette.core}`
  useEffect(() => {
    const node = glowRef.current
    if (!node) return
    node.cache({ pixelRatio: 2 })
    node.getLayer()?.batchDraw()
  }, [paletteKey])

  // Stroke gradients run from the center out to each bolt's tip, fading to
  // transparent well before the tip so the burst falls off rapidly outward.
  const glowStops = [
    0,
    withAlpha(palette.armSoft, 0.85),
    0.35,
    withAlpha(palette.armSoft, 0.3),
    0.6,
    withAlpha(palette.armSoft, 0),
  ]
  // Solid (non-additive) bright core so the bolts read on either colored half:
  // a white heart melting into the side color, then dissolving away.
  const coreStops = [
    0,
    '#ffffff',
    0.28,
    withAlpha(palette.armSoft, 0.95),
    0.55,
    withAlpha(palette.armSoft, 0),
  ]

  return (
    <>
      {/* Deep-space disc the burst sits on; fades out so it melts into the art. */}
      <Circle
        x={CX}
        y={CY}
        radius={DISC_R}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={DISC_R}
        fillRadialGradientColorStops={[
          0,
          palette.backdropInner,
          0.6,
          withAlpha(palette.backdropInner, 0.7),
          1,
          withAlpha(palette.backdropInner, 0),
        ]}
        listening={false}
      />

      {/* Soft glow pass: wide strokes blended additively then blurred to a halo. */}
      <Group ref={glowRef} filters={[Konva.Filters.Blur]} blurRadius={10} listening={false}>
        {bolts.map((b, i) => (
          <Line
            key={i}
            points={b.points}
            stroke={palette.armSoft}
            strokeLinearGradientStartPoint={{ x: CX, y: CY }}
            strokeLinearGradientEndPoint={{ x: b.tip.x, y: b.tip.y }}
            strokeLinearGradientColorStops={glowStops}
            strokeWidth={24}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation="lighter"
            listening={false}
          />
        ))}
      </Group>

      {/* Crisp core pass: bold bright bolts on top, same rapid outward fade. */}
      {bolts.map((b, i) => (
        <Line
          key={i}
          points={b.points}
          stroke={palette.armSoft}
          strokeLinearGradientStartPoint={{ x: CX, y: CY }}
          strokeLinearGradientEndPoint={{ x: b.tip.x, y: b.tip.y }}
          strokeLinearGradientColorStops={coreStops}
          strokeWidth={12}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}

      {/* Bright glowing heart of the burst, sitting crisp over the blurred glow. */}
      <Circle
        x={CX}
        y={CY}
        radius={80}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={80}
        fillRadialGradientColorStops={[
          0,
          palette.core,
          0.45,
          withAlpha(palette.arm, 0.6),
          1,
          withAlpha(palette.arm, 0),
        ]}
        globalCompositeOperation="lighter"
        listening={false}
      />

      {/* VS text — heavier Bowlby One face, perfectly centered on the burst. */}
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
        strokeWidth={5}
        fillAfterStrokeEnabled
        shadowColor="#000000"
        shadowBlur={18}
        shadowOpacity={0.65}
        listening={false}
      />
    </>
  )
}
