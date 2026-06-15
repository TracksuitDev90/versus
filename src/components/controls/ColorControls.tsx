import type { SideId } from '../../constants'
import { useEditorStore } from '../../store/useEditorStore'
import ColorPopover from '../ui/ColorPopover'

/** Frame color controls for one side: solid or linear gradient. */
export default function ColorControls({ side }: { side: SideId }) {
  const frame = useEditorStore((s) => s.frames[side])
  const setFrame = useEditorStore((s) => s.setFrame)
  const setGradient = useEditorStore((s) => s.setGradient)

  return (
    <div className="control-group">
      <div className="seg">
        <button
          type="button"
          className={frame.mode === 'solid' ? 'seg-btn active' : 'seg-btn'}
          onClick={() => setFrame(side, { mode: 'solid' })}
        >
          Solid
        </button>
        <button
          type="button"
          className={frame.mode === 'gradient' ? 'seg-btn active' : 'seg-btn'}
          onClick={() => setFrame(side, { mode: 'gradient' })}
        >
          Gradient
        </button>
      </div>

      {frame.mode === 'solid' ? (
        <div className="row">
          <span>Color</span>
          <ColorPopover
            color={frame.solid}
            onChange={(c) => setFrame(side, { solid: c })}
            label="Frame color"
          />
        </div>
      ) : (
        <>
          <div className="row">
            <span>From</span>
            <ColorPopover
              color={frame.gradient.from}
              onChange={(c) => setGradient(side, { from: c })}
              label="Gradient start"
            />
            <span>To</span>
            <ColorPopover
              color={frame.gradient.to}
              onChange={(c) => setGradient(side, { to: c })}
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
              onChange={(e) => setGradient(side, { angle: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  )
}
