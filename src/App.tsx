import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import AuraMark from './components/AuraMark'
import ControlPanel from './components/controls/ControlPanel'
import EditorStage from './components/EditorStage'
import { auraStops, stopsToCss } from './lib/aura'
import { setMotion } from './lib/auraMotion'
import { inkOf, useEditorStore } from './store/useEditorStore'

/** Keep the shared animation clock and the page chrome in step with the
 *  editor: motion on/off, and the aura's light ring exposed as CSS custom
 *  properties (--spec-0 … --spec-7) so accents wear the current matchup. */
function useAuraChrome() {
  const motion = useEditorStore((s) => s.aura.motion)
  const left = useEditorStore((s) => inkOf(s.frames.left))
  const right = useEditorStore((s) => inkOf(s.frames.right))

  useEffect(() => setMotion(motion), [motion])

  useEffect(() => {
    const root = document.documentElement.style
    stopsToCss(auraStops(left, right)).forEach((c, i) => root.setProperty(`--spec-${i}`, c))
  }, [left, right])
}

export default function App() {
  const stageRef = useRef<Konva.Stage>(null)
  useAuraChrome()

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__row">
          <h1 className="masthead__title">VS.Maker</h1>
          <AuraMark />
        </div>
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
        <span>Lit in the browser</span>
      </footer>
    </div>
  )
}
