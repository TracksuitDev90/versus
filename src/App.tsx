import type Konva from 'konva'
import { useRef } from 'react'
import ControlPanel from './components/controls/ControlPanel'
import EditorStage from './components/EditorStage'

export default function App() {
  const stageRef = useRef<Konva.Stage>(null)

  return (
    <div className="app">
      <header className="app-header">
        <h1>VS Maker</h1>
        <p>Build a versus battle graphic — upload two photos, style it, and save.</p>
      </header>

      <main className="layout">
        <div className="stage-wrap">
          <EditorStage ref={stageRef} />
        </div>
        <ControlPanel stageRef={stageRef} />
      </main>
    </div>
  )
}
