/**
 * RGB Lighting preview system
 * Visualizes RGB zones and lighting effects on the build
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RGBZone } from "./types";

interface RGBVisualizerProps {
  zones: RGBZone[];
  visible?: boolean;
  autoPlay?: boolean;
  anchorForZone?: (zone: RGBZone) => [number, number, number];
  showGlowGeometry?: boolean;
}

// Color animation patterns
const patterns = {
  static: (
    color: string,
    intensity: number,
    _speed?: number,
    _time?: number
  ) => {
    return { color, intensity };
  },

  breathing: (
    color: string,
    intensity: number,
    speed: number,
    time: number
  ) => {
    const pulse = (Math.sin(time * speed * 2) + 1) / 2;
    return { color, intensity: intensity * pulse };
  },

  pulse: (color: string, intensity: number, speed: number, time: number) => {
    const pulse = Math.max(0, Math.sin(time * speed * 3));
    return { color, intensity: intensity * pulse };
  },

  rainbow: (_color: string, intensity: number, speed: number, time: number) => {
    const hue = (time * speed) % 360;
    return { color: `hsl(${hue}, 100%, 50%)`, intensity };
  },

  wave: (_color: string, intensity: number, speed: number, time: number) => {
    const wave = (Math.sin(time * speed * 2 + 90) + 1) / 2;
    const hue = (wave * 360) % 360;
    return { color: `hsl(${hue}, 100%, 50%)`, intensity };
  },
};

export function RGBVisualizer({
  zones,
  visible = true,
  autoPlay = true,
  anchorForZone,
  showGlowGeometry = false,
}: RGBVisualizerProps) {
  if (!visible || zones.length === 0 || !autoPlay) {
    return null;
  }

  return (
    <group>
      {zones.map((zone) => {
        const anchor = anchorForZone ? anchorForZone(zone) : [0, 0, 0];
        return (
          <ZoneLight
            key={zone.id}
            zone={zone}
            anchor={anchor as [number, number, number]}
            showGlowGeometry={showGlowGeometry}
          />
        );
      })}
    </group>
  );
}

type ZoneLightProps = {
  zone: RGBZone;
  anchor: [number, number, number];
  showGlowGeometry: boolean;
};

function ZoneLight({ zone, anchor, showGlowGeometry }: ZoneLightProps) {
  const isCaseTop = zone.componentId === "case-top";
  const pointRef = useRef<THREE.PointLight>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const patternFn =
    patterns[zone.pattern as keyof typeof patterns] || patterns.static;

  useFrame(({ clock }) => {
    const animated = patternFn(
      zone.color,
      zone.intensity,
      zone.speed,
      clock.getElapsedTime()
    );

    if (pointRef.current) {
      pointRef.current.color.set(animated.color);
      pointRef.current.intensity = animated.intensity;
    }
    if (spotRef.current) {
      spotRef.current.color.set(animated.color);
      spotRef.current.intensity = animated.intensity;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.color.set(animated.color);
      mat.emissive.set(animated.color);
      mat.emissiveIntensity = animated.intensity * 1.2;
      mat.opacity = animated.intensity * 0.25;
    }
  });

  return (
    <group position={anchor}>
      {showGlowGeometry && (
        <mesh ref={glowRef} scale={[0.3, 0.3, 0.3]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial
            color={zone.color}
            emissive={zone.color}
            emissiveIntensity={zone.intensity * 1.2}
            wireframe={false}
            transparent
            opacity={zone.intensity * 0.25}
            toneMapped={false}
          />
        </mesh>
      )}

      {isCaseTop ? (
        <spotLight
          ref={spotRef}
          position={[0, -0.04, 0]}
          color={zone.color}
          intensity={zone.intensity}
          distance={0.08}
          angle={0.18}
          penumbra={0.4}
          decay={2.2}
          target-position={[0, -0.32, 0]}
        />
      ) : (
        <pointLight
          ref={pointRef}
          position={[0, 0.03, 0]}
          color={zone.color}
          intensity={zone.intensity}
          distance={0.14}
          decay={2}
        />
      )}
    </group>
  );
}

// RGB Control Panel Component
interface RGBControlPanelProps {
  zones: RGBZone[];
  onZoneUpdate?: (zoneId: string, updates: Partial<RGBZone>) => void;
  onAllZonesUpdate?: (color: string, pattern: string) => void;
}

export function RGBControlPanel({
  zones,
  onZoneUpdate,
  onAllZonesUpdate,
}: RGBControlPanelProps) {
  return (
    <div className="space-y-4 p-4 bg-black/50 rounded-lg border border-cyan-500/20">
      <h3 className="text-sm font-semibold text-cyan-400">
        RGB Lighting Control
      </h3>

      {/* Master controls */}
      <div className="space-y-2">
        <label className="block text-xs text-gray-400">Master Color</label>
        <div className="flex gap-2">
          {["#0ea5e9", "#ef4444", "#10b981", "#f59e0b", "#a855f7"].map(
            (color) => (
              <button
                key={color}
                onClick={() => onAllZonesUpdate?.(color, "static")}
                className="w-6 h-6 rounded border-2 border-white/20 hover:border-white/50 transition-all"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
      </div>

      {/* Pattern selector */}
      <div className="space-y-2">
        <label className="block text-xs text-gray-400">Pattern</label>
        <select
          onChange={(e) => onAllZonesUpdate?.("", e.target.value)}
          className="w-full px-2 py-1 bg-slate-900 border border-cyan-500/30 text-cyan-400 rounded text-xs"
        >
          <option value="static">Static</option>
          <option value="breathing">Breathing</option>
          <option value="pulse">Pulse</option>
          <option value="rainbow">Rainbow</option>
          <option value="wave">Wave</option>
        </select>
      </div>

      {/* Individual zone controls */}
      {zones.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-cyan-500/20">
          <h4 className="text-xs text-cyan-300">Zones</h4>
          {zones.map((zone) => (
            <div key={zone.id} className="flex items-center gap-2 text-xs">
              <input
                type="color"
                value={zone.color}
                onChange={(e) =>
                  onZoneUpdate?.(zone.id, { color: e.target.value })
                }
                className="w-5 h-5 rounded cursor-pointer"
              />
              <span className="text-gray-400 flex-1">{zone.name}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={zone.intensity}
                onChange={(e) =>
                  onZoneUpdate?.(zone.id, {
                    intensity: parseFloat(e.target.value),
                  })
                }
                className="w-12"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
