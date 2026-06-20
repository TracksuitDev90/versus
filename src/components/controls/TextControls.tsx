import type { SideId } from '../../constants'
import { FONT_OPTIONS } from '../../constants'
import { useEditorStore } from '../../store/useEditorStore'
import ColorPopover from '../ui/ColorPopover'

/** Label text controls for one side: content, font, size, color. */
export default function TextControls({ side }: { side: SideId }) {
  const label = useEditorStore((s) => s.labels[side])
  const setLabel = useEditorStore((s) => s.setLabel)

  return (
    <div className="control-group">
      <input
        type="text"
        className="text-input"
        value={label.text}
        placeholder="Label text"
        onChange={(e) => setLabel(side, { text: e.target.value })}
      />
      <div className="row">
        <select
          className="select"
          value={label.fontFamily}
          onChange={(e) => setLabel(side, { fontFamily: e.target.value })}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <ColorPopover
          color={label.fill}
          onChange={(c) => setLabel(side, { fill: c })}
          label="Text color"
        />
      </div>
      <label className="slider-row">
        <span>Size</span>
        <input
          type="range"
          min={42}
          max={165}
          step={1}
          value={label.fontSize}
          onChange={(e) => setLabel(side, { fontSize: Number(e.target.value) })}
        />
      </label>
    </div>
  )
}
