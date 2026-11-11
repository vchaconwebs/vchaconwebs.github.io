import * as THREE from 'three';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 900px)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* =========================================================
   Pantalla de carga
   ========================================================= */
const loaderNum = document.getElementById('loader-num');
const loaderBar = document.getElementById('loader-bar');
let loadShown = 0;
function setLoad(p) {
  loadShown = Math.max(loadShown, p);
  if (loaderNum) loaderNum.textContent = Math.round(loadShown);
  if (loaderBar) loaderBar.style.width = loadShown + '%';
}
function finishLoading() {
  const start = loadShown, t0 = performance.now();
  (function step(now) {
    const k = Math.min(1, (now - t0) / 500);
    setLoad(start + (100 - start) * k);
    if (k < 1) requestAnimationFrame(step);
    else setTimeout(() => root.classList.add('ready'), 150);
  })(t0);
}

/* =========================================================
   Título del hero: cada letra por separado
   ========================================================= */
document.querySelectorAll('.split').forEach((el) => {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.style.setProperty('--i', i + (el.classList.contains('grad') ? 6 : 0));
    s.textContent = c;
    el.appendChild(s);
  });
  // el degradado se aplica por letra para que no se corte
  if (el.classList.contains('grad')) {
    el.classList.remove('grad');
    el.querySelectorAll('.ch').forEach((c) => c.classList.add('grad'));
  }
});

/* =========================================================
   Formas de partículas
   ========================================================= */
const COUNT = isMobile ? 9000 : 22000;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/* Núcleo: esfera + dos anillos orbitales inclinados */
function sphere(n, r) {
  const out = new Float32Array(n * 3);
  const g = Math.PI * (3 - Math.sqrt(5));
  const m = Math.floor(n * 0.74);
  for (let i = 0; i < m; i++) {
    const y = 1 - (i / (m - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = g * i;
    const rr = r * (Math.random() < 0.9 ? 1 + gauss() * 0.02 : rand(0.15, 0.95));
    out.set([Math.cos(th) * rad * rr, y * rr, Math.sin(th) * rad * rr], i * 3);
  }
  const tilts = [[0.42, 0.3], [-0.55, -0.6]];
  for (let i = m; i < n; i++) {
    const ring = i % 2, [tx, tz] = tilts[ring];
    const R = r * (ring ? 1.55 : 1.32) + gauss() * 0.04 * r;
    const a = Math.random() * Math.PI * 2;
    let x = Math.cos(a) * R, y = gauss() * 0.015 * r, z = Math.sin(a) * R;
    let y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx);
    let x2 = x * Math.cos(tz) - y1 * Math.sin(tz), y2 = x * Math.sin(tz) + y1 * Math.cos(tz);
    out.set([x2, y2, z1], i * 3);
  }
  return out;
}

function torusKnot(n, s) {
  const out = new Float32Array(n * 3);
  const p = 2, q = 3;
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.cos(q * t) + 2;
    const x = r * Math.cos(p * t), y = r * Math.sin(p * t), z = -Math.sin(q * t);
    v.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(Math.pow(Math.random(), 0.5) * 0.42);
    out.set([(x + v.x) * s, (y + v.y) * s, (z + v.z) * s], i * 3);
  }
  return out;
}

function wave(n) {
  const out = new Float32Array(n * 3);
  const cols = Math.round(Math.sqrt(n * 2.2));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const cx = i % cols, cz = Math.floor(i / cols);
    const x = (cx / (cols - 1) - 0.5) * 18;
    const z = (cz / (rows - 1) - 0.5) * 10;
    out.set([x, -2.1, z - 1], i * 3);
  }
  return out;
}

function helix(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = rand(-1, 1);
    const a = t * 9;
    const y = t * 3.4;
    const kind = Math.random();
    let x, z;
    if (kind < 0.78) {
      const off = kind < 0.39 ? 0 : Math.PI;
      const r = 1.15 + gauss() * 0.05;
      x = Math.cos(a + off) * r; z = Math.sin(a + off) * r;
    } else {
      // peldaños entre las dos hebras
      const tt = Math.round(t * 22) / 22, aa = tt * 9, k = rand(-1, 1);
      x = Math.cos(aa) * 1.15 * k; z = Math.sin(aa) * 1.15 * k;
      out.set([x, tt * 3.4, z], i * 3);
      continue;
    }
    out.set([x + gauss() * 0.04, y, z + gauss() * 0.04], i * 3);
  }
  return out;
}

