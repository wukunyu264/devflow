import * as THREE from "three";

export type UniverseEngine = {
  setActive: (active: boolean) => void;
  dispose: () => void;
};

export function createUniverse(
  host: HTMLElement,
  onContextLost?: () => void,
): UniverseEngine | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  const compact = window.matchMedia("(max-width: 800px)").matches;
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, compact ? 1.25 : 1.75),
  );
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.dataset.universeCanvas = "true";
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.z = 8.6;
  const world = new THREE.Group();
  world.rotation.z = -0.18;
  scene.add(world);
  const globe = new THREE.Group();
  world.add(globe);
  const resources: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(value: T): T => {
    resources.push(value);
    return value;
  };
  const wire = track(
    new THREE.LineBasicMaterial({
      color: 0xa9ceff,
      transparent: true,
      opacity: 0.23,
    }),
  );
  const bright = track(
    new THREE.LineBasicMaterial({
      color: 0xb9f4e2,
      transparent: true,
      opacity: 0.5,
    }),
  );
  function path(
    points: THREE.Vector3[],
    material: THREE.LineBasicMaterial,
    parent = globe,
  ) {
    const geometry = track(new THREE.BufferGeometry().setFromPoints(points));
    const line = new THREE.LineLoop(geometry, material);
    parent.add(line);
    return line;
  }
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const angle = THREE.MathUtils.degToRad(latitude);
    const r = 1.72 * Math.cos(angle),
      y = 1.72 * Math.sin(angle);
    path(
      Array.from({ length: 96 }, (_, i) => {
        const t = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
      }),
      wire,
    );
  }
  for (let longitude = 0; longitude < 180; longitude += 22.5) {
    const angle = THREE.MathUtils.degToRad(longitude);
    path(
      Array.from({ length: 96 }, (_, i) => {
        const t = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(
          Math.sin(t) * Math.cos(angle) * 1.72,
          Math.cos(t) * 1.72,
          Math.sin(t) * Math.sin(angle) * 1.72,
        );
      }),
      wire,
    );
  }
  const count = compact ? 72 : 120;
  const points = Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y),
      angle = i * Math.PI * (3 - Math.sqrt(5));
    return new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r,
    ).multiplyScalar(1.73);
  });
  const dots = new THREE.Points(
    track(new THREE.BufferGeometry().setFromPoints(points)),
    track(
      new THREE.PointsMaterial({
        color: 0xc9f9ed,
        size: 0.032,
        transparent: true,
        opacity: 0.85,
      }),
    ),
  );
  globe.add(dots);
  const lines: THREE.Vector3[] = [];
  for (let i = 0; i < points.length; i += 4) {
    for (let j = i + 1; j < Math.min(i + 12, points.length); j++) {
      const distance = points[i].distanceTo(points[j]);
      if (distance < 0.9) lines.push(points[i], points[j]);
    }
  }
  globe.add(
    new THREE.LineSegments(
      track(new THREE.BufferGeometry().setFromPoints(lines)),
      wire,
    ),
  );
  const sphere = new THREE.Mesh(
    track(new THREE.SphereGeometry(1.69, 32, 24)),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x5c8de0,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
      }),
    ),
  );
  globe.add(sphere);
  const orbit = path(
    Array.from({ length: 128 }, (_, i) => {
      const t = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(t) * 2.6, Math.sin(t) * 2.6, 0);
    }),
    bright,
    world,
  );
  orbit.rotation.x = 1.05;
  orbit.rotation.y = -0.3;
  const secondOrbit = orbit.clone();
  secondOrbit.rotation.set(0.8, 0.5, 1.1);
  secondOrbit.scale.setScalar(0.89);
  world.add(secondOrbit);
  const particle = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.055, 12, 8)),
    track(new THREE.MeshBasicMaterial({ color: 0xc2f6e7 })),
  );
  orbit.add(particle);
  const starGeometry = track(
    new THREE.BufferGeometry().setFromPoints(
      Array.from(
        { length: compact ? 28 : 56 },
        (_, i) =>
          new THREE.Vector3(
            Math.sin(i * 12.9898) * 3.8,
            Math.cos(i * 7.233) * 2.9,
            -1.2 - (i % 4) * 0.2,
          ),
      ),
    ),
  );
  scene.add(
    new THREE.Points(
      starGeometry,
      track(
        new THREE.PointsMaterial({
          color: 0xbdd9ff,
          size: 0.016,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    ),
  );

  let contextLost = false;
  let active = false,
    disposed = false,
    frame = 0,
    last = 0,
    elapsed = 0;
  let targetX = 0,
    targetY = 0;
  const render = () => {
    if (!disposed && !contextLost) renderer.render(scene, camera);
  };
  const resize = () => {
    if (disposed) return;
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !active) return;
    const bounds = host.getBoundingClientRect();
    targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.25;
    targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.15;
  };
  const leave = () => {
    targetX = 0;
    targetY = 0;
  };
  host.addEventListener("pointermove", pointer, { passive: true });
  host.addEventListener("pointerleave", leave);
  const tick = (time: number) => {
    if (!active || disposed) return;
    frame = requestAnimationFrame(tick);
    if (time - last < (compact ? 40 : 30)) return;
    const delta = last ? Math.min((time - last) / 1000, 0.06) : 0;
    last = time;
    elapsed += delta;
    globe.rotation.y += delta * 0.065;
    world.rotation.x += (targetX - world.rotation.x) * 0.035;
    world.rotation.y += (targetY - world.rotation.y) * 0.035;
    particle.position.set(
      Math.cos(elapsed * 0.28) * 2.6,
      Math.sin(elapsed * 0.28) * 2.6,
      0,
    );
    render();
  };
  const setActive = (value: boolean) => {
    if (disposed || contextLost || active === value) return;
    active = value;
    renderer.domElement.dataset.motion = active ? "running" : "paused";
    if (active) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      render();
    }
  };
  resize();
  renderer.domElement.dataset.motion = "paused";
  const lost = (event: Event) => {
    event.preventDefault();
    setActive(false);
    contextLost = true;
    onContextLost?.();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    setActive,
    dispose() {
      disposed = true;
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", pointer);
      host.removeEventListener("pointerleave", leave);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      for (const resource of resources) resource.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
