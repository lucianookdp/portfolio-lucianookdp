import { Renderer, Program, Mesh, Triangle, Vec2, Vec3 } from 'ogl';

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uColorBg;
  uniform vec3 uColorMid;
  uniform vec3 uColorAccent;

  varying vec2 vUv;

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
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = uv;
    p.x *= aspect;

    vec2 mouseInfluence = (uMouse - 0.5) * 0.35;
    float t = uTime * 0.045;

    vec2 flow = p * 1.5 + vec2(t, -t * 0.6) + mouseInfluence;
    float n1 = fbm(flow);
    float n2 = fbm(flow * 1.7 + n1 * 0.5 + vec2(5.1, 1.3) - mouseInfluence * 0.5);

    float mixA = smoothstep(0.12, 0.82, n1);
    float mixB = smoothstep(0.28, 0.72, n2);

    vec3 color = mix(uColorBg, uColorMid, mixA);
    color = mix(color, uColorAccent, mixB * 0.72);

    vec2 center = vec2(aspect * 0.5, 0.62) + mouseInfluence * 0.6;
    float vignette = smoothstep(1.1, 0.15, distance(p, center));
    color = mix(uColorBg, color, 0.55 + vignette * 0.45);

    gl_FragColor = vec4(color, 1.0);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

function readColor(varName: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
  return hexToRgb(value || '#000000');
}

export function initHeroShader(container: HTMLElement, canvas: HTMLCanvasElement): (() => void) | void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;
  const maxDpr = isSmallScreen ? 1.5 : 2;

  let renderer: Renderer;
  try {
    renderer = new Renderer({
      canvas,
      alpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, maxDpr)
    });
  } catch {
    return;
  }

  const gl = renderer.gl;

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new Vec2(1, 1) },
      uMouse: { value: new Vec2(0.5, 0.5) },
      uColorBg: { value: new Vec3(...readColor('--color-bg')) },
      uColorMid: { value: new Vec3(...readColor('--color-border')) },
      uColorAccent: { value: new Vec3(...readColor('--color-accent-glow')) }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });

  const targetMouse = { x: 0.5, y: 0.5 };
  const currentMouse = { x: 0.5, y: 0.5 };

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    program.uniforms.uResolution.value.set(width, height);
  }

  function onPointerMove(event: PointerEvent) {
    const rect = container.getBoundingClientRect();
    targetMouse.x = (event.clientX - rect.left) / rect.width;
    targetMouse.y = 1 - (event.clientY - rect.top) / rect.height;
  }

  let rafId = 0;
  let running = false;

  function loop(time: number) {
    if (!running) return;
    currentMouse.x += (targetMouse.x - currentMouse.x) * 0.04;
    currentMouse.y += (targetMouse.y - currentMouse.y) * 0.04;
    program.uniforms.uTime.value = time * 0.001;
    program.uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);
    renderer.render({ scene: mesh });
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  resize();
  start();
  canvas.classList.add('is-ready');

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  container.addEventListener('pointermove', onPointerMove);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && document.visibilityState === 'visible') start();
      else stop();
    },
    { threshold: 0 }
  );
  intersectionObserver.observe(container);

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') stop();
    else if (container.getBoundingClientRect().top < window.innerHeight) start();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  function onThemeChange() {
    program.uniforms.uColorBg.value.set(...readColor('--color-bg'));
    program.uniforms.uColorMid.value.set(...readColor('--color-border'));
    program.uniforms.uColorAccent.value.set(...readColor('--color-accent-glow'));
  }
  window.addEventListener('theme-change', onThemeChange);

  // document/window listeners outlive this canvas across page transitions, so
  // the caller must dispose the old instance before creating a new one —
  // otherwise every navigation leaks a WebGL context plus a stale listener.
  return function dispose() {
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    container.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('theme-change', onThemeChange);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