function fromCanvas(n, draw, size, depth) {
  const W = 256, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
  draw(ctx);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4] > 128) pts.push(x, y);
  const out = new Float32Array(n * 3);
  const m = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(Math.random() * m) * 2;
    const x = ((pts[k] + Math.random()) / W - 0.5) * size;
    const y = -((pts[k + 1] + Math.random()) / H - 0.5) * size;
    out.set([x, y, (Math.random() - 0.5) * depth], i * 3);
  }
  return out;
}

function galaxy(n) {
  const out = new Float32Array(n * 3);
  const arms = 3, tilt = 1.22;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let i = 0; i < n; i++) {
    const r = Math.pow(Math.random(), 0.7) * 6.2;
    const a = (i % arms) / arms * Math.PI * 2 + r * 0.9 + gauss() * (0.35 + r * 0.03);
    let x = Math.cos(a) * r, z = Math.sin(a) * r, y = gauss() * 0.22 * (1 - r / 7);
    const y2 = y * ct - z * st, z2 = y * st + z * ct;
    out.set([x, y2, z2], i * 3);
  }
  return out;
}

/* Posición de cada forma en pantalla (texto a la izquierda, forma a la derecha) */
const side = isMobile ? 0 : 1;
const SHAPES = [
  { pts: sphere(COUNT, isMobile ? 1.3 : 1.62), off: [2.75 * side, isMobile ? 1.2 : 0.1, 0], spin: 0.1 },
  { pts: torusKnot(COUNT, isMobile ? 0.55 : 0.72), off: [2.7 * side, 0, 0], spin: 0.12 },
  { pts: wave(COUNT), off: [0, 0, 0], spin: 0.0 },
  { pts: helix(COUNT), off: [3.0 * side, 0, 0], spin: 0.22 },
  { pts: galaxy(COUNT), off: [0, -0.3, -2.2], spin: 0.0 },
];
setLoad(35);

/* Colores: brasa, ámbar, violeta y blanco cálido */
const warm = ['#FF7A45', '#FF7A45', '#FFC46B', '#FFC46B', '#9D8CFF', '#F6EDE4'].map((c) => new THREE.Color(c));

/* =========================================================
   Escena
   ========================================================= */
const canvas = document.getElementById('gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove();
  finishLoading();
  throw e;
}
const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, isMobile ? 10 : 8.5);

