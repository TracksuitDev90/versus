import type Konva from 'konva'
import { useRef } from 'react'
import ControlPanel from './components/controls/ControlPanel'
import EditorStage from './components/EditorStage'

export default function App() {
  const stageRef = useRef<Konva.Stage>(null)

  return (
    <div className="app">
      <header className="masthead">
        <h1 className="masthead__title">VS.Maker</h1>
        <div className="masthead__meta">
          <span>An editorial versus builder</span>
          <span className="masthead__meta-mid">Two photos · one winner</span>
          <span>№ 001 — Free edition</span>
        </div>
      </header>

      <main className="layout">
        <div className="stage-wrap">
          <EditorStage ref={stageRef} />
        </div>
        <ControlPanel stageRef={stageRef} />
      </main>

      <footer className="colophon">
        <span>Set in Archivo Black &amp; Space Mono</span>
        <span>Printed in the browser</span>
      </footer>
    </div>
  )
}
