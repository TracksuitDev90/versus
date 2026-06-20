import Konva from 'konva'
import { useEffect, useMemo, useRef } from 'react'
import { Circle, Group, Line, Text } from 'react-konva'
import { BASE_HEIGHT, VS_FONT_FAMILY } from '../../constants'
import { galaxyPalette, gooGlobes, sparkles, swirlArms, withAlpha } from '../../lib/galaxy'
import { CX } from '../../lib/geometry'
import { useEditorStore } from '../../store/useEditorStore'

const CY = BASE_HEIGHT / 2
const DISC_R = 300

// Spiral geometry is fixed (only the colors track the sides), so arms/sparkles
// are generated once and the swirl stays put across re-renders and PNG export.
const START_R = 16
const END_R = 285
const TURNS = 1.15
const ARMS = 5
const armLines = swirlArms(CX, CY, ARMS, START_R, END_R, TURNS).map((arm) =>
  arm.flatMap((p) => [p.x, p.y]),
)
const sparks = sparkles(424242, CX, CY, DISC_R, 7)

/**
 * The centerpiece: a fluid, multicolored galaxy swirl whose colors are pulled
 * from the two sides' frame colors, with the bold "VS" riding on top. The arms
 * and goo globes are drawn additively then blurred into a watery, gooey melt.
 */
export default function VsBadge() {
  const left = useEditorStore((s) => s.frames.left)
  const right = useEditorStore((s) => s.frames.right)

  const palette = useMemo(() => galaxyPalette(left, right), [left, right])
  const globes = useMemo(
    () => gooGlobes(98765, CX, CY, palette, 16, START_R, END_R, TURNS),
    [palette],
  )

  // Blur the arms+globes group into goo. Re-cache when the colors change, mirroring
  // FrameLayer's noise-cache pattern; pixelRatio keeps the export sharp.
  const gooRef = useRef<Konva.Group>(null)
  const paletteKey = `${palette.arm}|${palette.armSoft}|${palette.blobs.join(',')}`
  useEffect(() => {
    const node = gooRef.current
    if (!node) return
    node.cache({ pixelRatio: 2 })
    node.getLayer()?.batchDraw()
  }, [paletteKey])

  return (
    <>
      {/* Deep-space disc the swirl sits on; fades out so it melts into the art. */}
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

      {/* The gooey galaxy: arms + globes, blended additively then blurred to melt. */}
      <Group ref={gooRef} filters={[Konva.Filters.Blur]} blurRadius={10} listening={false}>
        {armLines.map((points, i) => (
          <Group key={i}>
            {/* Wide soft band for the watery glow... */}
            <Line
              points={points}
              stroke={palette.armSoft}
              strokeWidth={40}
              opacity={0.5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="lighter"
              listening={false}
            />
            {/* ...and a brighter core stroke down its middle. */}
            <Line
              points={points}
              stroke={palette.arm}
              strokeWidth={16}
              opacity={0.85}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="lighter"
              listening={false}
            />
          </Group>
        ))}
        {globes.map((g, i) => (
          <Circle
            key={i}
            x={g.x}
            y={g.y}
            radius={g.r}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndRadius={g.r}
            fillRadialGradientColorStops={[0, g.colorA, 0.6, withAlpha(g.colorA, 0.55), 1, g.colorB]}
            globalCompositeOperation="lighter"
            listening={false}
          />
        ))}
      </Group>

      {/* Bright glowing heart of the spiral, sitting crisp over the blurred goo. */}
      <Circle
        x={CX}
        y={CY}
        radius={120}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={120}
        fillRadialGradientColorStops={[
          0,
          palette.core,
          0.4,
          withAlpha(palette.arm, 0.7),
          1,
          withAlpha(palette.arm, 0),
        ]}
        globalCompositeOperation="lighter"
        listening={false}
      />

      {/* Sparkle stars on top. */}
      {sparks.map((s, i) => (
        <Line
          key={i}
          points={s.points}
          closed
          fill="#ffffff"
          shadowColor="#ffffff"
          shadowBlur={14}
          shadowOpacity={0.9}
          tension={0}
          listening={false}
        />
      ))}

      {/* VS text — heavier Bowlby One face, perfectly centered on the swirl. */}
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
