import { Line, Text } from 'react-konva'
import { BASE_HEIGHT, BASE_WIDTH, FONT_FAMILY } from '../../constants'
import { CX } from '../../lib/geometry'
import { starburstPoints } from '../../lib/starburst'
import { useEditorStore } from '../../store/useEditorStore'

const CY = BASE_HEIGHT / 2

// Shared silhouette params so every layer nests cleanly (irregular comic burst).
const SPIKES = 22
const ROTATION = -Math.PI / SPIKES
const JITTER = 0.34
const SEED = 7
const OUTER_R = 215
const INNER_R = 92

// One layer of the burst at a uniform scale of the base radii.
function burst(scale: number) {
  return starburstPoints(CX, CY, OUTER_R * scale, INNER_R * scale, SPIKES, ROTATION, JITTER, SEED)
}

/** The centerpiece: a layered comic-explosion starburst with a bold "VS" on top. */
export default function VsBadge() {
  const badgeColor = useEditorStore((s) => s.badgeColor)

  return (
    <>
      {/* Outer colored star with a crisp dark outline + soft drop shadow */}
      <Line
        points={burst(1)}
        closed
        fill={badgeColor}
        stroke="#17121a"
        strokeWidth={7}
        lineJoin="round"
        shadowColor="#000000"
        shadowBlur={18}
        shadowOpacity={0.35}
        shadowOffsetY={4}
        listening={false}
      />
      {/* White ring (the comic double-outline) */}
      <Line points={burst(0.8)} closed fill="#ffffff" listening={false} />
      {/* Inner colored burst the VS sits on */}
      <Line points={burst(0.62)} closed fill={badgeColor} listening={false} />

      {/* VS — perfectly centered in a box centered on the burst */}
      <Text
        text="VS"
        x={CX - BASE_WIDTH / 2}
        y={CY - 110}
        width={BASE_WIDTH}
        height={220}
        align="center"
        verticalAlign="middle"
        fontFamily={FONT_FAMILY}
        fontStyle="bold"
        fontSize={150}
        letterSpacing={6}
        fill="#ffffff"
        stroke="#17121a"
        strokeWidth={3}
        fillAfterStrokeEnabled
        shadowColor="#000000"
        shadowBlur={8}
        shadowOpacity={0.4}
        listening={false}
      />
    </>
  )
}
