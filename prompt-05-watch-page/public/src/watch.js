// Sylvan M-01 — procedural Three.js watch hero.
// Reference contract: assets/references/watch-concept.png (steel case, green sunburst
// dial, applied markers, dauphine hands, sapphire crystal, studio key + rim + contact shadow).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const host = document.getElementById('scene');
const qa = new URLSearchParams(location.search).has('qa');
const qaState = { errors: [] };
const publish = () => {
  if (!qa) return;
  window.__P5_QA__ = qaState;
  document.documentElement.dataset.p5Qa = JSON.stringify(qaState);
};
window.addEventListener('error', (e) => { qaState.errors.push(String(e.message)); publish(); });
window.addEventListener('unhandledrejection', (e) => { qaState.errors.push(String(e.reason)); publish(); });

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e0d);
scene.fog = new THREE.Fog(0x0c0e0d, 16, 30);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(1.0, 5.8, 12.9);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(1.55, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.enableZoom = false;          // wheel keeps scrolling the page
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.62;
controls.autoRotate = !new URLSearchParams(location.search).has('freeze');
controls.autoRotateSpeed = 0.55;

// idle auto-rotate: pause on interaction, resume after 3 s
let idleTimer = 0;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { controls.autoRotate = true; publishCam(); }, 3000);
});

// ---------- lighting ----------
scene.add(new THREE.HemisphereLight(0xdfe8e2, 0x050605, 0.28));
const key = new THREE.DirectionalLight(0xfff4e4, 3.4);
key.position.set(4.5, 7, 5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -6; key.shadow.camera.right = 6;
key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
key.shadow.bias = -0.0004;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fd4e8, 3.2);
rim.position.set(-6, 3.4, -4.5);
scene.add(rim);
const fill = new THREE.PointLight(0x3d8a67, 6, 14, 2);
fill.position.set(-3.5, -1, 4);
scene.add(fill);

// ---------- procedural textures ----------
function brushedTexture(radial = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 512, 512);
  g.globalAlpha = 0.10;
  if (radial) {
    g.translate(256, 256);
    for (let i = 0; i < 900; i++) {
      const a = (i * 137.508) % 360 * Math.PI / 180;
      g.strokeStyle = i % 2 ? '#ffffff' : '#4a4a4a';
      g.beginPath();
      g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
      g.lineTo(Math.cos(a) * 256, Math.sin(a) * 256);
      g.stroke();
    }
  } else {
    for (let i = 0; i < 700; i++) {
      const y = (i * 733) % 512;
      g.strokeStyle = i % 2 ? '#ffffff' : '#4a4a4a';
      g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + ((i * 37) % 5) - 2); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function dialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  // sunburst: radial strokes over a green gradient
  const base = g.createRadialGradient(430, 400, 60, 512, 512, 620);
  base.addColorStop(0, '#17452f');
  base.addColorStop(0.55, '#0e3123');
  base.addColorStop(1, '#061c14');
  g.fillStyle = base;
  g.fillRect(0, 0, 1024, 1024);
  g.save();
  g.translate(512, 512);
  for (let i = 0; i < 2880; i++) {
    const a = i / 2880 * Math.PI * 2;
    g.globalAlpha = 0.028 + 0.05 * Math.pow(Math.max(0, Math.cos(a - 2.2)), 6);
    g.strokeStyle = i % 2 ? '#8fd0ab' : '#03130d';
    g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * 512, Math.sin(a) * 512);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
  // minute track
  g.save();
  g.translate(512, 512);
  for (let m = 0; m < 60; m++) {
    const a = m * 6 * Math.PI / 180;
    g.strokeStyle = 'rgba(233,231,224,.75)';
    g.lineWidth = m % 5 === 0 ? 4 : 2;
    const r1 = m % 5 === 0 ? 448 : 458;
    g.beginPath();
    g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.lineTo(Math.cos(a) * 472, Math.sin(a) * 472);
    g.stroke();
  }
  g.restore();
  // date window at 3 o'clock
  g.fillStyle = '#e9e7e0';
  g.fillRect(830, 486, 74, 52);
  g.strokeStyle = '#0a221a'; g.lineWidth = 4; g.strokeRect(830, 486, 74, 52);
  g.fillStyle = '#101010';
  g.font = '600 40px Georgia';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('18', 867, 514);
  // brand
  g.fillStyle = 'rgba(233,231,224,.92)';
  g.font = '600 30px "Segoe UI"';
  g.fillText('M E R I D I A N', 512, 340);
  g.font = '24px Georgia';
  g.fillStyle = 'rgba(233,231,224,.55)';
  g.fillText('Sylvan M-01 · Automatic', 512, 700);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ---------- materials ----------
const steelBrushed = new THREE.MeshStandardMaterial({
  color: 0x848c91, metalness: 1, roughness: 0.85,
  roughnessMap: brushedTexture(), envMapIntensity: 0.85,
});
const steelPolished = new THREE.MeshStandardMaterial({
  color: 0xaeb7bc, metalness: 1, roughness: 0.1, envMapIntensity: 0.85,
});
const steelRadial = new THREE.MeshStandardMaterial({
  color: 0x969ea3, metalness: 1, roughness: 0.72,
  roughnessMap: brushedTexture(true), envMapIntensity: 0.9,
});
const dialMat = new THREE.MeshStandardMaterial({
  map: dialTexture(), metalness: 0.2, roughness: 0.55, envMapIntensity: 0.45,
});

// ---------- watch model ----------
const watch = new THREE.Group();
watch.position.x = 1.55;
scene.add(watch);
// present the watch leaning toward camera like the reference product shot
watch.rotation.x = 0.52;

const R = 2.0; // case radius

// case band
const caseBand = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.985, 0.62, 96), steelBrushed);
caseBand.castShadow = true;
watch.add(caseBand);
// polished chamfer ring + bezel
const bezel = new THREE.Mesh(new THREE.TorusGeometry(R * 0.92, 0.135, 32, 96), steelPolished);
bezel.rotation.x = Math.PI / 2;
bezel.position.y = 0.32;
bezel.castShadow = true;
watch.add(bezel);
const chamfer = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.0, R * 0.94, 0.1, 96, 1, true), steelPolished);
chamfer.position.y = 0.36;
watch.add(chamfer);
// case back
const back = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.1, 96), steelRadial);
back.position.y = -0.36;
watch.add(back);

