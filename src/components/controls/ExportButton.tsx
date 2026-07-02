import type Konva from 'konva'
import { useState, type RefObject } from 'react'
import { EXPORT_PRESETS } from '../../constants'
import { exportPng } from '../../lib/export'
import { useEditorStore } from '../../store/useEditorStore'

/** Two nested rAFs: one for React to commit, one for Konva effects to redraw. */
const nextPaint = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

export default function ExportButton({ stageRef }: { stageRef: RefObject<Konva.Stage> }) {
  const [width, setWidth] = useState<number>(EXPORT_PRESETS[1].width)
  const [busy, setBusy] = useState(false)
  const setExporting = useEditorStore((s) => s.setExporting)

  const handleExport = async () => {
    if (!stageRef.current) return
    setBusy(true)
    // Flip the backdrop into export mode (uncached vectors, frozen animation)
    // and let that render before rasterizing.
    setExporting(true)
    try {
      await nextPaint()
      await exportPng(stageRef.current, width)
    } finally {
      setExporting(false)
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