const geo = new THREE.BufferGeometry();
SHAPES.forEach((s, i) => geo.setAttribute('aS' + i, new THREE.BufferAttribute(s.pts, 3)));
geo.setAttribute('position', new THREE.BufferAttribute(SHAPES[0].pts, 3));
const rnd = new Float32Array(COUNT), c1 = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) {
  rnd[i] = Math.random();
  const a = warm[(Math.random() * warm.length) | 0];
  c1.set([a.r, a.g, a.b], i * 3);
}
geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
geo.setAttribute('aC1', new THREE.BufferAttribute(c1, 3));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 g0=vec3(a0.xy,h.x); vec3 g1=vec3(a0.zw,h.y); vec3 g2=vec3(a1.xy,h.z); vec3 g3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(g0,g0),dot(g1,g1),dot(g2,g2),dot(g3,g3)));
  g0*=norm.x; g1*=norm.y; g2*=norm.z; g3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(g0,x0),dot(g1,x1),dot(g2,x2),dot(g3,x3)));
}`;

const uniforms = {
  uTime: { value: 0 },
  uProgress: { value: 0 },
  uSize: { value: isMobile ? 46 : 42 },
  uPR: { value: DPR },
  uMouse: { value: new THREE.Vector3(99, 99, 0) },
  uMouseForce: { value: 0 },
  uAlpha: { value: isMobile ? 0.55 : 0.62 },
  uOff: { value: SHAPES.map((s) => new THREE.Vector3(...s.off)) },
  uSpin: { value: SHAPES.map((s) => s.spin) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    uniform float uTime, uProgress, uSize, uPR, uMouseForce;
    uniform vec3 uMouse;
    uniform vec3 uOff[5];
    uniform float uSpin[5];
    attribute vec3 aS0, aS1, aS2, aS3, aS4, aC1;
    attribute float aRand;
    varying vec3 vColor;
    varying float vFade;
    ${NOISE}
    vec3 place(vec3 p, int i){
      float a = uTime * uSpin[i];
      float c = cos(a), s = sin(a);
      p = vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
      return p + uOff[i];
    }
    float seg(float i){
      float t = clamp((uProgress - (i - 1.0)) * 1.5 - aRand * 0.5, 0.0, 1.0);
      return t * t * (3.0 - 2.0 * t);
    }
    void main(){
      // el núcleo "respira": se deforma con ruido a lo largo de su normal
      vec3 s0 = aS0;
      float r0 = length(s0);
      if (r0 > 0.001) s0 += (s0 / r0) * snoise(s0 * 0.85 + uTime * 0.35) * 0.22 * smoothstep(0.0, 1.0, r0);

      vec3 w = aS2;
      w.y += sin(w.x * 0.7 + uTime * 0.9) * 0.28 + cos(w.z * 0.9 + uTime * 0.7) * 0.22;

      float t1 = seg(1.0), t2 = seg(2.0), t3 = seg(3.0), t4 = seg(4.0);
      vec3 pos = place(s0, 0);
      pos = mix(pos, place(aS1, 1), t1);
      pos = mix(pos, place(w,   2), t2);
      pos = mix(pos, place(aS3, 3), t3);
      pos = mix(pos, place(aS4, 4), t4);

      // turbulencia durante las transiciones
      float trans = (t1*(1.0-t1) + t2*(1.0-t2) + t3*(1.0-t3) + t4*(1.0-t4)) * 4.0;
      vec3 q = pos * 0.55 + uTime * 0.12;
      vec3 n = vec3(snoise(q), snoise(q + 17.3), snoise(q + 41.7));
      pos += n * (0.05 + trans * 0.85);

      // el ratón aparta las partículas
      vec2 d = pos.xy - uMouse.xy;
      float dl = length(d);
      pos.xy += normalize(d + 1e-4) * smoothstep(1.6, 0.0, dl) * 0.55 * uMouseForce;

      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.35 + aRand * 0.9) * uPR / -mv.z;

      float tw = 0.75 + 0.25 * sin(uTime * 2.0 + aRand * 40.0);
      vColor = aC1 * tw;
      vFade = smoothstep(18.0, 5.0, -mv.z);
    }`,
  fragmentShader: /* glsl */`
    uniform float uAlpha;
    varying vec3 vColor;
    varying float vFade;
    void main(){
      // núcleo brillante + halo suave (brillo sin postprocesado)
      float d = length(gl_PointCoord - 0.5);
      float core = pow(smoothstep(0.5, 0.0, d), 3.0) * 1.6;
      float halo = exp(-d * 9.0) * 0.55;
      float a = (core + halo) * smoothstep(0.5, 0.42, d);
      gl_FragColor = vec4(vColor * 1.25, a * uAlpha * vFade);
    }`,
});

const points = new THREE.Points(geo, material);
scene.add(points);

/* Polvo de fondo: estrellas lejanas */
{
  const n = isMobile ? 500 : 1200, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) p.set([rand(-30, 30), rand(-18, 18), rand(-30, -6)], i * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ color: 0x8c86a8, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false });
  const dust = new THREE.Points(g, m);
  dust.name = 'dust';
  scene.add(dust);
}
setLoad(60);

setLoad(80);

/* =========================================================
   Scroll → forma
   ========================================================= */
const scenes = [...document.querySelectorAll('[data-scene]')];
const railItems = [...document.querySelectorAll('.rail li')];
const navLinks = [...document.querySelectorAll('.nav__links a')];
let target = 0, current = 0, activeIdx = -1;

function computeTarget() {
  const vh = innerHeight, mid = scrollY + vh * 0.5;
  const tops = scenes.map((s) => s.getBoundingClientRect().top + scrollY);
  let p = 0;
  for (let i = 0; i < tops.length - 1; i++) {
    const boundary = tops[i + 1];
    const k = (mid - (boundary - vh * 0.45)) / (vh * 0.9);
    p += Math.min(1, Math.max(0, k));
  }
  target = p;
  const idx = Math.round(p);
  if (idx !== activeIdx) {
    activeIdx = idx;
    railItems.forEach((li, i) => li.classList.toggle('is-active', i === idx));
    const id = scenes[idx] && scenes[idx].id;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
  }
}
addEventListener('scroll', computeTarget, { passive: true });
computeTarget();
current = target;

/* =========================================================
   Ratón
   ========================================================= */