// dial
const dial = new THREE.Mesh(new THREE.CircleGeometry(R * 0.82, 96), dialMat);
dial.rotation.x = -Math.PI / 2;
dial.position.y = 0.34;
watch.add(dial);

// rehaut ring
const rehaut = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.84, R * 0.82, 0.14, 96, 1, true),
  new THREE.MeshStandardMaterial({ color: 0x0d241b, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide }));
rehaut.position.y = 0.4;
watch.add(rehaut);

// applied markers — real geometry for real speculars
const markerMat = steelPolished;
for (let h = 0; h < 12; h++) {
  if (h === 3) continue; // date window
  const a = h * 30 * Math.PI / 180;
  const long = h % 3 === 0;
  const m = new THREE.Mesh(new THREE.BoxGeometry(long ? 0.34 : 0.26, 0.05, 0.09), markerMat);
  const r = R * 0.68;
  m.position.set(Math.sin(a) * r, 0.375, -Math.cos(a) * r);
  m.rotation.y = -a + Math.PI / 2;
  m.castShadow = true;
  watch.add(m);
}

// dauphine hands at 10:09
function hand(length, width, angleDeg, y) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.14);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0.004, length);
  shape.lineTo(-0.004, length);
  shape.lineTo(-width / 2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.014, bevelSegments: 2 });
  const mesh = new THREE.Mesh(geo, steelPolished);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angleDeg * Math.PI / 180;
  mesh.position.y = y;
  mesh.castShadow = true;
  watch.add(mesh);
  return mesh;
}
hand(R * 0.44, 0.11, 305, 0.4);   // hour to ~10
hand(R * 0.64, 0.09, 54, 0.43);   // minute to ~9
const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.02, R * 0.7),
  new THREE.MeshStandardMaterial({ color: 0xd8d4c8, metalness: 0.8, roughness: 0.3 }));
secondHand.position.y = 0.455;
watch.add(secondHand);
const pinion = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 24), steelPolished);
pinion.position.y = 0.43;
watch.add(pinion);

// domed sapphire crystal
const crystal = new THREE.Mesh(
  new THREE.SphereGeometry(R * 0.84, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.3),
  new THREE.MeshPhysicalMaterial({
    color: 0x9db8c4, metalness: 0, roughness: 0.03,
    transparent: true, opacity: 0.085, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.55,
  }));
crystal.scale.set(1, 0.16, 1);
crystal.position.y = 0.3;
watch.add(crystal);

// crown (fluted) at 3 o'clock
const crown = new THREE.Group();
const crownBody = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 32), steelPolished);
crownBody.rotation.z = Math.PI / 2;
crown.add(crownBody);
for (let i = 0; i < 18; i++) {
  const a = i / 18 * Math.PI * 2;
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.05), steelBrushed);
  tooth.position.set(0, Math.cos(a) * 0.19, Math.sin(a) * 0.19);
  tooth.rotation.x = -a;
  crown.add(tooth);
}
crown.position.set(R + 0.12, 0, 0);
crown.castShadow = true;
watch.add(crown);

