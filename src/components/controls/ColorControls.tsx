import type { SideId } from '../../constants'
import { kick } from '../../lib/auraMotion'
import type { FrameColor, GradientFill } from '../../store/useEditorStore'
import { useEditorStore } from '../../store/useEditorStore'
import ColorPopover from '../ui/ColorPopover'

/** Frame color controls for one side: solid or linear gradient. Every change
 *  nudges the orb, so dragging through colors makes it shimmer. */
export default function ColorControls({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const storeSetFrame = useEditorStore((s) => s.setFrame)
  const storeSetGradient = useEditorStore((s) => s.setGradient)

  const setFrame = (patch: Partial<FrameColor>) => {
    storeSetFrame(side, patch)
    kick(0.2)
  }
  const setGradient = (patch: Partial<GradientFill>) => {
    storeSetGradient(side, patch)
    kick(0.2)
  }

  return (
    <div className="control-group">
      <div className="seg">
        <button
          type="button"
          className={frame.mode === 'solid' ? 'seg-btn active' : 'seg-btn'}
          onClick={() => setFrame({ mode: 'solid' })}
        >
          Solid
        </button>
        <button
          type="button"
          className={frame.mode === 'gradient' ? 'seg-btn active' : 'seg-btn'}
          onClick={() => setFrame({ mode: 'gradient' })}
        >
          Gradient
        </button>
      </div>

      {frame.mode === 'solid' ? (
        <div className="row">
          <span>Color</span>
          <ColorPopover
            color={frame.solid}
            onChange={(c) => setFrame({ solid: c })}
            label="Frame color"
          />
        </div>
      ) : (
        <>
          <div className="row">
            <span>From</span>
            <ColorPopover
              color={frame.gradient.from}
              onChange={(c) => setGradient({ from: c })}
              label="Gradient start"
            />
            <span>To</span>
            <ColorPopover
              color={frame.gradient.to}
              onChange={(c) => setGradient({ to: c })}
              label="Gradient end"
            />
          </div>
          <label className="slider-row">
            <span>Angle</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={frame.gradient.angle}
              onChange={(e) => setGradient({ angle: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  )
}
