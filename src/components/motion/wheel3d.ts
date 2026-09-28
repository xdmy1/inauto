// A real alloy wheel, built from geometry — no model download. Tyre and rim
// are lathes, the twin five-spoke face is extruded and dished, a brake disc
// and a red caliper sit behind the spokes (the caliper stays put while the
// wheel turns, like on a car). Studio reflections come from a procedural
// room environment, so the metal reads as metal while it rolls.
//
// Loaded lazily by RoadWheel. Renders only on demand (a roll or a tilt
// change) and only while on screen; idle cost is zero.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type WheelScene = {
  /** wheel rotation about its axle, radians (negative rolls to the right) */
  setRoll(rad: number): void;
  /** pointer position over the band, −1..1 per axis; the wheel turns toward it */
  setTilt(x: number, y: number): void;
  setActive(on: boolean): void;
  resize(size: number): void;
  dispose(): void;
};

const TAU = Math.PI * 2;

function lathe(points: [number, number][], segments = 112) {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    segments
  );
}

// tread blocks as a bump map drawn on a canvas: u runs round the tyre,
// v along the profile (sidewall → tread → sidewall)
function treadBump() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#3a3a3a";
  g.lineWidth = 5;
  g.lineCap = "round";
  const top = 30;
  const bottom = 98;
  const pitch = 1024 / 64;
  for (let i = 0; i < 64; i++) {
    const x = i * pitch;
    g.beginPath();
    g.moveTo(x, top);
    g.lineTo(x + 7, (top + bottom) / 2);
    g.lineTo(x, bottom);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function createWheel(
  canvas: HTMLCanvasElement,
  size: number,
  onLost: () => void
): WheelScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(size, size, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(1.45, 0.4, 4.0);
  camera.lookAt(0, 0, 0);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.5, 3.5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.5);
  rim.position.set(-3, 1.5, -1);
  scene.add(rim);

  const pivot = new THREE.Group();
  scene.add(pivot);
  const wheel = new THREE.Group(); // rolls
  const fixed = new THREE.Group(); // disc + caliper: tilt with the wheel, never roll
  pivot.add(wheel, fixed);

  const disposables: { dispose(): void }[] = [env];
  const keep = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  // ——— materials
  const bump = keep(treadBump());
  const rubber = keep(
    new THREE.MeshStandardMaterial({
      color: 0x17181c,
      roughness: 0.78,
      metalness: 0,
      bumpMap: bump,
      bumpScale: 0.35,
      side: THREE.DoubleSide,
    })
  );
  const alloy = keep(
    new THREE.MeshStandardMaterial({ color: 0xe2e4e9, metalness: 1, roughness: 0.2 })
  );
  const alloyBarrel = keep(
    new THREE.MeshStandardMaterial({
      color: 0x8a8d96,
      metalness: 1,
      roughness: 0.42,
      side: THREE.DoubleSide,
    })
  );
  const gunmetal = keep(
    new THREE.MeshStandardMaterial({ color: 0x2a2d36, metalness: 0.9, roughness: 0.45 })
  );
  const steel = keep(
    new THREE.MeshStandardMaterial({ color: 0x555964, metalness: 0.9, roughness: 0.55 })
  );
  const red = keep(
    new THREE.MeshStandardMaterial({ color: 0xe0192b, metalness: 0.25, roughness: 0.38 })
  );
  const white = keep(
    new THREE.MeshStandardMaterial({ color: 0xf4f5f7, metalness: 0.6, roughness: 0.3 })
  );

  // lathes revolve around Y; the wheel's axle is Z, so every lathe is turned once
  const axle = (m: THREE.Mesh) => {
    m.rotation.x = Math.PI / 2;
    return m;
  };

  // ——— tyre: bead → sidewall bulge → tread with three circumferential grooves
  const g = 0.972;
  const tyre = keep(
    lathe([
      [0.8, -0.31], [0.87, -0.31], [0.93, -0.28], [0.98, -0.23], [1, -0.18],
      [1, -0.15], [g, -0.14], [g, -0.12], [1, -0.11],
      [1, -0.02], [g, -0.01], [g, 0.01], [1, 0.02],
      [1, 0.11], [g, 0.12], [g, 0.14], [1, 0.15],
      [1, 0.18], [0.98, 0.23], [0.93, 0.28], [0.87, 0.31], [0.8, 0.31],
    ])
  );
  wheel.add(axle(new THREE.Mesh(tyre, rubber)));

  // ——— rim: barrel, bead seat and a polished lip on the face
  const barrel = keep(
    lathe([
      [0.6, -0.3], [0.6, 0.14], [0.66, 0.2], [0.74, 0.24], [0.8, 0.29],
    ])
  );
  wheel.add(axle(new THREE.Mesh(barrel, alloyBarrel)));
  const lip = keep(
    lathe([
      [0.66, 0.2], [0.74, 0.24], [0.8, 0.29], [0.84, 0.33], [0.84, 0.36],
      [0.79, 0.36], [0.72, 0.3], [0.66, 0.27],
    ], 112)
  );
  wheel.add(axle(new THREE.Mesh(lip, alloy)));
  const back = keep(lathe([[0.6, -0.3], [0.8, -0.3], [0.8, -0.24]]));
  wheel.add(axle(new THREE.Mesh(back, gunmetal)));

  // ——— twin five-spoke face, dished toward the hub
  const blade = new THREE.Shape();
  blade.moveTo(-0.06, 0.16);
  blade.lineTo(0.06, 0.16);
  blade.lineTo(0.043, 0.68);
  blade.lineTo(-0.043, 0.68);
  blade.closePath();
  const bladeGeo = keep(
    new THREE.ExtrudeGeometry(blade, {
      depth: 0.085,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
      curveSegments: 4,
    })
  );
  const dish = 0.2;
  for (let i = 0; i < 5; i++) {
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      const m = new THREE.Mesh(bladeGeo, alloy);
      m.rotation.x = dish;
      m.position.z = 0.1;
      arm.add(m);
      arm.rotation.z = (i / 5) * TAU + side * 0.125;
      wheel.add(arm);
    }
  }

  // ——— hub, lug nuts, red centre cap with a white ring
  const hubGeo = keep(new THREE.CylinderGeometry(0.21, 0.2, 0.16, 48));
  const hub = axle(new THREE.Mesh(hubGeo, alloy));
  hub.position.z = 0.165;
  wheel.add(hub);
  const nutGeo = keep(new THREE.CylinderGeometry(0.026, 0.026, 0.035, 6));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + Math.PI / 5;
    const nut = axle(new THREE.Mesh(nutGeo, gunmetal));
    nut.position.set(Math.cos(a) * 0.135, Math.sin(a) * 0.135, 0.255);
    wheel.add(nut);
  }
  const capGeo = keep(new THREE.CylinderGeometry(0.075, 0.075, 0.024, 48));
  const cap = axle(new THREE.Mesh(capGeo, red));
  cap.position.z = 0.256;
  wheel.add(cap);
  const ringGeo = keep(new THREE.TorusGeometry(0.078, 0.006, 12, 64));
  const ring = new THREE.Mesh(ringGeo, white);
  ring.position.z = 0.268;
  wheel.add(ring);

  // ——— brake disc and caliper, seen through the spokes
  const discGeo = keep(new THREE.CylinderGeometry(0.57, 0.57, 0.03, 72));
  const disc = axle(new THREE.Mesh(discGeo, steel));
  disc.position.z = 0.0;
  fixed.add(disc);
  const hatGeo = keep(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 48));
  const hat = axle(new THREE.Mesh(hatGeo, gunmetal));
  hat.position.z = 0.04;
  fixed.add(hat);
  const cal = new THREE.Shape();
  const a0 = 1.65;
  const a1 = 2.45;
  const r0 = 0.41;
  const r1 = 0.6;
  cal.absarc(0, 0, r1, a0, a1, false);
  cal.absarc(0, 0, r0, a1, a0, true);
  cal.closePath();
  const calGeo = keep(
    new THREE.ExtrudeGeometry(cal, {
      depth: 0.13,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 16,
    })
  );
  const caliper = new THREE.Mesh(calGeo, red);
  caliper.position.z = -0.05;
  fixed.add(caliper);

  // ——— run
  let active = false;
  let raf = 0;
  const tiltTarget = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };

  const render = () => renderer.render(scene, camera);

  const frame = () => {
    raf = 0;
    if (!active) return;
    const dx = tiltTarget.x - tilt.x;
    const dy = tiltTarget.y - tilt.y;
    if (Math.abs(dx) < 0.002 && Math.abs(dy) < 0.002) {
      tilt.x = tiltTarget.x;
      tilt.y = tiltTarget.y;
    } else {
      tilt.x += dx * 0.1;
      tilt.y += dy * 0.1;
      raf = requestAnimationFrame(frame);
    }
    pivot.rotation.set(tilt.y * 0.12, tilt.x * 0.32, 0);
    render();
  };

  const lost = (e: Event) => {
    e.preventDefault();
    active = false;
    onLost();
  };
  canvas.addEventListener("webglcontextlost", lost);

  return {
    setRoll(rad) {
      wheel.rotation.z = rad;
      if (active) render();
    },
    setTilt(x, y) {
      tiltTarget.x = Math.max(-1, Math.min(1, x));
      tiltTarget.y = Math.max(-1, Math.min(1, y));
      if (active && !raf) raf = requestAnimationFrame(frame);
    },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) render();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    resize(next) {
      renderer.setSize(next, next, false);
      if (active) render();
    },
    dispose() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", lost);
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}
