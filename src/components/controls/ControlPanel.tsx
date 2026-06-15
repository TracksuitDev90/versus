import type Konva from 'konva'
import { useState, type RefObject } from 'react'
import type { SideId } from '../../constants'
import ColorControls from './ColorControls'
import ExportButton from './ExportButton'
import PhotoControls from './PhotoControls'
import TextControls from './TextControls'

const SIDES: { id: SideId; name: string }[] = [
  { id: 'left', name: 'Left side' },
  { id: 'right', name: 'Right side' },
]

export default function ControlPanel({ stageRef }: { stageRef: RefObject<Konva.Stage> }) {
  const [active, setActive] = useState<SideId>('left')

  return (
    <aside className="panel">
      <div className="seg side-tabs">
        {SIDES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={active === s.id ? 'seg-btn active' : 'seg-btn'}
            onClick={() => setActive(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      <section>
        <h3>Photo</h3>
        <PhotoControls side={active} />
      </section>

      <section>
        <h3>Frame color</h3>
        <ColorControls side={active} />
      </section>

      <section>
        <h3>Label</h3>
        <TextControls side={active} />
      </section>

      <ExportButton stageRef={stageRef} />
    </aside>
  )
}
