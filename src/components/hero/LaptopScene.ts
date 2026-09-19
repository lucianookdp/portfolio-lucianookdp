import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Hero 3D scene: a laptop, built procedurally, with a live screen. The screen
 * is a 2D canvas updated at a capped frame rate and used as a screen texture — it
 * alternates between a simplified version of this very site (with a cursor
 * browsing it) and a code editor typing itself out. The lid opens on load and
 * closes as the page scrolls away. Nothing is fetched at runtime.
 */

const readVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function readColor(name: string, fallback = '#22b573'): THREE.Color {
  try {
    return new THREE.Color(readVar(name, fallback));
  } catch {
    return new THREE.Color(fallback);
  }
}

function roundedRect(width: number, height: number, radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* ------------------------------------------------------------------ */
/*  Screen painter                                                      */
/* ------------------------------------------------------------------ */
const SCREEN_W = 1024;
const SCREEN_H = 640;
const CODE_LINES: [string, string][][] = [
  [['kw', 'const '], ['id', 'app'], ['op', ' = '], ['fn', 'fastify'], ['op', '();']],
  [['id', 'app'], ['op', '.'], ['fn', 'get'], ['op', '('], ['str', "'/users/:id'"], ['op', ', '], ['kw', 'async '], ['op', '(req) => {']],
  [['op', '  '], ['kw', 'const '], ['id', 'user'], ['op', ' = '], ['kw', 'await '], ['id', 'db'], ['op', '.'], ['fn', 'findUser'], ['op', '(req.params.id);']],
  [['op', '  '], ['kw', 'return '], ['fn', 'toResponse'], ['op', '(user);']],
  [['op', '});']],
  [['op', '']],
  [['kw', 'await '], ['id', 'app'], ['op', '.'], ['fn', 'listen'], ['op', '({ port: '], ['num', '3000'], ['op', ' });']],
  [['cm', '// ✓ ready on localhost:3000']]
];

class ScreenPainter {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private accent = '#22b573';
  private glow = '#3ddc8f';
  private mint = '#a8f0c8';

  constructor(private readonly name: string) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCREEN_W;
    this.canvas.height = SCREEN_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.refreshColors();
  }

  refreshColors() {
    this.accent = readVar('--color-accent', '#22b573');
    this.glow = readVar('--color-accent-glow', '#3ddc8f');
    this.mint = readVar('--color-accent-2-glow', '#a8f0c8');
  }

  /** t is seconds since the scene started. */
  paint(t: number): void {
    const cycle = 11; // seconds: 5.5 site, 5.5 code
    const phase = t % cycle;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
    if (phase < 5.5) this.paintSite(phase, t);
    else this.paintCode(phase - 5.5, t);

    // Wipe transition at the boundaries.
    const edge = Math.min(phase, Math.abs(phase - 5.5), cycle - phase);
    if (edge < 0.35) {
      const p = 1 - edge / 0.35;
      ctx.fillStyle = `rgba(8, 9, 12, ${(p * 0.9).toFixed(3)})`;
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
  }

  private chrome(title: string) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = '#12151c';
    ctx.fillRect(0, 0, SCREEN_W, 46);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(26 + i * 20, 23, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    roundRectPath(ctx, 200, 11, 624, 24, 12);
    ctx.fillStyle = '#1b1f28';
    ctx.fill();
    ctx.fillStyle = '#8b919f';
    ctx.font = '13px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, 512, 28);
    ctx.textAlign = 'left';
  }

  private paintSite(phase: number, t: number) {
    const ctx = this.ctx;
    this.chrome('lucianookdp.dev');

    // Header
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '600 18px "Inter Variable", system-ui, sans-serif';
    ctx.fillText('lucian∞kdp', 48, 88);
    ctx.fillStyle = '#8b919f';
    ctx.font = '14px "Inter Variable", system-ui, sans-serif';
    ['About', 'Projects', 'Services', 'Contact'].forEach((label, i) => ctx.fillText(label, 560 + i * 92, 88));
    ctx.fillStyle = this.accent;
    ctx.beginPath();
    ctx.arc(960, 84, 9, 0, Math.PI * 2);
    ctx.fill();

    // Availability pill
    roundRectPath(ctx, 48, 140, 276, 30, 15);
    ctx.fillStyle = '#151a22';
    ctx.fill();
    ctx.fillStyle = this.mint;
    ctx.beginPath();
    ctx.arc(66, 155, 4 + Math.sin(t * 4) * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b919f';
    ctx.font = '12px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.fillText('Available for projects', 80, 159);

    // Name
    ctx.fillStyle = '#e8eaf0';
    ctx.font = '700 72px "Bricolage Grotesque Variable", "Inter Variable", sans-serif';
    const parts = this.name.split(' ');
    const first = parts.slice(0, -2).join(' ');
    const last = parts.slice(-2).join(' ');
    ctx.fillText(first, 46, 262);
    ctx.fillStyle = this.glow;
    ctx.fillText(last, 46, 338);

    ctx.fillStyle = '#8b919f';
    ctx.font = '16px "Inter Variable", system-ui, sans-serif';
    ctx.fillText('Full-stack software engineer', 48, 386, 520);

    // Buttons (the cursor hovers the first one)
    const hover = phase > 2.2 && phase < 4.6;
    roundRectPath(ctx, 48, 418, 170, 48, 24);
    ctx.fillStyle = hover ? this.accent : '#e8eaf0';
    ctx.fill();
    ctx.fillStyle = hover ? '#04130b' : '#0b0d12';
    ctx.font = '600 15px "Inter Variable", system-ui, sans-serif';
    ctx.fillText('View projects', 68, 447);
    roundRectPath(ctx, 232, 418, 150, 48, 24);
    ctx.strokeStyle = '#2b303c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#e8eaf0';
    ctx.fillText('Get in touch', 250, 447);

    // Three generic project cards on the right (placeholder bars, so this
    // never needs updating when the featured projects change).
    [0, 1, 2].forEach((i) => {
      const y = 140 + i * 118;
      const lift = Math.sin(t * 1.4 + i) * 3;
      roundRectPath(ctx, 596, y + lift, 380, 100, 16);
      ctx.fillStyle = '#12151c';
      ctx.fill();
      ctx.strokeStyle = '#1d2129';
      ctx.lineWidth = 1;
      ctx.stroke();
      roundRectPath(ctx, 616, y + 20 + lift, 60, 60, 12);
      ctx.fillStyle = i === 1 ? this.accent : '#1b2129';
      ctx.fill();
      ctx.fillStyle = '#e8eaf0';
      roundRectPath(ctx, 694, y + 30 + lift, 150 - i * 20, 12, 6);
      ctx.fill();
      ctx.fillStyle = '#5c6371';
      roundRectPath(ctx, 694, y + 56 + lift, 200 - i * 30, 8, 4);
      ctx.fill();
      roundRectPath(ctx, 694, y + 70 + lift, 140 + i * 20, 8, 4);
      ctx.fill();
    });

    // Cursor: glides from the cards to the primary button and clicks it.
    const p = easeInOut(Math.min(1, Math.max(0, (phase - 0.6) / 1.8)));
    const cx = 780 + (150 - 780) * p;
    const cy = 250 + (442 - 250) * p;
    if (hover && phase > 3.0 && phase < 3.25) {
      ctx.strokeStyle = this.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + (phase - 3.0) * 60, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0b0d12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx + 5, cy + 14);
    ctx.lineTo(cx + 13, cy + 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private paintCode(phase: number, t: number) {
    const ctx = this.ctx;
    this.chrome('api · server.ts');
    // Sidebar
    ctx.fillStyle = '#0e1117';
    ctx.fillRect(0, 46, 200, SCREEN_H - 46);
    ctx.fillStyle = '#5c6371';
    ctx.font = '13px "JetBrains Mono Variable", ui-monospace, monospace';
    ['src/', '  routes/', '  services/', '  server.ts', 'tests/', 'package.json'].forEach((f, i) => {
      ctx.fillStyle = i === 3 ? this.mint : '#5c6371';
      ctx.fillText(f, 22, 86 + i * 26);
    });

    const colors: Record<string, string> = { kw: this.glow, id: '#e8eaf0', op: '#8b919f', fn: '#7fd9a8', str: '#ffc266', num: '#ffc266', cm: '#5c6371' };
    ctx.font = '17px "JetBrains Mono Variable", ui-monospace, monospace';
    const charsTotal = CODE_LINES.reduce((n, line) => n + line.reduce((m, [, text]) => m + text.length, 0), 0);
    const typed = Math.min(charsTotal, Math.floor(((phase - 0.3) / 3.6) * charsTotal));
    let remaining = typed;
    let caretX = 232;
    let caretY = 96;
    CODE_LINES.forEach((line, row) => {
      let x = 232;
      const y = 96 + row * 30;
      ctx.fillStyle = '#3a4150';
      ctx.textAlign = 'right';
      ctx.fillText(String(row + 1), 218, y);
      ctx.textAlign = 'left';
      line.forEach(([kind, text]) => {
        if (remaining <= 0) return;
        const slice = text.slice(0, remaining);
        remaining -= slice.length;
        ctx.fillStyle = colors[kind] ?? '#e8eaf0';
        ctx.fillText(slice, x, y);
        x += ctx.measureText(slice).width;
        caretX = x;
        caretY = y;
      });
    });
    if (Math.floor(t * 2.4) % 2 === 0) {
      ctx.fillStyle = this.glow;
      ctx.fillRect(caretX + 2, caretY - 16, 2, 20);
    }
    // Status bar
    ctx.fillStyle = '#12151c';
    ctx.fillRect(0, SCREEN_H - 30, SCREEN_W, 30);
    ctx.fillStyle = this.accent;
    ctx.fillRect(0, SCREEN_H - 30, 120, 30);
    ctx.fillStyle = '#04130b';
    ctx.font = '600 12px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.fillText('⎇ main', 16, SCREEN_H - 11);
    ctx.fillStyle = '#8b919f';
    ctx.font = '12px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.fillText('TypeScript · UTF-8 · Ln 7', 140, SCREEN_H - 11);
  }
}

/* ------------------------------------------------------------------ */
/*  Scene                                                               */
/* ------------------------------------------------------------------ */
export interface LaptopSceneHandle {
  dispose: () => void;
}

export interface LaptopSceneOptions {
  name: string;
  role: string;
}

export function createLaptopScene(container: HTMLElement, canvas: HTMLCanvasElement, options: LaptopSceneOptions): LaptopSceneHandle | null {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 768px)').matches;
  const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero = container.closest<HTMLElement>('#hero') ?? container;
  let disposed = false;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.2, 9.6);
  camera.lookAt(0, 0, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  const disposables: { dispose: () => void }[] = [environment];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const accentGlow = readColor('--color-accent-glow', '#3ddc8f');

  /* --- Materials ------------------------------------------------------- */
  const bodyMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x252b34,
      metalness: 0.72,
      roughness: 0.4,
      clearcoat: 0.16,
      clearcoatRoughness: 0.45,
      envMapIntensity: 0.55
    })
  );
  const keyMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0f1218, metalness: 0.2, roughness: 0.6 }));
  const bezelMaterial = track(new THREE.MeshStandardMaterial({ color: 0x07080b, metalness: 0.1, roughness: 0.5 }));
  const trackpadMaterial = track(new THREE.MeshPhysicalMaterial({ color: 0x232932, metalness: 0.6, roughness: 0.4, clearcoat: 0.8 }));
  const edgeMaterial = track(new THREE.MeshStandardMaterial({ color: 0x505966, metalness: 0.85, roughness: 0.3 }));

  /* --- Base ------------------------------------------------------------------ */
  const BASE_W = 3.3;
  const BASE_D = 2.15;
  const BASE_H = 0.08;
  const root = new THREE.Group();
  scene.add(root);
  const laptop = new THREE.Group();
  root.add(laptop);

  const baseGeometry = track(
    new THREE.ExtrudeGeometry(roundedRect(BASE_W, BASE_D, 0.16), { depth: BASE_H, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 14 })
  );
  const base = new THREE.Mesh(baseGeometry, bodyMaterial);
  base.rotation.x = -Math.PI / 2;
  laptop.add(base);
  const TOP = BASE_H + 0.02;

  // Rounded keys share one geometry and one draw call; the legends use one atlas.
  const keyboardWidth = 2.68;
  const keyboardDepth = 1.13;
  const keyboardZ = -0.34;
  const wellGeometry = track(new THREE.ShapeGeometry(roundedRect(keyboardWidth + 0.08, keyboardDepth + 0.05, 0.06)));
  const well = new THREE.Mesh(wellGeometry, bezelMaterial);
  well.rotation.x = -Math.PI / 2;
  well.position.set(0, TOP + 0.001, keyboardZ);
  laptop.add(well);

  const rows = [
    ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '⏻'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
    ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '∖'],
    ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'enter'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
    ['ctrl', 'fn', 'alt', 'cmd', '', 'cmd', 'alt', '←', '↑', '→']
  ];
  const keyGeometry = track(new THREE.ExtrudeGeometry(roundedRect(1, 1, 0.13), {
    depth: 0.018, bevelEnabled: false, curveSegments: 3
  }));
  keyGeometry.rotateX(-Math.PI / 2);
  const keys = track(new THREE.InstancedMesh(keyGeometry, keyMaterial, rows.flat().length));
  const matrix = new THREE.Matrix4();
  const legends = document.createElement('canvas');
  legends.width = 1536;
  legends.height = 648;
  const ctx = legends.getContext('2d')!;
  ctx.fillStyle = '#bdc7d6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let keyIndex = 0;
  rows.forEach((row, r) => {
    const weights = row.map(label => label === '' ? 5 : label.length > 2 && r > 0 ? 1.6 : 1);
    const unit = keyboardWidth / weights.reduce((sum, weight) => sum + weight, 0);
    let x = -keyboardWidth / 2;
    row.forEach((label, i) => {
      const width = weights[i] * unit;
      const z = keyboardZ - keyboardDepth / 2 + 0.095 + r * 0.187;
      matrix.compose(new THREE.Vector3(x + width / 2, TOP + 0.004, z), new THREE.Quaternion(), new THREE.Vector3(width - 0.027, 1, r === 0 ? 0.11 : 0.148));
      keys.setMatrixAt(keyIndex++, matrix);
      ctx.font = `${label.length > 1 ? 16 : 22}px ui-monospace, monospace`;
      ctx.fillText(label, (x + width / 2 + keyboardWidth / 2) / keyboardWidth * legends.width, (z - keyboardZ + keyboardDepth / 2) / keyboardDepth * legends.height);
      x += width;
    });
  });
  laptop.add(keys);
  const legendTexture = track(new THREE.CanvasTexture(legends));
  legendTexture.colorSpace = THREE.SRGBColorSpace;
  legendTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const legendMaterial = track(new THREE.MeshBasicMaterial({ map: legendTexture, transparent: true, depthWrite: false, toneMapped: false }));
  const legendMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(keyboardWidth, keyboardDepth)), legendMaterial);
  legendMesh.rotation.x = -Math.PI / 2;
  legendMesh.position.set(0, TOP + 0.023, keyboardZ);
  laptop.add(legendMesh);

  const trackpadGeometry = track(new THREE.ShapeGeometry(roundedRect(1.16, 0.62, 0.06)));
  const trackpadRim = new THREE.Mesh(trackpadGeometry, edgeMaterial);
  trackpadRim.rotation.x = -Math.PI / 2;
  trackpadRim.position.set(0, TOP + 0.001, 0.62);
  laptop.add(trackpadRim);
  const trackpad = new THREE.Mesh(trackpadGeometry, trackpadMaterial);
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.scale.set(0.985, 0.975, 1);
  trackpad.position.set(0, TOP + 0.002, 0.62);
  laptop.add(trackpad);

  const hingeGeometry = track(new THREE.CylinderGeometry(0.045, 0.045, 0.48, 12));
  for (const x of [-1.06, 1.06]) {
    const hinge = new THREE.Mesh(hingeGeometry, edgeMaterial);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, TOP, -BASE_D / 2 + 0.05);
    laptop.add(hinge);
  }
  const portGeometry = track(new THREE.BoxGeometry(0.008, 0.037, 0.16));
  for (const z of [-0.72, -0.44]) {
    const port = new THREE.Mesh(portGeometry, bezelMaterial);
    port.position.set(-BASE_W / 2 - 0.02, 0.039, z);
    laptop.add(port);
  }
  const speakerGeometry = track(new THREE.CircleGeometry(0.009, 5));
  const speakers = track(new THREE.InstancedMesh(speakerGeometry, bezelMaterial, 96));
  const speakerRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  let speakerIndex = 0;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 3; col++) {
        matrix.compose(new THREE.Vector3(side * (1.45 + col * 0.035), TOP + 0.002, -0.8 + row * 0.055), speakerRotation, new THREE.Vector3(1, 1, 1));
        speakers.setMatrixAt(speakerIndex++, matrix);
      }
    }
  }
  laptop.add(speakers);

  /* --- Lid + screen ------------------------------------------------------------ */
  const LID_W = 3.3;
  const LID_H = 2.15;
  const LID_T = 0.045;
  const lid = new THREE.Group();
  lid.position.set(0, TOP + 0.065, -BASE_D / 2 + 0.06);
  laptop.add(lid);

  const lidGeometry = track(
    new THREE.ExtrudeGeometry(roundedRect(LID_W, LID_H, 0.16), { depth: LID_T, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 14 })
  );
  const lidMesh = new THREE.Mesh(lidGeometry, bodyMaterial);
  lidMesh.position.set(0, LID_H / 2, -LID_T);
  lid.add(lidMesh);

  const bezelGeometry = track(new THREE.ShapeGeometry(roundedRect(LID_W - 0.1, LID_H - 0.1, 0.12)));
  const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
  // The lid's bevel adds 0.015 in front of its face, so the bezel, screen and
  // camera dot all sit past it.
  bezel.position.set(0, LID_H / 2, 0.022);
  lid.add(bezel);

  const painter = new ScreenPainter(options.name);
  const screenTexture = track(new THREE.CanvasTexture(painter.canvas));
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const screenMaterial = track(
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false })
  );
  const SCREEN_PLANE_W = LID_W - 0.24;
  const SCREEN_PLANE_H = SCREEN_PLANE_W / (SCREEN_W / SCREEN_H);
  const screenGeometry = track(new THREE.ShapeGeometry(roundedRect(SCREEN_PLANE_W, SCREEN_PLANE_H, 0.065)));
  const screenUV = screenGeometry.getAttribute('uv');
  const screenPosition = screenGeometry.getAttribute('position');
  for (let i = 0; i < screenUV.count; i++) {
    screenUV.setXY(i, screenPosition.getX(i) / SCREEN_PLANE_W + 0.5, screenPosition.getY(i) / SCREEN_PLANE_H + 0.5);
  }
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, LID_H / 2 + 0.02, 0.03);
  lid.add(screen);

  // Camera dot above the screen
  const camDotGeometry = track(new THREE.CircleGeometry(0.02, 16));
  const camDot = new THREE.Mesh(camDotGeometry, track(new THREE.MeshStandardMaterial({ color: 0x2b303c })));
  camDot.position.set(0, LID_H - 0.06, 0.031);
  lid.add(camDot);

  // The same infinity mark as the header, printed on the outside of the lid.
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = 256;
  const logoContext = logoCanvas.getContext('2d')!;
  logoContext.scale(5.12, 5.12);
  logoContext.strokeStyle = '#fff';
  logoContext.lineWidth = 11;
  logoContext.lineCap = 'round';
  logoContext.stroke(new Path2D('M25 10C10 10 10 40 25 40C35 40 40 30 50 25C60 20 65 10 75 10C90 10 90 40 75 40C65 40 60 30 50 25C40 20 35 10 25 10Z'));
  const logoTexture = track(new THREE.CanvasTexture(logoCanvas));
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const logoMaterial = track(new THREE.MeshBasicMaterial({
    map: logoTexture, color: 0x22b573, transparent: true, toneMapped: false, depthWrite: false
  }));
  const logo = new THREE.Mesh(track(new THREE.PlaneGeometry(0.62, 0.31)), logoMaterial);
  logo.position.set(0, LID_H / 2, -LID_T - 0.018);
  logo.rotation.y = Math.PI;
  lid.add(logo);

  const OPEN = -0.2;
  const CLOSED = Math.PI / 2;
  lid.rotation.x = CLOSED;

  /* --- Lights --------------------------------------------------------------- */
  const keyLight = new THREE.DirectionalLight(0xe4ebff, 2);
  keyLight.position.set(3, 6, 5);
  scene.add(keyLight);
  const greenLight = new THREE.PointLight(accentGlow, 3, 14, 2);
  greenLight.position.set(-3, 2, 3);
  scene.add(greenLight);
  const screenGlow = new THREE.PointLight(accentGlow, 0, 5, 2);
  screenGlow.position.set(0, 0.9, 0.6);
  laptop.add(screenGlow);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  /* --- Layout ------------------------------------------------------------------ */
  const target = { x: 0, y: 0, scale: 1, narrow: false };
  function layout() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const wide = width / height > 1.05 && width >= 1024;
    target.narrow = !wide;
    if (wide) {
      const halfViewWidth = camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      target.x = Math.min(2.1, halfViewWidth * 0.47);
      target.y = -0.55;
      target.scale = Math.min(1, halfViewWidth / 4.5);
    } else {
      target.x = 0;
      target.y = width < 640 ? 0.85 : 0.95;
      target.scale = width < 640 ? 0.5 : 0.66;
    }
    root.position.set(target.x, target.y, 0);
    root.scale.setScalar(target.scale);
  }

  /* --- Interaction --------------------------------------------------------- */
  const pointer = { x: 0, y: 0 };
  const smoothPointer = { x: 0, y: 0 };
  let scrollProgress = 0;
  // Scroll events arrive in coarse steps on phones; the lid follows this
  // smoothed value instead so it closes without stuttering.
  let smoothScroll = 0;
  function onPointerMove(event: PointerEvent) {
    if (!hasPointer || event.pointerType === 'touch') return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  }
  function readScroll() {
    const rect = hero.getBoundingClientRect();
    scrollProgress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
  }

  /* --- Frame ----------------------------------------------------------------- */
  let lastPaint = -1;
  let lastFrame = -1;
  function renderFrame(elapsed: number) {
    // Frame-rate independent smoothing (same feel at 60 or 120 Hz).
    const dt = lastFrame < 0 ? 1 / 60 : Math.min(0.1, elapsed - lastFrame);
    lastFrame = elapsed;
    const k = 1 - Math.exp(-dt * 7);
    smoothPointer.x += (pointer.x - smoothPointer.x) * k * 0.7;
    smoothPointer.y += (pointer.y - smoothPointer.y) * k * 0.7;
    readScroll();
    smoothScroll += (scrollProgress - smoothScroll) * k;
    const sp = smoothScroll;

    // Lid: opens over the first ~1.6s, then closes with scroll. On phones the
    // laptop leaves the screen quickly, so the lid closes within the first
    // stretch of scrolling and the laptop rides along to stay in view.
    const intro = easeOutExpo(Math.min(1, elapsed / 1.6));
    const closeSpeed = target.narrow ? 4 : 2.2;
    const openAmount = intro * (1 - easeInOut(Math.min(1, sp * closeSpeed)));
    lid.rotation.x = CLOSED + (OPEN - CLOSED) * openAmount;
    screenMaterial.color.setScalar(0.3 + openAmount * 0.7);
    screenGlow.intensity = openAmount * 1.1;

    root.rotation.y = -0.38 + smoothPointer.x * 0.12;
    root.rotation.x = 0.28 - smoothPointer.y * 0.05 + sp * 0.18;
    root.position.y = target.y + Math.sin(elapsed * 0.7) * 0.018 + (target.narrow ? -sp : sp * 0.6);
    root.position.x = target.x + smoothPointer.x * 0.04;

    // Repaint the screen at ~30fps while the lid is open and still; while it
    // is closing the texture upload would only steal frames from the motion.
    const lidMoving = Math.abs(scrollProgress - smoothScroll) > 0.003 || intro < 1;
    if (openAmount > 0.15 && !lidMoving && elapsed - lastPaint > 1 / (isSmall ? 15 : 24)) {
      painter.paint(elapsed);
      screenTexture.needsUpdate = true;
      lastPaint = elapsed;
    }

    renderer.render(scene, camera);
  }

  let rafId = 0;
  let running = false;
  let elapsedBase = 0;
  let runStart = 0;
  function loop(now: number) {
    if (!running) return;
    renderFrame(elapsedBase + (now - runStart) / 1000);
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reducedMotion || disposed) return;
    running = true;
    lastFrame = -1;
    runStart = performance.now();
    rafId = requestAnimationFrame(loop);
  }
  function stop() {
    if (running) elapsedBase += (performance.now() - runStart) / 1000;
    running = false;
    cancelAnimationFrame(rafId);
  }

  layout();
  painter.paint(2.5);
  screenTexture.needsUpdate = true;
  if (reducedMotion) {
    lid.rotation.x = OPEN;
    root.rotation.set(0.28, -0.38, 0);
    renderer.render(scene, camera);
  } else {
    renderFrame(0);
    start();
  }
  canvas.classList.add('is-ready');

  // Fonts may finish loading after the first paint; repaint once they do.
  document.fonts?.ready.then(() => {
    if (disposed) return;
    painter.paint(2.5);
    screenTexture.needsUpdate = true;
    if (reducedMotion) renderer.render(scene, camera);
  });

  const resizeObserver = new ResizeObserver(() => {
    layout();
    if (reducedMotion) renderer.render(scene, camera);
  });
  resizeObserver.observe(container);

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
    else if (container.getBoundingClientRect().bottom > 0) start();
  }
  function onThemeChange() {
    const glow = readColor('--color-accent-glow', '#3ddc8f');
    painter.refreshColors();
    greenLight.color.copy(glow);
    screenGlow.color.copy(glow);
    painter.paint(2.5);
    screenTexture.needsUpdate = true;
    if (reducedMotion) renderer.render(scene, camera);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('theme-change', onThemeChange);

  return {
    dispose() {
      disposed = true;
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('theme-change', onThemeChange);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