const mouse = new THREE.Vector2(0, 0), mouseSmooth = new THREE.Vector2(0, 0);
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hit = new THREE.Vector3();
let mouseActive = 0;
addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  mouseActive = 1;
}, { passive: true });
document.addEventListener('pointerleave', () => { mouseActive = 0; });

/* =========================================================
   Bucle
   ========================================================= */
const clock = new THREE.Clock();
let running = true;
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.getDelta(); });

function frame() {
  requestAnimationFrame(frame);
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!reduceMotion) uniforms.uTime.value += dt;

  current += (target - current) * (reduceMotion ? 1 : Math.min(1, dt * 3.2));
  uniforms.uProgress.value = current;

  mouseSmooth.lerp(mouse, Math.min(1, dt * 5));
  ray.setFromCamera(mouseSmooth, camera);
  if (ray.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.copy(hit);
  uniforms.uMouseForce.value += ((finePointer ? mouseActive : 0) - uniforms.uMouseForce.value) * Math.min(1, dt * 3);

  // parallax de cámara
  camera.position.x += (mouseSmooth.x * 0.45 - camera.position.x) * Math.min(1, dt * 2);
  camera.position.y += (mouseSmooth.y * 0.3 - camera.position.y) * Math.min(1, dt * 2);
  camera.lookAt(0, 0, 0);

  const dust = scene.getObjectByName('dust');
  if (dust) { dust.rotation.y = uniforms.uTime.value * 0.006; dust.position.y = current * 0.6; }

  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  computeTarget();
});

frame();
finishLoading();

/* =========================================================
   Interfaz
   ========================================================= */

/* Aparición al entrar en pantalla */
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        const n = en.target.querySelector('[data-count]');
        if (n) countUp(n);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

function countUp(el) {
  const end = +el.dataset.count, t0 = performance.now(), dur = 1400;
  (function step(now) {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = Math.round(end * e);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

/* Inclinación 3D de tarjetas */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.tilt').forEach((el) => {
    const max = el.classList.contains('feature') ? 4 : 9;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  /* Botones magnéticos */
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* Cursor */
  const cur = document.querySelector('.cursor');
  const cp = { x: innerWidth / 2, y: innerHeight / 2 }, cs = { x: cp.x, y: cp.y };
  addEventListener('pointermove', (e) => { cp.x = e.clientX; cp.y = e.clientY; }, { passive: true });
  (function moveCursor() {
    cs.x += (cp.x - cs.x) * 0.2; cs.y += (cp.y - cs.y) * 0.2;
    cur.style.transform = `translate(${cs.x}px, ${cs.y}px)`;
    requestAnimationFrame(moveCursor);
  })();
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
  });
}

/* Cuenta atrás hasta enero de 2027 */
const daysEl = document.getElementById('days');
if (daysEl) {
  const start = new Date(2027, 0, 7);
  const d = Math.ceil((start - new Date()) / 86400000);
  daysEl.textContent = d > 0 ? d : '0';
  if (d <= 0) daysEl.nextElementSibling.innerHTML = 'ya estudiando<br><span class="mono">desde enero 2027</span>';
}

/* Copiar correo */
const copyBtn = document.getElementById('copy');
const emailEl = document.getElementById('email');
const copied = document.getElementById('copied');
copyBtn.addEventListener('click', () => {
  const text = emailEl.textContent.trim();
  const fallback = () => {
    const r = document.createRange(); r.selectNodeContents(emailEl);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    copied.textContent = 'Seleccionado: pulsa Ctrl+C';
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      copied.textContent = 'Copiado al portapapeles';
      copyBtn.textContent = 'Copiado';
      setTimeout(() => { copyBtn.textContent = 'Copiar'; copied.textContent = ''; }, 2200);
    }, fallback);
  } else fallback();
});

document.getElementById('year').textContent = new Date().getFullYear();

/* Trayectoria: orden de aparición y línea que se dibuja con el scroll */
document.querySelectorAll('.study, #trayectoria .chips').forEach((list) => {
  [...list.children].forEach((li, i) => li.style.setProperty('--i', i));
});
const timeline = document.querySelector('.timeline');
if (timeline) {
  if (reduceMotion) timeline.style.setProperty('--p', 1);
  else {
    const drawLine = () => {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / r.height));
      timeline.style.setProperty('--p', p.toFixed(3));
    };
    addEventListener('scroll', drawLine, { passive: true });
    addEventListener('resize', drawLine);
    drawLine();
  }
}