// lugs
for (const sx of [-1, 1]) {
  for (const sz of [-1, 1]) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.9), steelBrushed);
    lug.position.set(sx * R * 0.62, -0.02, sz * (R * 0.86));
    lug.rotation.x = sz * 0.16;
    lug.castShadow = true;
    watch.add(lug);
  }
}

// bracelet — three-link rows arcing away on both sides
const linkBrushed = new THREE.MeshStandardMaterial({
  color: 0x9ba3a8, metalness: 1, roughness: 0.5, envMapIntensity: 1.1,
});
const linkPolished = new THREE.MeshStandardMaterial({
  color: 0xbfc7cc, metalness: 1, roughness: 0.12, envMapIntensity: 1.35,
});
function braceletRow(z, drop, tilt) {
  const row = new THREE.Group();
  const midW = 0.78, sideW = 0.5, h = 0.24, d = 0.62;
  const mid = new THREE.Mesh(new RoundedBoxGeometry(midW, h, d, 3, 0.08), linkPolished);
  const l = new THREE.Mesh(new RoundedBoxGeometry(sideW, h, d, 3, 0.08), linkBrushed);
  const r2 = new THREE.Mesh(new RoundedBoxGeometry(sideW, h, d, 3, 0.08), linkBrushed);
  l.position.x = -(midW / 2 + sideW / 2 + 0.03);
  r2.position.x = midW / 2 + sideW / 2 + 0.03;
  for (const p of [mid, l, r2]) { p.castShadow = true; row.add(p); }
  // dark seam plate behind the links sells the machined gap between rows
  const seam = new THREE.Mesh(new THREE.BoxGeometry(midW + 2 * sideW + 0.1, h * 0.86, d + 0.12),
    new THREE.MeshStandardMaterial({ color: 0x14171a, metalness: 0.6, roughness: 0.8 }));
  seam.position.y = -0.02;
  row.add(seam);
  row.position.set(0, drop, z);
  row.rotation.x = tilt;
  return row;
}
for (let i = 0; i < 6; i++) {
  const z = R * 0.92 + 0.34 + i * 0.6;
  const drop = -0.06 - i * i * 0.075;
  const tilt = 0.1 + i * 0.155;
  watch.add(braceletRow(z, drop, tilt));
  watch.add(braceletRow(-z, drop, -tilt));
}

// ---------- ground: shadow catcher + soft halo ----------
const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 64),
  new THREE.ShadowMaterial({ opacity: 0.5 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.18;
ground.receiveShadow = true;
scene.add(ground);
const haloCanvas = document.createElement('canvas');
haloCanvas.width = haloCanvas.height = 256;
const hg = haloCanvas.getContext('2d');
const grad = hg.createRadialGradient(128, 128, 10, 128, 128, 128);
grad.addColorStop(0, 'rgba(38,46,42,0.9)');
grad.addColorStop(1, 'rgba(12,14,13,0)');
hg.fillStyle = grad; hg.fillRect(0, 0, 256, 256);
const halo = new THREE.Mesh(new THREE.CircleGeometry(4.6, 48),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(haloCanvas), transparent: true, depthWrite: false }));
halo.rotation.x = -Math.PI / 2;
halo.position.x = 1.55;
halo.position.y = -1.17;
scene.add(halo);

// ---------- loop ----------
const frameTimes = [];
let last = performance.now();
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 700 ? 40 : 28;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function publishCam() {
  Object.assign(qaState, {
    camera: camera.position.toArray().map((v) => +v.toFixed(3)),
    autoRotate: controls.autoRotate,
    renderer: renderer.getContext().getParameter(renderer.getContext().VERSION),
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    medianFps: (() => {
      if (!frameTimes.length) return 0;
      const s = [...frameTimes].sort((a, b) => a - b);
      return +(1000 / s[Math.floor(s.length / 2)]).toFixed(1);
    })(),
    samples: frameTimes.length,
  });
  publish();
}

let frame = 0;
function loop(now) {
  const dt = now - last; last = now;
  if (dt > 0 && dt < 250) { frameTimes.push(dt); if (frameTimes.length > 3600) frameTimes.shift(); }
  controls.update();
  secondHand.rotation.y -= 0.0011; // whisper-slow sweep
  renderer.render(scene, camera);
  if (qa && ++frame % 30 === 0) publishCam();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
publish();
