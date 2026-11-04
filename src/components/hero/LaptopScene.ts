import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import brand from '../../data/brand.json';

/**
 * Commercial 3D scene: a laptop, built procedurally, with a live screen. The screen
 * is painted once per theme/font change, with layouts specific to each device.
 * Scroll reframes the open laptop and introduces the tablet and phone. No
 * external models, decorative code editor, or continuously uploaded textures.
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
// Official brand marks (see src/components/ui/Logo.astro), as canvas paths.
const SYMBOL_PATHS = brand.symbol.paths.map((d) => new Path2D(d));

/** Fills the lk symbol with its top-left corner at the current origin, `height` px tall. */
function fillSymbol(ctx: CanvasRenderingContext2D, height: number, color: string) {
  ctx.save();
  ctx.scale(height / brand.symbol.height, height / brand.symbol.height);
  ctx.fillStyle = color;
  SYMBOL_PATHS.forEach((path) => ctx.fill(path));
  ctx.restore();
}

type ScreenCopy = { brand: string; title: string; button: string };
class ScreenPainter {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private accent = '#22b573';
  constructor(private readonly name: string, private readonly copy?: ScreenCopy, private readonly format: 'desktop' | 'tablet' | 'phone' = 'desktop') {
    this.canvas.width = format === 'phone' ? 360 : format === 'tablet' ? 600 : SCREEN_W;
    this.canvas.height = format === 'phone' ? 760 : format === 'tablet' ? 800 : SCREEN_H;
    this.ctx = this.canvas.getContext('2d')!;
    this.refreshColors();
  }
  refreshColors() { this.accent = readVar('--color-accent', '#22b573'); }
  paint(_progress: number) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const pt = document.documentElement.lang.startsWith('pt');
    const phone = this.format === 'phone', tablet = this.format === 'tablet';
    const dark = document.documentElement.classList.contains('dark');
    const bg = dark ? '#0b0d12' : '#f4f6f3', fg = dark ? '#e8eaf0' : '#19231e';
    const surface = dark ? '#171e24' : '#e4eae5';
    const copy = this.copy ?? { brand: this.name, title: pt ? 'Sites e sistemas web' : 'Websites and web apps', button: pt ? 'Conversar sobre meu projeto' : 'Discuss my project' };
    const text = (t: string,x: number,y: number,size=20,color=fg) => { ctx.fillStyle=color; ctx.font='500 '+size+'px "Inter Variable",sans-serif'; ctx.fillText(t,x,y,w-x-24); };
    const box=(x:number,y:number,bw:number,bh:number,color=surface) => { ctx.fillStyle=color; roundRectPath(ctx,x,y,bw,bh,10); ctx.fill(); };
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    ctx.save(); ctx.translate(28,27); fillSymbol(ctx,26,this.accent); ctx.restore();
    text(copy.brand,70,48,phone?17:20);
    if(phone) { box(w-44,30,20,3,fg); box(w-44,39,20,3,fg); }
    else (pt?['Empresa','Serviços','Contato']:['Company','Services','Contact']).slice(tablet?1:0).forEach((label,i)=>text(label,w-(tablet?180:310)+i*100,48,14));
    const y=tablet?285:155;
    if(tablet) box(28,83,w-56,155);
    text(pt?'SEU NEGÓCIO, NA WEB':'YOUR BUSINESS, ONLINE',28,y-38,phone?13:16,this.accent);
    const titleSize=phone?30:tablet?42:48;
    text(copy.title,28,y+12,titleSize);
    box(28,y+45,phone?w-70:w*.43,6);
    box(28,y+65,phone?w-110:w*.34,6);
    box(28,y+101,phone?w-56:310,54,this.accent);
    text(copy.button,42,y+134,phone?15:17,readVar('--color-on-accent','#04130b'));
    if(!phone&&!tablet) { box(640,118,350,220); text('↗',768,252,70,this.accent); }
    if(phone) box(28,y+180,w-56,120);
    const services=pt?['Landing pages','Sites institucionais','Sistemas web','Automações']:['Landing pages','Company websites','Web apps','Automations'];
    const cols=phone?1:tablet?2:4;
    const gap=14, cw=(w-56-gap*(cols-1))/cols;
    const top=phone?y+325:tablet?y+200:430;
    services.forEach((label,i)=>{
      const x=28+(i%cols)*(cw+gap), cy=top+Math.floor(i/cols)*(phone?63:100);
      box(x,cy,cw,phone?51:85);
      text('0'+(i+1),x+12,cy+24,12,this.accent);
      text(label,x+12,cy+(phone?42:56),phone?16:15);
    });
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
  devices?: boolean;
  screen?: ScreenCopy;
}

