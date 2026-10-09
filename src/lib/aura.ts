import { FRAGMENT_SHADER, STOP_COUNT, VERTEX_SHADER } from './auraShader'
import { hexToHsl, hexToRgb, hslToHex } from './palette'

/** How far an aura canvas reaches past the orb, in orb radii: room for the
 *  swollen silhouette plus the halo to fade out before the canvas edge. */
export const AURA_EXTENT = 1.9

export interface AuraFrame {
  stops: Float32Array // STOP_COUNT rgb triples, 0–1
  fill: readonly [number, number, number]
  body: readonly [number, number, number]
  time: number
  amp: number
  tremble: number
  glow: number
  grain: number
  seed: number
}

/** A hex color as 0–1 floats, for shader uniforms. */
export function rgbFloats(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex)
  return [r / 255, g / 255, b / 255]
}

// The key light over the crest: the warm yellow at the top of the ring.
const KEY = [0.93, 0.87, 0.16] as const
const WHITE = [1, 1, 1] as const

type Rgb = readonly [number, number, number]

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** Treat an ink as a light source: same hue, pushed to full brightness, so a
 *  dark printing ink still glows. Black stays black (that side goes unlit). */
function asLight(hex: string): Rgb {
  const c = rgbFloats(hex)
  const k = Math.min(4, 0.92 / Math.max(0.02, ...c))
  return [c[0] * k, c[1] * k, c[2] * k]
}

/**
 * The aura's light ring, left to right around the top of the orb. Three lights,
 * like the reference: the left ink from behind-left, a warm yellow key from
 * above, the right ink from behind-right. The left ink washes out to a pale
 * near-white as it meets the key (the lavender in the reference); the key
 * warms down through orange into the right ink.
 */
export function auraStops(left: string, right: string): Float32Array {
  const l = asLight(left)
  const r = asLight(right)
  const stops: Rgb[] = [
    l,
    l,
    mix(l, WHITE, 0.45),
    mix(KEY, l, 0.18),
    KEY,
    mix(KEY, r, 0.4),
    mix(KEY, r, 0.75),
    r,
  ]
  const out = new Float32Array(STOP_COUNT * 3)
  stops.forEach((c, i) => out.set(c, i * 3))
  return out
}

/**
 * The dim light that spills over the orb's front face below the crest. Taken
 * from halfway round the hue wheel the *long* way between the two inks, so
 * cobalt vs vermillion gives the reference's deep green.
 */
export function auraFill(left: string, right: string): [number, number, number] {
  const a = hexToHsl(left)
  const b = hexToHsl(right)
  const cw = (((b.h - a.h) % 360) + 360) % 360
  const span = cw <= 180 ? cw - 360 : cw
  return rgbFloats(hslToHex(a.h + span / 2, 0.55, 0.42))
}

/** CSS color stops for the same ring, so the page chrome can wear it too. */
export function stopsToCss(stops: Float32Array): string[] {
  const css: string[] = []
  for (let i = 0; i < stops.length; i += 3) {
    const [r, g, b] = [stops[i], stops[i + 1], stops[i + 2]].map((v) => Math.round(v * 255))
    css.push(`rgb(${r} ${g} ${b})`)
  }
  return css
}

/**
 * Owns one WebGL canvas and draws the orb into it. The canvas is used directly
 * (in the DOM for the masthead mark) or as a Konva image source (on the stage).
 * `preserveDrawingBuffer` keeps the last frame readable by `drawImage`, which
 * Konva calls on its own schedule, and by the PNG export.
 */
export class AuraRenderer {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null = null
  private loc: Record<string, WebGLUniformLocation | null> = {}
  private last: AuraFrame | null = null
  private lost = false

  static create(canvas: HTMLCanvasElement = document.createElement('canvas')): AuraRenderer | null {
    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      antialias: false,
      depth: false,
      stencil: false,
    })
    if (!gl) return null
    try {
      return new AuraRenderer(canvas, gl)
    } catch {
      return null
    }
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    this.canvas = canvas
    this.gl = gl
    this.init()
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.lost = true
    })
    canvas.addEventListener('webglcontextrestored', () => {
      this.lost = false
      this.init()
      this.redraw()
    })
  }

  private init() {
    const gl = this.gl
    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, src)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? 'aura shader failed to compile')
      }
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'aura shader failed to link')
    }
    gl.useProgram(program)
    this.program = program

    // One triangle that covers the whole viewport.
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    for (const name of [
      'u_res', 'u_extent', 'u_time', 'u_amp', 'u_tremble',
      'u_glow', 'u_grain', 'u_seed', 'u_body', 'u_fill', 'u_stops',
    ]) {
      this.loc[name] = gl.getUniformLocation(program, name)
    }
  }

  /** Resize the drawing buffer (device pixels), clamped to what the GPU allows. */
  setSize(width: number, height: number) {
    const max = (this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS) as Int32Array | null)?.[0] ?? 4096
    const w = Math.max(1, Math.min(max, Math.round(width)))
    const h = Math.max(1, Math.min(max, Math.round(height)))
    if (this.canvas.width !== w) this.canvas.width = w
    if (this.canvas.height !== h) this.canvas.height = h
  }

  render(frame: AuraFrame) {
    this.last = frame
    if (this.lost || !this.program) return
    const gl = this.gl
    const { loc } = this
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform2f(loc.u_res, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(loc.u_extent, AURA_EXTENT)
    gl.uniform1f(loc.u_time, frame.time)
    gl.uniform1f(loc.u_amp, frame.amp)
    gl.uniform1f(loc.u_tremble, frame.tremble)
    gl.uniform1f(loc.u_glow, frame.glow)
    gl.uniform1f(loc.u_grain, frame.grain)
    gl.uniform1f(loc.u_seed, frame.seed)
    gl.uniform3f(loc.u_body, frame.body[0], frame.body[1], frame.body[2])
    gl.uniform3f(loc.u_fill, frame.fill[0], frame.fill[1], frame.fill[2])
    gl.uniform3fv(loc.u_stops, frame.stops)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** Draw the last frame again — after a resize, for instance. */
  redraw() {
    if (this.last) this.render(this.last)
  }
}

// The stage's orb lives in one long-lived renderer so the PNG export can
// re-render it at print resolution (see `renderStageAuraAt`).
let stageAura: AuraRenderer | null | undefined

export function getStageAura(): AuraRenderer | null {
  if (stageAura === undefined) stageAura = AuraRenderer.create()
  return stageAura
}

/**
 * Re-render the stage orb at `sizePx` square (the export's pixel footprint)
 * from the frame currently on screen. Returns a function that puts the
 * on-screen resolution back.
 */
export function renderStageAuraAt(sizePx: number): () => void {
  const r = stageAura
  if (!r) return () => {}
  const prev = { w: r.canvas.width, h: r.canvas.height }
  r.setSize(sizePx, sizePx)
  r.redraw()
  return () => {
    r.setSize(prev.w, prev.h)
    r.redraw()
  }
}
