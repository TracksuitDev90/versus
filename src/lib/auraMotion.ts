/**
 * One clock for every orb on the page, so the masthead mark and the stage
 * centerpiece breathe in sync. Runs a single throttled animation loop while
 * motion is on and anyone is listening; when motion is off, time freezes and
 * each orb holds its current frame (which is also what the PNG export saves).
 *
 * `kick()` is how the UI pokes the orbs: uploads, ink changes and the like
 * add ripple energy that swells the surface and then settles.
 */

export interface AuraTick {
  time: number // seconds of animation
  boost: number // 0–~1, smoothed ripple energy from kicks
  seed: number // changes every frame, for film grain
}

type Listener = (tick: AuraTick) => void

const FRAME_MS = 1000 / 30 // film-ish cadence; plenty for a soft, grainy glow

const listeners = new Set<Listener>()
let motion = true
let raf = 0
let lastNow = 0
let time = 7.3 // start mid-drift so the first frame isn't a perfect sphere
let energy = 0
let boost = 0
let seed = 0

export function currentTick(): AuraTick {
  return { time, boost, seed }
}

/** Listen for frames. Fires once immediately so new subscribers paint. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  fn(currentTick())
  ensureLoop()
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0) stopLoop()
  }
}

export function setMotion(on: boolean) {
  if (motion === on) return
  motion = on
  if (on) ensureLoop()
  else stopLoop()
}

/** Add ripple energy (0–1-ish). Ignored while frozen, so stills stay still. */
export function kick(strength = 1) {
  if (!motion) return
  energy = Math.min(1.25, energy + strength * 0.7)
}

/**
 * Surface displacement for a given ripple setting at a given moment: a calm
 * base, a slow breath every ~9 s where the surface swells into ridges and
 * settles back (the rhythm of the reference loop, slowed for a UI), plus
 * whatever energy recent kicks added.
 */
export function surfaceAmp(ripple: number, tick: AuraTick): number {
  const phase = (tick.time % 9) / 9
  const s = Math.sin(Math.PI * Math.min(1, Math.max(0, (phase - 0.5) / 0.42)))
  const breath = s * s * (0.035 + ripple * 0.045)
  return 0.006 + ripple * 0.09 + breath + tick.boost * 0.08
}

function ensureLoop() {
  if (raf || !motion || listeners.size === 0) return
  lastNow = 0
  raf = requestAnimationFrame(loop)
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function loop(now: number) {
  raf = requestAnimationFrame(loop)
  if (lastNow && now - lastNow < FRAME_MS - 2) return
  // Clamp the step so a backgrounded tab doesn't lurch forward on return.
  const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0
  lastNow = now

  time += dt
  energy *= Math.exp(-dt / 1.1)
  boost += (energy - boost) * (1 - Math.exp(-dt / 0.28))
  seed = (seed + 1) % 1000

  const tick = currentTick()
  listeners.forEach((fn) => fn(tick))
}
