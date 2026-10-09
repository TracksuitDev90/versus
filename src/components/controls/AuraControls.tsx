import { useEditorStore } from '../../store/useEditorStore'

/** The orb behind the VS: on/off, how much it ripples, how far it glows, and
 *  whether it moves on screen. Shared by both plates. */
export default function AuraControls() {
  const aura = useEditorStore((s) => s.aura)
  const setAura = useEditorStore((s) => s.setAura)

  return (
    <div className="control-group">
      <label className="toggle-row">
        <span>Lit orb behind the VS</span>
        <input
          type="checkbox"
          className="switch"
          checked={aura.enabled}
          onChange={(e) => setAura({ enabled: e.target.checked })}
        />
      </label>

      {aura.enabled && (
        <>
          <label className="slider-row">
            <span>Ripple</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={aura.ripple}
              onChange={(e) => setAura({ ripple: Number(e.target.value) })}
            />
          </label>
          <label className="slider-row">
            <span>Glow</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={aura.glow}
              onChange={(e) => setAura({ glow: Number(e.target.value) })}
            />
          </label>
          <label className="toggle-row">
            <span>Motion</span>
            <input
              type="checkbox"
              className="switch"
              checked={aura.motion}
              onChange={(e) => setAura({ motion: e.target.checked })}
            />
          </label>
          <p className="hint">
            The PNG saves the frame on screen. Turn motion off to hold one you like.
          </p>
        </>
      )}
    </div>
  )
}
