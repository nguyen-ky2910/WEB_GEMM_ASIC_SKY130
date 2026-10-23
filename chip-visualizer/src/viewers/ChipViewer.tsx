/* eslint-disable react-hooks/immutability -- Three.js cameras and projected DOM label refs are intentionally mutable inside useFrame, outside React render. */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Line,
} from "@react-three/drei";
import { useRef, useLayoutEffect, useMemo, useEffect, Component } from "react";
import type { ReactNode, ElementRef } from "react";
import * as THREE from "three";
import type { Geometry, Macro } from "../types/data";
import type { ViewSettings } from "../app/settings";
import { useI18n } from "../i18n/I18n";
export type CameraCommand = {
  view: "top" | "front" | "side" | "isometric" | "fit" | "focus";
  id: number;
};
type Props = {
  geometry: Geometry;
  settings: ViewSettings;
  selected: string | null;
  onSelect: (id: string | null) => void;
  command: CameraCommand;
  active: boolean;
  captureRef: { current: (() => void) | null };
  stage?: number;
};
const colors: Record<string, string> = {
  row: "#3ec9b6",
  sram: "#3d7cbb",
  axi: "#c79456",
  pe: "#3ec9b6",
  macro: "#9b80d2",
};
const dummy = new THREE.Object3D();
function normalized(m: Macro, g: Geometry) {
  return {
    x: (m.x - g.origin[0] + m.w / 2 - g.die[0] / 2) / 1000,
    y: (m.y - g.origin[1] + m.h / 2 - g.die[1] / 2) / 1000,
    w: m.w / 1000,
    h: m.h / 1000,
  };
}
function height(m: Macro, explode: number) {
  return (
    0.07 +
    explode *
      (m.type === "row" || m.type === "pe"
        ? 0.62
        : m.type === "axi"
          ? 0.4
          : 0.22)
  );
}
function Instances({
  geometry,
  settings,
  selected,
  onSelect,
  stage = 9,
}: Pick<Props, "geometry" | "settings" | "selected" | "onSelect" | "stage">) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const macros = useMemo(
    () =>
      geometry.macros.filter(
        (m) =>
          (!settings.isolate || !selected || m.id === selected) &&
          (m.type === "row"
            ? settings.rows
            : m.type === "sram"
              ? settings.sram
              : m.type === "axi"
                ? settings.axi
                : true),
      ),
    [
      geometry,
      settings.isolate,
      settings.rows,
      settings.sram,
      settings.axi,
      selected,
    ],
  );
  const planes = useMemo(
    () => [
      new THREE.Plane(
        new THREE.Vector3(-1, 0, 0),
        (geometry.die[0] / 1000) * 0.12,
      ),
    ],
    [geometry],
  );
  useLayoutEffect(() => {
    if (!ref.current) return;
    macros.forEach((m, i) => {
      const p = normalized(m, geometry);
      dummy.position.set(p.x, p.y, height(m, settings.explode));
      dummy.scale.set(
        p.w,
        p.h,
        m.type === "row" ? 0.12 : m.type === "pe" ? 0.08 : 0.18,
      );
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
      const activePE =
        m.type === "pe" &&
        (Math.floor(i / 32) + (i % 32)) % 32 ===
          Math.floor(settings.progress * 64) % 32;
      const color = new THREE.Color(
        m.id === selected
          ? "#ffd17c"
          : activePE
            ? "#e7d38a"
            : (colors[m.type] ?? "#8d78bf"),
      );
      if (stage === 0) color.multiplyScalar(0.6);
      ref.current!.setColorAt(i, color);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [geometry, macros, selected, settings.explode, settings.progress, stage]);
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined) onSelect(macros[e.instanceId].id);
  };
  return (
    <instancedMesh
      key={macros.length}
      ref={ref}
      args={[undefined, undefined, macros.length]}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <boxGeometry />
      <meshStandardMaterial
        clippingPlanes={settings.section ? planes : undefined}
        metalness={0.52}
        roughness={0.4}
        transparent
        opacity={settings.xray ? 0.28 : settings.opacity}
        wireframe={settings.wireframe}
      />
    </instancedMesh>
  );
}
function MacroAccents({
  geometry,
  settings,
}: {
  geometry: Geometry;
  settings: ViewSettings;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const accents = useMemo(
    () =>
      geometry.macros
        .filter(
          (m) =>
            (m.type === "row" && settings.rows) ||
            (m.type === "sram" && settings.sram),
        )
        .flatMap((m) =>
          Array.from({ length: m.type === "row" ? 8 : 4 }, (_, i) => ({
            m,
            i,
          })),
        ),
    [geometry, settings.rows, settings.sram],
  );
  const planes = useMemo(
    () => [
      new THREE.Plane(
        new THREE.Vector3(-1, 0, 0),
        (geometry.die[0] / 1000) * 0.12,
      ),
    ],
    [geometry],
  );
  useLayoutEffect(() => {
    if (!ref.current) return;
    accents.forEach(({ m, i }, index) => {
      const p = normalized(m, geometry);
      const row = m.type === "row";
      dummy.position.set(
        p.x - p.w / 2 + (p.w * (i + 1)) / (row ? 9 : 5),
        p.y,
        height(m, settings.explode) + (row ? 0.062 : 0.092),
      );
      dummy.scale.set(row ? 0.006 : 0.009, p.h * 0.86, 0.004);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(index, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [accents, geometry, settings.explode]);
  if (settings.isolate) return null;
  return (
    <instancedMesh
      key={accents.length}
      ref={ref}
      args={[undefined, undefined, accents.length]}
    >
      <boxGeometry />
      <meshBasicMaterial
        clippingPlanes={settings.section ? planes : undefined}
        color="#a6d7e3"
        transparent
        opacity={settings.xray ? 0.1 : 0.27}
      />
    </instancedMesh>
  );
}
function Overlays({
  geometry,
  settings,
}: {
  geometry: Geometry;
  settings: ViewSettings;
}) {
  const w = geometry.die[0] / 1000,
    h = geometry.die[1] / 1000;
  const powerZ = 0.5 + settings.explode * 1.3,
    clockZ = 0.7 + settings.explode * 1.8;
  return (
    <>
      {settings.power &&
        Array.from({ length: 13 }, (_, i) => (
          <Line
            key={`p${i}`}
            points={[
              [-w / 2 + 0.15, -h / 2 + ((i + 1) * h) / 14, powerZ],
              [w / 2 - 0.15, -h / 2 + ((i + 1) * h) / 14, powerZ],
            ]}
            color={i % 2 ? "#dca75c" : "#a17646"}
            lineWidth={1.4}
            transparent
            opacity={settings.opacity * 0.7}
          />
        ))}
      {settings.power &&
        Array.from({ length: 8 }, (_, i) => (
          <Line
            key={`v${i}`}
            points={[
              [-w / 2 + ((i + 1) * w) / 9, -h / 2 + 0.2, powerZ],
              [-w / 2 + ((i + 1) * w) / 9, h / 2 - 0.2, powerZ],
            ]}
            color="#b48b52"
            lineWidth={0.8}
            transparent
            opacity={0.5}
          />
        ))}
      {settings.clock && (
        <>
          <Line
            points={[
              [0, -h / 2, clockZ],
              [0, h / 2 - 0.3, clockZ],
            ]}
            color="#f8c565"
            lineWidth={2}
          />
          {Array.from({ length: 8 }, (_, i) => (
            <Line
              key={i}
              points={[
                [-w / 2 + 0.3, -h / 2 + ((i + 1) * h) / 9, clockZ],
                [w / 2 - 0.3, -h / 2 + ((i + 1) * h) / 9, clockZ],
              ]}
              color="#f8c565"
              lineWidth={1}
              dashed
              dashSize={0.08}
              gapSize={0.03}
            />
          ))}
        </>
      )}
      {settings.routes &&
        Array.from({ length: 7 }, (_, i) => (
          <Line
            key={i}
            points={[
              [-w / 2 + 0.5, -h / 2 + 0.5 + i * 0.7, 0.35 + settings.explode],
              [-0.6, -h / 2 + 0.5 + i * 0.7, 0.35 + settings.explode],
              [-0.6, h / 2 - 0.5 - i * 0.25, 0.35 + settings.explode],
              [w / 2 - 0.3, h / 2 - 0.5 - i * 0.25, 0.35 + settings.explode],
            ]}
            color="#69b6d3"
            transparent
            opacity={0.45}
            lineWidth={0.8}
          />
        ))}
      {settings.metal &&
        [0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[0, 0, 0.5 + i * (0.16 + settings.explode * 0.6)]}
          >
            <boxGeometry args={[w * 0.96, h * 0.96, 0.012]} />
            <meshStandardMaterial
              color={["#6acbd4", "#bbab76", "#9d84c7"][i]}
              transparent
              opacity={settings.opacity * 0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}
      {settings.pins &&
        Array.from({ length: 30 }, (_, i) => (
          <mesh
            key={i}
            position={[
              -w / 2 - 0.04,
              -h / 2 + 0.3 + (i * (h - 0.6)) / 30,
              0.03,
            ]}
          >
            <boxGeometry args={[0.12, 0.05, 0.04]} />
            <meshStandardMaterial
              color="#d4bb85"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        ))}
    </>
  );
}
function labelCandidates(
  geometry: Geometry,
  settings: ViewSettings,
  selected: string | null,
) {
  const candidates = geometry.macros.filter(
    (m, i) =>
      m.id === selected ||
      (settings.labels &&
        (i === 0 || i === 32 || i === 56 || i === 80 || m.type === "axi")) ||
      (settings.peIDs &&
        (m.type === "row" || m.type === "pe") &&
        i % (geometry.kind === "DEMO" ? 64 : 4) === 0) ||
      (settings.sramIDs && m.type === "sram" && i % 8 === 0),
  );
  return candidates
    .slice(0, 26)
    .filter(
      (m) =>
        (!settings.isolate || !selected || m.id === selected) &&
        (m.type === "row"
          ? settings.rows
          : m.type === "sram"
            ? settings.sram
            : m.type === "axi"
              ? settings.axi
              : true),
    );
}
function Labels({
  geometry,
  settings,
  selected,
  elements,
}: {
  geometry: Geometry;
  settings: ViewSettings;
  selected: string | null;
  elements: { current: Record<string, HTMLDivElement> };
}) {
  const { camera, size } = useThree();
  useFrame(() => {
    for (const m of labelCandidates(geometry, settings, selected)) {
      const element = elements.current[m.id];
      if (!element) continue;
      const p = normalized(m, geometry);
      const projected = new THREE.Vector3(
        p.x,
        p.y,
        height(m, settings.explode) + 0.2,
      ).project(camera);
      element.style.transform = `translate(${((projected.x + 1) / 2) * size.width}px,${((-projected.y + 1) / 2) * size.height}px) translate(-50%,-50%)`;
      element.style.display =
        projected.z > 1 ||
        Math.abs(projected.x) > 0.97 ||
        Math.abs(projected.y) > 0.94
          ? "none"
          : "block";
    }
  });
  return null;
}
function CameraRig({
  command,
  geometry,
  selected,
  settings,
  active,
  captureRef,
}: Omit<Props, "onSelect">) {
  const { camera, gl, scene, size } = useThree();
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const transition = useRef<{
    position: THREE.Vector3;
    target: THREE.Vector3;
    zoom?: number;
  } | null>(null);
  useEffect(() => {
    const scale = Math.max(...geometry.die) / 10494;
    const targets: Record<CameraCommand["view"], [number, number, number]> = {
      top: [0, -0.01, 17],
      front: [0, -16, 1],
      side: [16, 0, 2],
      isometric: [7, -10, 11],
      fit: [7, -10, 11],
      focus: [3, -4, 5],
    };
    const target = new THREE.Vector3();
    const position = new THREE.Vector3(...targets[command.view]).multiplyScalar(
      scale,
    );
    if (command.view !== "focus" && camera instanceof THREE.PerspectiveCamera) {
      const testCamera = new THREE.PerspectiveCamera(
        camera.fov,
        size.width / Math.max(1, size.height),
        0.1,
        200,
      );
      testCamera.up.set(0, 0, 1);
      const direction = position.clone().normalize();
      let distance = 8 * scale;
      const corners = [-1, 1].flatMap((x) =>
        [-1, 1].flatMap((y) =>
          [-0.5, 1 + settings.explode * 2].map(
            (z) =>
              new THREE.Vector3(
                (x * geometry.die[0]) / 2000,
                (y * geometry.die[1]) / 2000,
                z,
              ),
          ),
        ),
      );
      for (let i = 0; i < 90; i++) {
        testCamera.position.copy(direction.clone().multiplyScalar(distance));
        testCamera.lookAt(target);
        testCamera.updateMatrixWorld();
        if (
          corners.every((c) => {
            const v = c.clone().project(testCamera);
            return Math.abs(v.x) < 0.83 && v.y > -0.74 && v.y < 0.65;
          })
        )
          break;
        distance *= 1.045;
      }
      position.copy(direction.multiplyScalar(distance));
    }
    if (command.view === "focus" && selected) {
      const m = geometry.macros.find((m) => m.id === selected);
      if (m) {
        const p = normalized(m, geometry);
        target.set(p.x, p.y, height(m, settings.explode));
        const distance = Math.max(p.w, p.h, 0.5) * 1.4;
        position.set(p.x + distance, p.y - distance, p.w + distance + 2);
      }
    }
    let zoom: number | undefined;
    if (camera instanceof THREE.OrthographicCamera) {
      const direction = target.clone().sub(position).normalize(),
        right = direction
          .clone()
          .cross(new THREE.Vector3(0, 0, 1))
          .normalize(),
        up = right.clone().cross(direction).normalize();
      const selectedMacro =
        command.view === "focus"
          ? geometry.macros.find((m) => m.id === selected)
          : undefined;
      const width = selectedMacro
          ? selectedMacro.w / 1000
          : geometry.die[0] / 1000,
        depth = selectedMacro ? selectedMacro.h / 1000 : geometry.die[1] / 1000;
      const corners = [-1, 1].flatMap((x) =>
        [-1, 1].flatMap((y) =>
          [-0.3, 1 + settings.explode].map(
            (z) => new THREE.Vector3((x * width) / 2, (y * depth) / 2, z),
          ),
        ),
      );
      const xs = corners.map((c) => c.dot(right)),
        ys = corners.map((c) => c.dot(up));
      zoom = Math.min(
        (size.width * 0.82) / Math.max(0.1, Math.max(...xs) - Math.min(...xs)),
        (size.height * 0.67) / Math.max(0.1, Math.max(...ys) - Math.min(...ys)),
      );
    }
    transition.current = { position, target, zoom };
    // Camera commands are explicit; changing a selection must not move the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command.id, geometry, camera.uuid]);
  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera);
      const a = document.createElement("a");
      a.download = "gemm32-chip.png";
      a.href = gl.domElement.toDataURL("image/png");
      a.click();
    };
    return () => {
      captureRef.current = null;
    };
  }, [camera, captureRef, gl, scene]);
  useFrame(() => {
    if (!active) return;
    if (transition.current && controls.current) {
      camera.position.lerp(transition.current.position, 0.13);
      if (transition.current.zoom !== undefined) {
        camera.zoom = THREE.MathUtils.lerp(
          camera.zoom,
          transition.current.zoom,
          0.13,
        );
        camera.updateProjectionMatrix();
      }
      controls.current.target.lerp(transition.current.target, 0.13);
      controls.current.update();
      if (camera.position.distanceTo(transition.current.position) < 0.01)
        transition.current = null;
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={active}
      enableDamping
      dampingFactor={0.1}
      autoRotate={active && settings.autoRotate}
      autoRotateSpeed={settings.rotateSpeed}
      minDistance={1.5}
      maxDistance={55}
      maxPolarAngle={Math.PI * 0.94}
      onStart={() => {
        transition.current = null;
      }}
    />
  );
}
function Scene(
  props: Props & { labelElements: { current: Record<string, HTMLDivElement> } },
) {
  const { geometry, settings } = props;
  const w = geometry.die[0] / 1000,
    h = geometry.die[1] / 1000;
  const frame: [number, number, number][] = [
    [-w / 2, -h / 2, -0.01],
    [w / 2, -h / 2, -0.01],
    [w / 2, h / 2, -0.01],
    [-w / 2, h / 2, -0.01],
    [-w / 2, -h / 2, -0.01],
  ];
  const grid = useMemo(() => {
    const points: number[] = [];
    for (let i = -15; i <= 15; i++) {
      points.push(-15, i, -0.52, 15, i, -0.52, i, -15, -0.52, i, 15, -0.52);
    }
    return new Float32Array(points);
  }, []);
  return (
    <>
      {settings.projection === "orthographic" ? (
        <OrthographicCamera
          makeDefault
          position={[7, -10, 11]}
          up={[0, 0, 1]}
          zoom={42}
          near={0.1}
          far={200}
        />
      ) : (
        <PerspectiveCamera
          makeDefault
          position={[7, -10, 11]}
          up={[0, 0, 1]}
          fov={40}
          near={0.1}
          far={200}
        />
      )}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[4, -7, 14]}
        intensity={2.1}
        color="#b9deff"
      />
      <directionalLight position={[-6, 6, 8]} intensity={1.2} color="#67bbbd" />
      <pointLight position={[5, 4, 7]} intensity={25} color="#eba55a" />
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[grid, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#253140" transparent opacity={0.45} />
      </lineSegments>
      {settings.substrate && (
        <mesh position={[0, 0, -0.25]}>
          <boxGeometry args={[w + 0.24, h + 0.24, 0.42]} />
          <meshStandardMaterial
            clippingPlanes={
              settings.section
                ? [new THREE.Plane(new THREE.Vector3(-1, 0, 0), w * 0.12)]
                : undefined
            }
            color="#1e2c3b"
            metalness={0.7}
            roughness={0.4}
            transparent
            opacity={settings.xray ? 0.18 : 1}
            wireframe={settings.wireframe}
          />
        </mesh>
      )}
      <Line points={frame} color="#6b899c" lineWidth={1} />
      {geometry.kind === "RECONSTRUCTED" && (
        <Line
          points={frame.map(
            ([x, y, z]) =>
              [
                x - Math.sign(x) * 0.00552,
                y - Math.sign(y) * 0.01088,
                z + 0.015,
              ] as [number, number, number],
          )}
          color="#47726f"
          lineWidth={0.6}
          dashed
          dashSize={0.06}
          gapSize={0.04}
        />
      )}
      <Instances {...props} />
      <MacroAccents geometry={geometry} settings={settings} />
      <Overlays geometry={geometry} settings={settings} />
      <Labels
        geometry={geometry}
        settings={settings}
        selected={props.selected}
        elements={props.labelElements}
      />
      <CameraRig {...props} />
    </>
  );
}
class WebGLBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export default function ChipViewer(props: Props) {
  const { t } = useI18n();
  const labelElements = useRef<Record<string, HTMLDivElement>>({});
  return (
    <WebGLBoundary fallback={<div className="empty-state">{t("noWebGL")}</div>}>
      <div className="webgl-host">
        <Canvas
          aria-label="Interactive 3D GEMM32 chip"
          dpr={
            props.settings.quality === "low"
              ? 1
              : props.settings.quality === "high"
                ? [1, 2]
                : [1, 1.5]
          }
          frameloop={props.active ? "always" : "never"}
          gl={{
            antialias: props.settings.quality !== "low",
            preserveDrawingBuffer: true,
            alpha: true,
            powerPreference: "high-performance",
            localClippingEnabled: true,
          }}
          onPointerMissed={() => props.onSelect(null)}
        >
          <Scene {...props} labelElements={labelElements} />
        </Canvas>
        <div className="projected-labels">
          {labelCandidates(props.geometry, props.settings, props.selected).map(
            (m) => (
              <div
                key={m.id}
                className={`chip-label ${props.selected === m.id ? "selected" : ""}`}
                ref={(node) => {
                  if (node) labelElements.current[m.id] = node;
                  else delete labelElements.current[m.id];
                }}
              >
                {m.name}
              </div>
            ),
          )}
        </div>
      </div>
    </WebGLBoundary>
  );
}
