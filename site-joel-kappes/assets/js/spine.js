/* =========================================================================
   Cena 3D do hero — coluna vertebral abstrata
   Metáfora da marca: "Destrave sua coluna, destrave seu corpo".
   Ao rolar a página, os segmentos se soltam e ganham mobilidade.
   ========================================================================= */

import * as THREE from 'three';

const mount = document.getElementById('hero-canvas');

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(pointer: coarse)').matches;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (mount && !prefersReduced && supportsWebGL()) {
  init(mount);
}

function init(mount) {
  const PALETTE = {
    ink: 0x2a2c24,
    sage: 0x8b9579,
    cream: 0xf7f3eb,
    olive: 0x85764f,
    terracota: 0xba6024,
  };

  const SEGMENTS = isCoarse ? 20 : 26;

  const scene = new THREE.Scene();
  // Densidade baixa: a câmera fica a ~23 unidades, e um fog forte a essa
  // distância apagaria a coluna inteira na cor do fundo.
  scene.fog = new THREE.FogExp2(PALETTE.ink, 0.019);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 17.5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  mount.appendChild(renderer.domElement);

  /* ---------------- Luzes ---------------- */
  scene.add(new THREE.HemisphereLight(PALETTE.cream, PALETTE.ink, 0.75));

  const key = new THREE.DirectionalLight(PALETTE.cream, 2.1);
  key.position.set(-5, 8, 7);
  scene.add(key);

  const rim = new THREE.DirectionalLight(PALETTE.terracota, 1.5);
  rim.position.set(6.5, -3, -5);
  scene.add(rim);

  const fill = new THREE.PointLight(PALETTE.sage, 26, 30);
  fill.position.set(4, 1, 6);
  scene.add(fill);

  /* ---------------- Curva da coluna ----------------
     Curva em S que lembra a lordose/cifose natural.
     `straight` é a mesma coluna alinhada — interpolamos entre as duas. */
  const curved = [
    new THREE.Vector3(0.00, -6.4, 0.35),
    new THREE.Vector3(0.62, -4.2, 0.05),
    new THREE.Vector3(0.78, -2.0, -0.42),
    new THREE.Vector3(0.20, 0.4, -0.62),
    new THREE.Vector3(-0.46, 2.7, -0.28),
    new THREE.Vector3(-0.52, 4.7, 0.24),
    new THREE.Vector3(-0.10, 6.5, 0.52),
  ];
  const straight = curved.map((p, i, a) =>
    new THREE.Vector3(0, p.y, 0).multiplyScalar(1).setY(-6.4 + (12.9 * i) / (a.length - 1))
  );

  const curveA = new THREE.CatmullRomCurve3(curved, false, 'catmullrom', 0.45);
  const curveB = new THREE.CatmullRomCurve3(straight, false, 'catmullrom', 0.45);

  /* ---------------- Geometria da vértebra ----------------
     Corpo vertebral (lathe côncavo) + processo espinhoso. */
  function vertebraBody(radius, height) {
    const pts = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = (t - 0.5) * height;
      // cintura côncava, típica do corpo vertebral
      const r = radius * (1 - 0.24 * Math.sin(Math.PI * t) ** 1.6);
      pts.push(new THREE.Vector2(r, y));
    }
    const g = new THREE.LatheGeometry(pts, isCoarse ? 20 : 30);
    g.computeVertexNormals();
    return g;
  }

  const matBone = new THREE.MeshStandardMaterial({
    color: PALETTE.cream,
    roughness: 0.62,
    metalness: 0.04,
  });
  const matSage = new THREE.MeshStandardMaterial({
    color: PALETTE.sage,
    roughness: 0.5,
    metalness: 0.08,
  });
  const matDisc = new THREE.MeshStandardMaterial({
    color: PALETTE.olive,
    roughness: 0.85,
    metalness: 0,
    transparent: true,
    opacity: 0.9,
  });

  const spine = new THREE.Group();
  scene.add(spine);

  const segs = [];
  const spinousGeo = new THREE.BoxGeometry(0.16, 0.3, 1.05);
  const discGeo = new THREE.CylinderGeometry(1, 1, 1, isCoarse ? 18 : 26);

  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / (SEGMENTS - 1);
    // vértebras lombares maiores na base, cervicais menores no topo
    const radius = THREE.MathUtils.lerp(0.92, 0.42, Math.pow(t, 0.82));
    const height = THREE.MathUtils.lerp(0.44, 0.26, t);

    const g = new THREE.Group();

    const body = new THREE.Mesh(vertebraBody(radius, height), i % 5 === 2 ? matSage : matBone);
    g.add(body);

    // processo espinhoso, apontando para trás
    const sp = new THREE.Mesh(spinousGeo, body.material);
    sp.scale.set(1, 1, radius * 1.15);
    sp.position.set(0, 0, -radius * 0.92);
    sp.rotation.x = -0.42;
    g.add(sp);

    // processos transversos
    for (const side of [-1, 1]) {
      const tp = new THREE.Mesh(spinousGeo, body.material);
      tp.scale.set(0.85, 0.7, radius * 0.72);
      tp.position.set(side * radius * 0.82, 0, -radius * 0.18);
      tp.rotation.set(0, side * 1.12, 0);
      g.add(tp);
    }

    // disco intervertebral
    if (i < SEGMENTS - 1) {
      const d = new THREE.Mesh(discGeo, matDisc);
      d.scale.set(radius * 0.9, 0.12, radius * 0.9);
      d.position.y = height * 0.62;
      g.add(d);
    }

    spine.add(g);
    segs.push({
      g,
      t,
      // deslocamentos individuais para o estado "destravado"
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 2.6,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2.2
      ),
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.9,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.9
      ),
      phase: Math.random() * Math.PI * 2,
    });
  }

  /* ---------------- Partículas de profundidade ---------------- */
  const dustCount = isCoarse ? 140 : 260;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 26;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 16 - 3;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: PALETTE.sage,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  scene.add(dust);

  /* ---------------- Estado ---------------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let unlock = 0;      // 0 = travada, 1 = destravada
  let unlockTarget = 0;
  let heroH = window.innerHeight;

  const _pA = new THREE.Vector3();
  const _pB = new THREE.Vector3();
  const _tan = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);
  const _q = new THREE.Quaternion();

  function resize() {
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    heroH = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // A coluna tem ~13 unidades de altura. Recuamos a câmera o suficiente para
    // ela caber inteira na altura e, quando o elemento é estreito, um pouco
    // mais para não encostar nas laterais.
    // metade da altura da coluna (~6,7) + folga para a rotação e os processos
    const meia = 7.9;
    const zAltura = meia / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const zLargura = zAltura / Math.min(1, camera.aspect * 1.5);
    camera.position.z = Math.max(zAltura, zLargura);
    spine.position.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(mount);
  resize();

  if (!isCoarse) {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  window.addEventListener('scroll', () => {
    unlockTarget = THREE.MathUtils.clamp(window.scrollY / (heroH * 0.85), 0, 1);
  }, { passive: true });

  // pausa quando fora da viewport
  let visible = true;
  new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting; },
    { threshold: 0 }
  ).observe(mount);

  /* ---------------- Loop ---------------- */
  const clock = new THREE.Clock();
  let raf;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;

    const time = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // easing suave
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3.2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3.2);
    unlock += (unlockTarget - unlock) * Math.min(1, dt * 2.6);

    for (const s of segs) {
      // posição: interpola entre coluna curva e coluna alinhada
      curveA.getPointAt(s.t, _pA);
      curveB.getPointAt(s.t, _pB);
      const p = _pA.lerp(_pB, unlock * 0.55);

      // respiração sutil + dispersão ao destravar
      const breathe = Math.sin(time * 0.75 + s.phase) * 0.05;
      s.g.position.set(
        p.x + s.offset.x * unlock + breathe * (1 - unlock),
        p.y + s.offset.y * unlock,
        p.z + s.offset.z * unlock
      );

      // orientação: alinhada à tangente da curva
      curveA.getTangentAt(s.t, _tan);
      _q.setFromUnitVectors(_up, _tan);
      s.g.quaternion.copy(_q);
      s.g.rotateY(time * 0.12 + s.phase * 0.1);
      // giro individual ao destravar
      s.g.rotateX(s.spin.x * unlock);
      s.g.rotateZ(s.spin.z * unlock);
    }

    // a coluna inteira acompanha o ponteiro e gira devagar
    spine.rotation.y = time * 0.16 + pointer.x * 0.5;
    spine.rotation.x = -pointer.y * 0.22;
    spine.rotation.z = pointer.x * 0.06;

    dust.rotation.y = time * 0.026;
    dust.position.y = Math.sin(time * 0.25) * 0.4;

    camera.lookAt(0, unlock * -0.8, 0);

    renderer.render(scene, camera);
  }

  let running = false;
  function start() {
    if (running) return;
    running = true;
    clock.getDelta(); // descarta o intervalo acumulado enquanto pausado
    frame();
  }
  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
  }

  start();
  mount.classList.add('is-ready');

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
}