export function createLaptopScene(container: HTMLElement, canvas: HTMLCanvasElement, options: LaptopSceneOptions): LaptopSceneHandle | null {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 768px)').matches;
  const hasPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hero = options.devices ? container : container.closest<HTMLElement>('#hero') ?? container;
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

  const painter = new ScreenPainter(options.name, options.screen);
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

  // Tablets and phones share materials and render in this same scene/loop.
  const companions: { group: THREE.Group; painter: ScreenPainter; texture: THREE.CanvasTexture; x: number }[] = [];
  if (options.devices) {
    for (const [format, width, height, x] of [['tablet', 1.5, 2, 1.3], ['phone', .82, 1.73, 2.6]] as const) {
      const group = new THREE.Group();
      const shell = new THREE.Mesh(track(new THREE.ExtrudeGeometry(roundedRect(width, height, .12), { depth: .07, bevelEnabled: false, curveSegments: 6 })), bodyMaterial);
      group.add(shell);
      const display = new ScreenPainter(options.name, options.screen, format);
      display.paint(0);
      const texture = track(new THREE.CanvasTexture(display.canvas));
      texture.colorSpace = THREE.SRGBColorSpace;
      const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(width-.1,height-.14)), track(new THREE.MeshBasicMaterial({ map:texture, toneMapped:false })));
      plane.position.z = .075;
      group.add(plane);
      group.position.set(x, .8, .9);
      group.rotation.y = -.12;
      root.add(group);
      companions.push({ group, painter:display, texture, x });
    }
    laptop.position.x = -1.45;
  }

  // Camera dot above the screen
  const camDotGeometry = track(new THREE.CircleGeometry(0.02, 16));
  const camDot = new THREE.Mesh(camDotGeometry, track(new THREE.MeshStandardMaterial({ color: 0x2b303c })));
  camDot.position.set(0, LID_H - 0.06, 0.031);
  lid.add(camDot);

  // The brand symbol, printed on the outside of the lid.
  const LOGO_H = 0.34;
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 512;
  logoCanvas.height = Math.round(512 * brand.symbol.height / brand.symbol.width);
  fillSymbol(logoCanvas.getContext('2d')!, logoCanvas.height, '#fff');
  const logoTexture = track(new THREE.CanvasTexture(logoCanvas));
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const logoMaterial = track(new THREE.MeshBasicMaterial({
    map: logoTexture, color: 0x22b573, transparent: true, toneMapped: false, depthWrite: false
  }));
  const logo = new THREE.Mesh(
    track(new THREE.PlaneGeometry(LOGO_H * brand.symbol.width / brand.symbol.height, LOGO_H)),
    logoMaterial
  );
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
  let scrollNeedsUpdate = true;
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
      target.scale = Math.min(.85, halfViewWidth / 5.2);
    } else {
      target.x = 0;
      target.y = width < 640 ? 0.85 : 0.55;
      target.scale = width < 640 ? 0.5 : 0.66;
    }
    if (options.devices) {
      target.x = -.15;
      target.y = -.55;
      target.scale = Math.min(1.15, width / height * .75);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 769 ? 1.5 : 2));
    root.position.set(target.x, target.y, 0);
    root.scale.setScalar(target.scale);
    scrollNeedsUpdate = true;
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
    if (!scrollNeedsUpdate) return;
    const rect = hero.getBoundingClientRect();
    scrollProgress = options.devices
      ? Math.min(1, Math.max(0, (window.innerHeight * .8 - rect.top) / (rect.height + window.innerHeight * .3)))
      : Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    scrollNeedsUpdate = false;
  }
  function onScroll() {
    // Coalesce scroll events into one geometry read on the next rendered frame.
    scrollNeedsUpdate = true;
  }

  /* --- Frame ----------------------------------------------------------------- */
  let lastFrame = -1;
  function renderFrame(elapsed: number) {
    // Frame-rate independent smoothing keeps the same feel at 30 or 60 Hz.
    const dt = lastFrame < 0 ? 1 / 60 : Math.min(0.1, elapsed - lastFrame);
    lastFrame = elapsed;
    const k = 1 - Math.exp(-dt * 7);
    smoothPointer.x += (pointer.x - smoothPointer.x) * k * 0.7;
    smoothPointer.y += (pointer.y - smoothPointer.y) * k * 0.7;
    readScroll();
    smoothScroll += (scrollProgress - smoothScroll) * k;
    const sp = smoothScroll;

    // Scroll reframes the open display toward the next explanation.
    const intro = easeOutExpo(Math.min(1, elapsed / 1.2));
    lid.rotation.x = options.devices ? OPEN : CLOSED + (OPEN-CLOSED)*intro + sp*.12;
    screenGlow.intensity = .7;
    root.rotation.y = (options.devices ? -.08 : -.38 + sp*.28) + smoothPointer.x*.04;
    root.rotation.x = options.devices ? .12 : .22 - sp*.12;
    root.position.y = target.y + (options.devices ? 0 : (target.narrow ? -sp*.5 : -sp*.25));
    root.position.x = target.x + (options.devices ? 0 : sp*.2);
    root.scale.setScalar(target.scale*(1-sp*(options.devices ? .04 : .12)));
    companions.forEach(({group,x},i) => {
      const p = easeInOut(Math.min(1, Math.max(0, sp*2.5-i*.35)));
      group.position.x = x - (1-p)*.35;
      group.position.y = .8 - (1-p)*.4;
      group.rotation.y = -.12 + (1-p)*.25;
    });

    renderer.render(scene, camera);
  }

  let rafId = 0;
  let running = false;
  let inViewport = false;
  let elapsedBase = 0;
  let runStart = 0;
  const frameInterval = 1000 / (isSmall ? 30 : 60);
  let nextRenderAt = 0;
  function loop(now: number) {
    if (!running) return;
    // High-refresh displays do not need extra WebGL draws for this slow motion.
    // A small tolerance absorbs rAF timestamp jitter without reducing 60 to 30 fps.
    if (now + 0.5 >= nextRenderAt) {
      renderFrame(elapsedBase + (now - runStart) / 1000);
      nextRenderAt += frameInterval;
      if (nextRenderAt < now - 0.5) nextRenderAt = now + frameInterval;
    }
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reducedMotion || disposed || !inViewport || document.visibilityState !== 'visible') return;
    running = true;
    scrollNeedsUpdate = true;
    lastFrame = -1;
    runStart = performance.now();
    nextRenderAt = runStart + frameInterval;
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
  }
  canvas.classList.add('is-ready');

  // Fonts may finish loading after the first paint; repaint once they do.
  document.fonts?.ready.then(() => {
    if (disposed) return;
    scrollNeedsUpdate = true;
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
      inViewport = entry.isIntersecting;
      if (inViewport) start();
      else stop();
    },
    { threshold: 0 }
  );
  intersectionObserver.observe(container);

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') stop();
    else start();
  }
  function onThemeChange() {
    const glow = readColor('--color-accent-glow', '#3ddc8f');
    painter.refreshColors();
    companions.forEach(({painter,texture}) => { painter.refreshColors(); painter.paint(0); texture.needsUpdate = true; });
    greenLight.color.copy(glow);
    screenGlow.color.copy(glow);
    painter.paint(2.5);
    screenTexture.needsUpdate = true;
    if (reducedMotion) renderer.render(scene, camera);
  }

  const contextLost = (event: Event) => { event.preventDefault(); stop(); container.classList.remove('is-live'); canvas.hidden = true; };
  canvas.addEventListener('webglcontextlost', contextLost);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('theme-change', onThemeChange);

  return {
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', contextLost);
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('theme-change', onThemeChange);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
