/**
 * RGB Lighting preview system
 * Visualizes RGB zones and lighting effects on the build
 */

import { useState, useEffect } from "react";
import { RGBZone } from "./types";

interface RGBVisualizerProps {
  zones: RGBZone[];
  visible?: boolean;
  autoPlay?: boolean;
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
}: RGBVisualizerProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!autoPlay || !visible) return;

    const interval = setInterval(() => {
      setTime((t) => t + 0.016); // ~60fps
    }, 16);

    return () => clearInterval(interval);
  }, [autoPlay, visible]);

  if (!visible || zones.length === 0) {
    return null;
  }

  return (
    <group>
      {zones.map((zone) => {
        // Get the current color/intensity based on pattern
        const patternFn =
          patterns[zone.pattern as keyof typeof patterns] || patterns.static;
        const animated = patternFn(
          zone.color,
          zone.intensity,
          zone.speed,
          time
        );

        return (
          <group key={zone.id}>
            {/* RGB glow effect around component */}
            <mesh scale={[1.15, 1.15, 1.15]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial
                color={animated.color}
                emissive={animated.color}
                emissiveIntensity={animated.intensity * 2}
                wireframe={false}
                transparent
                opacity={animated.intensity * 0.6}
              />
            </mesh>

            {/* Accent light */}
            <pointLight
              position={[0, 0.05, 0]}
              color={animated.color}
              intensity={animated.intensity}
              distance={0.3}
            />
          </group>
        );
      })}
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
