import { useEffect, useRef, useState } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'

/** A swatch button that opens a touch-friendly color picker popover. */
export default function ColorPopover({
  color,
  onChange,
  label,
}: {
  color: string
  onChange: (c: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="color-popover" ref={ref}>
      <button
        type="button"
        className="swatch"
        style={{ background: color }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${label}: ${color}`}
        title={label}
      />
      {open && (
        <div className="color-popover__panel">
          <HexColorPicker color={color} onChange={onChange} />
          <HexColorInput color={color} onChange={onChange} prefixed className="hex-input" />
        </div>
      )}
    </div>
  )
}
