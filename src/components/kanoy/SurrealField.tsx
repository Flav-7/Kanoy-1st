import { useEffect, useRef } from "react";

/**
 * Ambient WebGL aurora field, fixed behind the whole page and blended with
 * `screen` so it reads as a living cyan/mint glow through every section
 * without ever fighting the content on top of it.
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform vec2 u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.55;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += amp * noise(p);
    p = m * p;
    amp *= 0.55;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;

  vec2 mouseOff = (u_mouse - 0.5) * 0.5;
  float t = u_time * 0.045;

  vec2 warp = p * 1.25 + mouseOff;
  warp += vec2(fbm(warp + t), fbm(warp - t * 1.2)) * 0.85;
  float n = fbm(warp * 1.4 + vec2(0.0, t * 1.6) + u_scroll * 1.6);

  float glow = smoothstep(0.18, 0.95, n);
  vec3 cyan = vec3(0.14, 0.80, 0.86);
  vec3 mint = vec3(0.30, 0.92, 0.62);
  vec3 col = mix(cyan, mint, smoothstep(0.2, 0.85, fbm(warp * 0.7 - t)));

  float vign = smoothstep(1.35, 0.05, length(p));
  vec3 outc = col * glow * vign;

  gl_FragColor = vec4(outc, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

export function SurrealField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX / window.innerWidth, y: 1 - e.clientY / window.innerHeight };
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    const start = performance.now();
    const draw = () => {
      const time = (performance.now() - start) / 1000;
      const doc = document.documentElement;
      const scrollFrac =
        doc.scrollHeight > window.innerHeight
          ? window.scrollY / (doc.scrollHeight - window.innerHeight)
          : 0;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uScroll, scrollFrac);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ mixBlendMode: "screen", opacity: 0.2 }}
    />
  );
}
