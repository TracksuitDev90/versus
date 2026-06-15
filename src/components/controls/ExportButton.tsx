import type Konva from 'konva'
import { useState, type RefObject } from 'react'
import { EXPORT_PRESETS } from '../../constants'
import { exportPng } from '../../lib/export'

export default function ExportButton({ stageRef }: { stageRef: RefObject<Konva.Stage> }) {
  const [width, setWidth] = useState<number>(EXPORT_PRESETS[1].width)
  const [busy, setBusy] = useState(false)

  const handleExport = async () => {
    if (!stageRef.current) return
    setBusy(true)
    try {
      await exportPng(stageRef.current, width)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-bar">
      <select
        className="select"
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
      >
        {EXPORT_PRESETS.map((p) => (
          <option key={p.width} value={p.width}>
            {p.label}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-primary" onClick={handleExport} disabled={busy}>
        {busy ? 'Saving…' : 'Save image'}
      </button>
    </div>
  )
}
