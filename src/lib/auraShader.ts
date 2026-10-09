// GLSL for the aura orb: a dark sphere rim-lit by a ring of colored light,
// whose surface periodically swells into liquid ridges and settles back.
//
// Nothing is raymarched. The silhouette is the unit circle pushed in/out by a
// noise field sampled on the sphere's equator, the interior is a hemisphere
// whose normals are bump-mapped by the same field, and the light is an
// environment lookup keyed on where each normal points in screen space (left
// ink on the left, right ink on the right, the blend over the crest). Ridges
// that tilt toward the rim catch the light, which is what reads as "liquid".

export const STOP_COUNT = 8

export const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;       // drawing buffer size in px
uniform float u_extent;   // half-width of the canvas in orb radii
uniform float u_time;     // seconds
uniform float u_amp;      // surface displacement (orb radii)
uniform float u_tremble;  // always-on fine ripple (orb radii)
uniform float u_glow;     // 0-1 halo reach
uniform float u_grain;    // 0-1 film grain on the light
uniform float u_seed;     // per-frame grain seed
uniform vec3 u_body;      // the orb's unlit color (the stock it sits on)
uniform vec3 u_fill;      // dim light spilling over the front face
uniform vec3 u_stops[${STOP_COUNT}];

const float PI = 3.14159265;
// Where the light ring ends on each side, measured from the top.
const float LEFT_END = 0.74 * PI;
const float RIGHT_END = 0.82 * PI;

// --- 3D simplex noise -------------------------------------------------------
// Ashima Arts / Stefan Gustavson, webgl-noise (MIT License).
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// --- Surface ----------------------------------------------------------------
// Radial displacement of the sphere at unit direction p: broad slow swells plus
// rounder mid-size lumps — smooth noise only, so the surface reads as liquid
// rather than crumpled — and a faint always-on tremble so the orb never sits
// perfectly still.
float height(vec3 p) {
  float t = u_time;
  float swell = snoise(p * 1.25 + vec3(0.0, t * 0.21, t * 0.13));
  float lumps = snoise(p * 2.0 + vec3(t * 0.27, -t * 0.19, 4.7));
  float tremble = snoise(p * 3.4 + vec3(t * 0.9, t * 1.3, -t * 1.1));
  return u_amp * (swell * 0.6 + lumps * 0.5) + u_tremble * tremble;
}

// --- Light ------------------------------------------------------------------
// Piecewise-linear lookup along the ring, th = angle from the top (left < 0).
vec3 spectrum(float th) {
  float t = clamp((th + LEFT_END) / (LEFT_END + RIGHT_END), 0.0, 1.0) * float(${STOP_COUNT - 1});
  vec3 c = u_stops[0];
  for (int i = 0; i < ${STOP_COUNT - 1}; i++) {
    c = mix(c, u_stops[i + 1], clamp(t - float(i), 0.0, 1.0));
  }
  return c;
}

// The lights sit behind-left, behind-top and behind-right, so the underside of
// the orb stays dark. The right end reaches a little lower than the left.
float coverage(float th) {
  return smoothstep(-0.9 * PI, -0.5 * PI, th) * smoothstep(0.97 * PI, 0.66 * PI, th);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Lift emitted light toward white without clipping, keeping the base exact.
vec3 expose(vec3 base, vec3 light) {
  return base + (1.0 - base) * (1.0 - exp(-light * 1.25));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res * 2.0 - 1.0;
  vec2 q = uv * u_extent; // orb radius = 1, y up
  float rho = length(q);
  vec2 dir = rho > 1e-4 ? q / rho : vec2(0.0, 1.0);

  float grain = (hash(gl_FragCoord.xy + u_seed * vec2(37.1, 17.7)) - 0.5) * u_grain;

  // Silhouette: the equator pushed in/out along this screen direction.
  float rim = 1.0 + height(vec3(dir, 0.0));
  float d = rho - rim;

  vec3 premul;
  float alpha;

  if (d < 0.0) {
    // Inside: a hemisphere, bump-mapped by the same field.
    vec2 qs = q / rim;
    vec3 P = vec3(qs, sqrt(max(0.0, 1.0 - dot(qs, qs))));
    const float e = 0.03;
    float h0 = height(P);
    vec3 g = vec3(
      height(P + vec3(e, 0.0, 0.0)) - h0,
      height(P + vec3(0.0, e, 0.0)) - h0,
      height(P + vec3(0.0, 0.0, e)) - h0) / e;
    g -= dot(g, P) * P;
    vec3 N = normalize(P - g * 0.8);

    float ndv = clamp(N.z, 0.0, 1.0);
    float th = atan(N.x, N.y);
    float fres = 1.0 - ndv;
    // A broad soft rim band, with a hotter core toward the edge.
    vec3 light = spectrum(th) * coverage(th) * (pow(fres, 1.5) * 1.2 + pow(fres, 5.0) * 0.55);
    // The crest's light spilling over the front face: the dim inner glow.
    float fill = pow(max(dot(N, normalize(vec3(-0.1, 0.92, 0.38))), 0.0), 6.0);
    light += u_fill * fill * 0.3;
    light *= 1.0 + grain * 1.2;

    premul = clamp(expose(u_body, light) + grain * 0.015, 0.0, 1.0);
    alpha = 1.0;
  } else {
    // Outside: a defocused body edge plus a light halo spilling off the rim.
    float th = atan(dir.x, dir.y);
    vec3 ring = spectrum(th) * coverage(th);
    float soft = 0.03 + 0.06 * u_glow;
    float halo = exp(-d / soft) * 2.4 + exp(-d / (0.1 + 0.25 * u_glow)) * (0.06 + 0.22 * u_glow);
    // Fade to nothing well before the canvas edge so no square ever shows.
    halo *= smoothstep(u_extent, u_extent * 0.75, rho);
    vec3 light = ring * halo * (1.0 + grain * 1.0);
    vec3 glow = 1.0 - exp(-light * 1.25);

    float body = exp(-d / 0.012);
    alpha = clamp(max(body, max(glow.r, max(glow.g, glow.b))), 0.0, 1.0);
    premul = min(u_body * body + glow, vec3(alpha));
  }

  gl_FragColor = vec4(premul, alpha);
}
`
