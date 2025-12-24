/**
 * Interactive 3D PC Builder Visualization
 * Main component for real-time 3D visualization of custom PC builds
 *
 * Features:
 * - Real-time component positioning
 * - Interactive camera controls (rotate, zoom, pan)
 * - Explode view animation
 * - Cable routing visualization
 * - RGB lighting preview with animations
 * - 360° export functionality
 * - Component highlighting and information
 */

import { useState, useCallback, useMemo, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Html,
  useProgress,
  Sparkles,
  Stars,
} from "@react-three/drei";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Smartphone,
  Eye,
  Box,
  X,
  Download,
  Zap,
  Wifi,
} from "lucide-react";
import {
  Interactive3DBuilderProps,
  SelectedComponents,
  BuilderViewMode,
  RGBZone,
  CableRoute,
} from "./types";
import { GPUGLTFModel } from "./models/GPUGLTFModel";
import { PCCaseGLTFModel } from "./models/PCCaseGLTFModel";
import { MotherboardGLTFModel } from "./models/MotherboardGLTFModel";
import { PSUGLTFModel } from "./models/PSUGLTFModel";
import { AIOPumpGLTFModel } from "./models/AIOPumpGLTFModel";
import { AIORadiatorGLTFModel } from "./models/AIORadiatorGLTFModel";
import { AIOFanGLTFModel } from "./models/AIOFanGLTFModel";
import { CableVisualizer } from "./CableVisualizer";
import { RGBVisualizer, RGBControlPanel } from "./RGBVisualizer";
import { getDefaultComponentPositions } from "./utils";
import { RAMTexturedModel } from "./models/RAMTexturedModel";

// Loading component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-black/80 backdrop-blur-sm border border-sky-500/30 rounded-xl p-6">
        <Box className="w-12 h-12 text-sky-400 animate-spin" />
        <div className="text-white font-semibold">{progress.toFixed(0)}%</div>
        <div className="text-gray-400 text-sm">Building 3D Scene...</div>
      </div>
    </Html>
  );
}

// Scene content component
interface SceneContentProps {
  components: SelectedComponents;
  viewMode: BuilderViewMode;
  selectedComponent: string | null;
  hoveredComponent: string | null;
  onComponentClick: (componentId: string) => void;
  onComponentHover: (componentId: string | null) => void;
  cables: CableRoute[];
  rgbZones: RGBZone[];
  explosionAmount: number;
}

function SceneContent({
  components,
  viewMode,
  selectedComponent,
  hoveredComponent,
  onComponentClick,
  onComponentHover,
  cables,
  rgbZones,
  explosionAmount,
}: SceneContentProps) {
  // Get default positions for snapping components into place
  const defaultPositions = useMemo(
    () => getDefaultComponentPositions("mid-tower"),
    []
  );

  const coolerScale: [number, number, number] = useMemo(() => {
    if (!components.cooler?.scale) {
      return [0.95, 0.95, 0.95];
    }
    return [
      (components.cooler.scale[0] ?? 1) * 0.95,
      (components.cooler.scale[1] ?? 1) * 0.95,
      (components.cooler.scale[2] ?? 1) * 0.95,
    ];
  }, [components.cooler?.scale]);

  return (
    <>
      {/* Camera - positioned for optimal viewing of mid-tower case */}
      <PerspectiveCamera makeDefault position={[0.25, 0.15, 0.35]} fov={45} />
      <OrbitControls
        autoRotate={viewMode.autoRotate}
        autoRotateSpeed={0.75}
        enableZoom
        enablePan
        minDistance={0.25}
        maxDistance={2.0}
        target={[0, 0.25, 0]}
      />
      {/* Cooler scale is now computed above */}

      {/* Futuristic space backdrop */}
      <Stars
        radius={8}
        depth={6}
        count={2500}
        factor={0.25}
        saturation={0}
        fade
        speed={0.6}
      />

      {/* Sparse sparkles only; removed all panels/wisps to keep open space */}
      <Sparkles
        count={120}
        scale={[12, 10, 8]}
        size={2}
        speed={0.1}
        opacity={0.28}
        color="#38bdf8"
        position={[0, 0.6, -1.8]}
      />

      {/* Removed floor and grid for pure space scene */}

      {/* Dark environment with custom lighting */}
      <Environment preset="night" background={false} />

      {/* Atmospheric fog */}
      <fog attach="fog" args={["#020617", 1, 5]} />

      {/* Professional lighting setup with focal lights */}
      <ambientLight intensity={0.78} />

      {/* Main key light with enhanced shadows */}
      <directionalLight
        position={[0.4, 0.6, 0.3]}
        intensity={1.625}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={3}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
      />

      {/* Fill light */}
      <directionalLight
        position={[-0.3, 0.4, 0.2]}
        intensity={1.3}
        color="#a0d8ff"
      />

      {/* Rim light from behind for depth */}
      <directionalLight
        position={[0, 0.3, -0.5]}
        intensity={1.17}
        color="#06b6d4"
      />

      {/* Additional side lights for component visibility */}
      <directionalLight
        position={[0.5, 0.2, 0]}
        intensity={0.975}
        color="#ffffff"
      />
      <directionalLight
        position={[-0.5, 0.2, 0]}
        intensity={0.975}
        color="#ffffff"
      />

      {/* Accent point lights */}
      <pointLight
        position={[0.15, 0.2, 0.25]}
        intensity={0.15}
        color="#0ea5e9"
        distance={2}
      />
      <pointLight
        position={[-0.15, 0.25, -0.15]}
        intensity={0.12}
        color="#06b6d4"
        distance={1.5}
      />
      <pointLight
        position={[0, 0.2, 0.4]}
        intensity={0.2}
        color="#0ea5e9"
        distance={2.5}
      />
      <pointLight
        position={[0.2, 0.1, -0.2]}
        intensity={0.12}
        color="#ffffff"
        distance={2}
      />
      <pointLight
        position={[-0.2, 0.3, 0.1]}
        intensity={0.1}
        color="#38bdf8"
        distance={2}
      />

      {/* Enhanced top-down lights for component detail */}
      <spotLight
        position={[0, 0.8, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.15}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[0.3, 0.6, 0.2]}
        angle={0.5}
        penumbra={0.4}
        intensity={0.12}
        color="#0ea5e9"
      />
      <spotLight
        position={[-0.3, 0.6, -0.2]}
        angle={0.5}
        penumbra={0.4}
        intensity={0.12}
        color="#06b6d4"
      />

      {/* No contact shadows—floating in space */}

      {/* Subtle particle sparkles for atmosphere */}
      <Sparkles
        count={30}
        scale={1.5}
        size={1.5}
        speed={0.3}
        opacity={0.3}
        color="#0ea5e9"
      />

      {/* Motherboard - Base platform */}
      <MotherboardGLTFModel
        position={[-0.08, 0.13, -0.06]}
        scale={[0.008, 0.008, 0.008]}
        rotation={[0, 0, 0]}
        isSelected={false}
      />

      {/* CPU - Detailed processor with logo and gold backing */}
      <group position={[-0.065, 0.325, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Gold substrate/backing */}
        <mesh position={[0, -0.0005, 0]}>
          <boxGeometry args={[0.042, 0.001, 0.042]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.95}
            roughness={0.15}
            emissive="#8b7355"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Main CPU body (IHS - Integrated Heat Spreader) */}
        <mesh position={[0, 0.0015, 0]}>
          <boxGeometry args={[0.041, 0.003, 0.041]} />
          <meshStandardMaterial
            color="#707070"
            metalness={0.3}
            roughness={0.7}
            emissive="#3a3a3a"
            emissiveIntensity={0.05}
          />
        </mesh>

        {/* Contact pins pattern on gold backing */}
        {Array.from({ length: 8 }).map((_, i) =>
          Array.from({ length: 8 }).map((_, j) => (
            <mesh
              key={`pin-${i}-${j}`}
              position={[-0.014 + i * 0.004, -0.0013, -0.014 + j * 0.004]}
            >
              <cylinderGeometry args={[0.0003, 0.0003, 0.0008, 8]} />
              <meshStandardMaterial
                color="#c9a961"
                metalness={0.9}
                roughness={0.3}
              />
            </mesh>
          ))
        )}
      </group>

      {/* PC Case - Detailed 3D model */}
      <PCCaseGLTFModel
        component={{
          id: "case",
          name: "Gaming PC Case",
          type: "case",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1.0, 1.0, 1.0], // Meshify C scale
        }}
        isSelected={false}
        onClick={() => {}}
      />

      {/* Components group - properly positioned inside case */}
      <group position={[0, 0, 0]}>
        {/* GPU */}
        {components.gpu && (
          <GPUGLTFModel
            position={[
              components.gpu.position?.[0] ?? defaultPositions.gpu[0],
              (components.gpu.position?.[1] ?? defaultPositions.gpu[1]) +
                explosionAmount * 0.15,
              components.gpu.position?.[2] ?? defaultPositions.gpu[2],
            ]}
            scale={[
              components.gpu.scale?.[0] || 0.008,
              components.gpu.scale?.[1] || 0.008,
              components.gpu.scale?.[2] || 0.008,
            ]}
            isSelected={selectedComponent === components.gpu.id}
            isHovered={hoveredComponent === components.gpu.id}
            onClick={() => onComponentClick(components.gpu!.id)}
            onHover={(hovered) =>
              onComponentHover(hovered ? components.gpu!.id : null)
            }
          />
        )}

        {/* RAM Modules */}
        {/* RAM Modules (textured) */}
        {components.ram &&
          components.ram.length > 0 &&
          components.ram.map((ram, i) => {
            const pos: [number, number, number] = [
              ram.position?.[0] ?? defaultPositions.ram[0],
              ram.position?.[1] ?? defaultPositions.ram[1],
              ram.position?.[2] ?? defaultPositions.ram[2],
            ];
            const rot: [number, number, number] = ram.rotation || [
              Math.PI / 2,
              Math.PI / 2,
              0,
            ];
            const scale: [number, number, number] = (ram.scale as [
              number,
              number,
              number
            ]) || [0.00835, 0.00835, 0.00835];
            return (
              <RAMTexturedModel
                key={ram.id || `ram-${i}`}
                component={{ ...ram, position: pos, rotation: rot, scale }}
                isSelected={selectedComponent === ram.id}
                isHovered={hoveredComponent === ram.id}
                onClick={() => onComponentClick(ram.id)}
                onHover={(hovered) => onComponentHover(hovered ? ram.id : null)}
              />
            );
          })}

        {/* PSU */}
        {components.psu && (
          <PSUGLTFModel
            position={[
              components.psu.position?.[0] ?? defaultPositions.psu[0],
              components.psu.position?.[1] ?? defaultPositions.psu[1],
              components.psu.position?.[2] ?? defaultPositions.psu[2],
            ]}
            rotation={components.psu.rotation || [0, 0, 0]}
            scale={[
              components.psu.scale?.[0] ?? 1,
              components.psu.scale?.[1] ?? 1,
              components.psu.scale?.[2] ?? 1,
            ]}
            isSelected={selectedComponent === components.psu.id}
            isHovered={hoveredComponent === components.psu.id}
            onClick={() => onComponentClick(components.psu!.id)}
            onHover={(hovered) =>
              onComponentHover(hovered ? components.psu!.id : null)
            }
          />
        )}

        {/* AIO Cooler - Deconstructed */}
        {components.cooler && (
          <>
            {/* Pump block on CPU */}
            <AIOPumpGLTFModel
              component={{
                ...components.cooler,
                id: `${components.cooler.id}-pump`,
                name: "AIO Pump Block",
                position: [-0.06, 0.57, -0.08],
                rotation: components.cooler.rotation
                  ? [
                      (components.cooler.rotation[0] ?? 0) + Math.PI / 2,
                      (components.cooler.rotation[1] ?? 0) + Math.PI / 2,
                      components.cooler.rotation[2] ?? 0,
                    ]
                  : [Math.PI / 2, Math.PI / 2, 0],
                scale: [
                  (coolerScale[0] ?? 0.95) * 0.85,
                  (coolerScale[1] ?? 0.95) * 0.85,
                  (coolerScale[2] ?? 0.95) * 0.85,
                ],
              }}
              isSelected={selectedComponent === `${components.cooler!.id}-pump`}
              isHovered={hoveredComponent === `${components.cooler!.id}-pump`}
              onClick={() => onComponentClick(`${components.cooler!.id}-pump`)}
              onHover={(hovered) =>
                onComponentHover(
                  hovered ? `${components.cooler!.id}-pump` : null
                )
              }
            />
            {/* Radiator on case top */}
            <AIORadiatorGLTFModel
              component={{
                ...components.cooler,
                id: `${components.cooler.id}-radiator`,
                name: "AIO Radiator",
                position: [
                  (components.cooler.position?.[0] ?? -0.05) + 0.04,
                  0.45,
                  components.cooler.position?.[2] ?? 0,
                ],
                rotation: components.cooler.rotation
                  ? [
                      (components.cooler.rotation[0] ?? 0) + Math.PI,
                      components.cooler.rotation[1] ?? 0,
                      components.cooler.rotation[2] ?? 0,
                    ]
                  : [Math.PI, 0, 0],
                scale: coolerScale,
              }}
              isSelected={
                selectedComponent === `${components.cooler!.id}-radiator`
              }
              isHovered={
                hoveredComponent === `${components.cooler!.id}-radiator`
              }
              onClick={() =>
                onComponentClick(`${components.cooler!.id}-radiator`)
              }
              onHover={(hovered) =>
                onComponentHover(
                  hovered ? `${components.cooler!.id}-radiator` : null
                )
              }
            />
            {/* Fans on radiator */}
            <AIOFanGLTFModel
              component={{
                ...components.cooler,
                id: `${components.cooler.id}-fans`,
                name: "AIO Fans",
                position: [
                  (components.cooler.position?.[0] ?? -0.05) + 0.04,
                  0.45,
                  components.cooler.position?.[2] ?? 0,
                ],
                rotation: components.cooler.rotation
                  ? [
                      (components.cooler.rotation[0] ?? 0) + Math.PI,
                      components.cooler.rotation[1] ?? 0,
                      components.cooler.rotation[2] ?? 0,
                    ]
                  : [Math.PI, 0, 0],
                scale: coolerScale,
              }}
              isSelected={selectedComponent === `${components.cooler!.id}-fans`}
              isHovered={hoveredComponent === `${components.cooler!.id}-fans`}
              onClick={() => onComponentClick(`${components.cooler!.id}-fans`)}
              onHover={(hovered) =>
                onComponentHover(
                  hovered ? `${components.cooler!.id}-fans` : null
                )
              }
            />
          </>
        )}

        {viewMode.mode === "cables" && cables.length > 0 && (
          <CableVisualizer cables={cables} visible />
        )}

        {viewMode.mode === "rgb" && rgbZones.length > 0 && (
          <RGBVisualizer
            zones={rgbZones}
            visible
            autoPlay
            anchorForZone={(zone) => {
              // GPU anchor
              if (components.gpu && zone.componentId === components.gpu.id) {
                const base = components.gpu.position ||
                  defaultPositions.gpu || [0, 0, 0];
                // Track exploded view vertical offset and nudge inward on Z
                return [
                  base[0],
                  base[1] + explosionAmount * 0.15,
                  base[2] + 0.02,
                ];
              }

              // RAM sticks anchor
              const ramIndex = components.ram.findIndex(
                (r) => r.id === zone.componentId
              );
              if (ramIndex >= 0) {
                const base = components.ram[ramIndex].position ||
                  defaultPositions.ram || [0, 0, 0];
                // Nudge inward on Z to avoid rear panel spill
                return [base[0], base[1], base[2] + 0.02] as [
                  number,
                  number,
                  number
                ];
              }

              // AIO pump and radiator fans derived from cooler
              if (components.cooler) {
                if (zone.componentId === `${components.cooler.id}-pump`) {
                  // Match AIOPumpGLTFModel placement
                  return [-0.06, 0.57, -0.08];
                }
                if (zone.componentId === `${components.cooler.id}-fans`) {
                  return [
                    (components.cooler.position?.[0] ?? -0.05) + 0.04,
                    0.45,
                    components.cooler.position?.[2] ?? 0,
                  ];
                }
              }

              // Case fans anchor
              const fan = components.fans.find(
                (f) => f.id === zone.componentId
              );
              if (fan) {
                return fan.position || [0, 0, 0];
              }

              // Case accent anchors
              if (zone.componentId === "case-top") {
                // Place the top accent light deeper inside the case to avoid exterior spill
                return [0, 0.52, -0.01];
              }
              if (zone.componentId === "case-front") {
                return [0, 0.32, 0.18];
              }
              if (zone.componentId === "case-undershine") {
                return [0, 0.02, 0];
              }

              return [0, 0, 0];
            }}
            showGlowGeometry={false}
          />
        )}
      </group>
    </>
  );
}

/**
 * Main Interactive3DBuilder Component
 *
 * Usage:
 * ```tsx
 * <Interactive3DBuilder
 *   components={selectedComponents}
 *   caseType="mid-tower"
 *   onComponentClick={handleComponentClick}
 *   showCableRouting={true}
 *   rgbPreview={true}
 * />
 * ```
 */
export function Interactive3DBuilder({
  components,
  caseType = "mid-tower",
  onComponentClick,
  showCableRouting = true,
  rgbPreview = true,
  isOpen = true,
  onClose,
}: Interactive3DBuilderProps) {
  // State management
  const [viewMode, setViewMode] = useState<BuilderViewMode>({
    mode: "normal",
    autoRotate: true,
    showLabels: true,
    showShadows: true,
  });

  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [explosionAmount, setExplosionAmount] = useState(0);
  const [showControlPanel, setShowControlPanel] = useState(true);

  // RGB zones with live control support
  const buildZonesFromComponents = useCallback(
    (src: SelectedComponents): RGBZone[] => {
      const zones: RGBZone[] = [];

      if (src.gpu) {
        zones.push({
          id: `rgb-gpu-${src.gpu.id}`,
          componentId: src.gpu.id,
          name: "GPU RGB",
          color: "#0ea5e9",
          intensity: 0.8,
          pattern: "breathing",
          speed: 0.5,
        });
      }

      // RAM sticks
      src.ram?.forEach((ram, idx) => {
        zones.push({
          id: `rgb-ram-${ram.id}`,
          componentId: ram.id,
          name: `RAM ${idx + 1} RGB`,
          color: "#0ea5e9",
          intensity: 0.6,
          pattern: "static",
          speed: 0.5,
        });
      });

      // AIO pump and radiator fans from cooler
      if (src.cooler) {
        zones.push({
          id: `rgb-cooler-pump-${src.cooler.id}`,
          componentId: `${src.cooler.id}-pump`,
          name: "AIO Pump RGB",
          color: "#0ea5e9",
          intensity: 0.9,
          pattern: "breathing",
          speed: 0.6,
        });
        zones.push({
          id: `rgb-cooler-fans-${src.cooler.id}`,
          componentId: `${src.cooler.id}-fans`,
          name: "AIO Fans RGB",
          color: "#0ea5e9",
          intensity: 0.7,
          pattern: "wave",
          speed: 0.6,
        });
      }

      src.fans?.forEach((fan, idx) => {
        zones.push({
          id: `rgb-fan-${fan.id}`,
          componentId: fan.id,
          name: `Fan ${idx + 1} RGB`,
          color: "#0ea5e9",
          intensity: 0.7,
          pattern: "wave",
          speed: 0.6,
        });
      });

      // Case accent zones (always present)
      zones.push(
        {
          id: "rgb-case-top-strip",
          componentId: "case-top",
          name: "Case Top Accent",
          color: "#0ea5e9",
          intensity: 0.35,
          pattern: "static",
          speed: 0.5,
        },
        {
          id: "rgb-case-front",
          componentId: "case-front",
          name: "Case Front Accent",
          color: "#0ea5e9",
          intensity: 0.35,
          pattern: "static",
          speed: 0.5,
        },
        {
          id: "rgb-case-undershine",
          componentId: "case-undershine",
          name: "Case Underglow",
          color: "#0ea5e9",
          intensity: 0.25,
          pattern: "static",
          speed: 0.5,
        }
      );

      return zones;
    },
    []
  );

  const [rgbZones, setRgbZones] = useState<RGBZone[]>(() =>
    buildZonesFromComponents(components)
  );

  // Keep zones in sync with incoming components while preserving user changes
  useEffect(() => {
    setRgbZones((prev) => {
      const fresh = buildZonesFromComponents(components);
      const merged = fresh.map((nz) => {
        const prevZone = prev.find((pz) => pz.id === nz.id);
        return prevZone
          ? {
              ...nz,
              color: prevZone.color,
              intensity: prevZone.intensity,
              pattern: prevZone.pattern,
              speed: prevZone.speed,
            }
          : nz;
      });
      return merged;
    });
  }, [components, buildZonesFromComponents]);

  const handleZoneUpdate = useCallback(
    (zoneId: string, updates: Partial<RGBZone>) => {
      setRgbZones((prev) =>
        prev.map((z) => (z.id === zoneId ? { ...z, ...updates } : z))
      );
    },
    []
  );

  const handleAllZonesUpdate = useCallback((color: string, pattern: string) => {
    setRgbZones((prev) =>
      prev.map((z) => {
        const nextPattern: RGBZone["pattern"] = (
          pattern ? (pattern as RGBZone["pattern"]) : z.pattern
        ) as RGBZone["pattern"];
        return {
          ...z,
          color: color || z.color,
          pattern: nextPattern,
        };
      })
    );
  }, []);

  // Mock cable routes
  const cables = useMemo<CableRoute[]>(() => {
    if (!showCableRouting) return [];

    const routes: CableRoute[] = [];

    return routes;
  }, [showCableRouting]);

  // Handlers
  const handleComponentClick = useCallback(
    (componentId: string) => {
      setSelectedComponent(componentId);
      onComponentClick?.(componentId);
    },
    [onComponentClick]
  );

  const toggleViewMode = (mode: BuilderViewMode["mode"]) => {
    setViewMode((prev) => ({
      ...prev,
      mode: prev.mode === mode ? "normal" : mode,
    }));

    // Auto-explode when switching to exploded mode
    if (mode === "exploded" && explosionAmount === 0) {
      setExplosionAmount(100);
    } else if (mode !== "exploded" && explosionAmount > 0) {
      setExplosionAmount(0);
    }
  };

  const toggleAutoRotate = useCallback(() => {
    setViewMode((prev) => ({
      ...prev,
      autoRotate: !prev.autoRotate,
    }));
  }, []);

  const handleExplodeView = (amount: number) => {
    setExplosionAmount(amount);
  };

  const handleExport = () => {
    // TODO: Implement 360° render export
    console.warn("Export 360° view functionality to be implemented");
  };

  if (!isOpen) return null;

  return (
    <div className="w-full min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sky-500/20 bg-black/50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Box className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-white">
            3D PC Build Visualizer
          </h2>
          <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
            {caseType}
          </Badge>
        </div>
        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className="flex w-full flex-1 overflow-hidden relative">
        {/* 3D Canvas - Full width */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-black">
          {/* Early access notice banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/80 backdrop-blur-sm border border-sky-500/30 text-gray-200 rounded-md px-4 py-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="text-xs">
                Early Access: 3D PC Build Visualiser is in active development —
                enhancements roll out regularly.
              </span>
            </div>
          </div>
          <Canvas
            shadows
            dpr={[1, 2]}
            style={{ width: "100%", height: "100%" }}
          >
            <Suspense fallback={<Loader />}>
              <SceneContent
                components={components}
                viewMode={viewMode}
                selectedComponent={selectedComponent}
                hoveredComponent={hoveredComponent}
                onComponentClick={handleComponentClick}
                onComponentHover={setHoveredComponent}
                cables={cables}
                rgbZones={rgbZones}
                explosionAmount={explosionAmount}
              />
            </Suspense>
          </Canvas>

          {/* Component hover tooltip */}
          {hoveredComponent &&
            (() => {
              // Find component data to get description
              const componentData = Object.values(components)
                .flat()
                .find(
                  (comp) =>
                    comp &&
                    typeof comp === "object" &&
                    "id" in comp &&
                    comp.id === hoveredComponent
                );

              // Default descriptions for component types
              const descriptions: Record<string, string> = {
                gpu: "GPU: A graphics processor that accelerates visuals and parallel tasks like gaming, 3D rendering, and AI. It handles complex calculations in parallel, making it ideal for demanding visual applications and machine learning workloads.",
                ram: "RAM (Random Access Memory) is your computer's short-term memory, used to store and quickly access data that's actively being worked on. The more RAM you have, the more tasks and applications your system can juggle smoothly without slowing down. Think of it as your desk space—a bigger desk means more room to multitask.",
                cpu: "CPU (Central Processing Unit) is the brain of your computer. It executes instructions and controls all other components. A faster CPU means quicker program execution and smoother multitasking, handling everything from basic tasks to complex calculations.",
                motherboard:
                  "Motherboard: The main circuit board that connects all your components together. It controls communication between the CPU, RAM, GPU, storage, and other devices, serving as the nervous system of your computer.",
                psu: "PSU (Power Supply Unit) safely distributes electrical power to all your components. A reliable, high-wattage PSU ensures stable operation and protects your hardware from power fluctuations. The wattage determines how many power-hungry components you can run.",
                cooler:
                  "CPU Cooler: Removes heat from your processor to maintain optimal temperatures. Better cooling allows your CPU to run faster and more efficiently, and helps extend the lifespan of your components by preventing thermal damage.",
                case: "Computer Case: Houses and protects all your internal components while providing airflow pathways for cooling. A good case offers easy cable management, proper ventilation, and protection from dust and damage.",
                storage:
                  "Storage Drive (SSD/HDD): Permanently stores all your files, programs, and operating system. SSDs are much faster than traditional hard drives, dramatically speeding up boot times and program loading.",
                fan: "Case Fan: Circulates air inside your case to remove heat generated by components. Good airflow prevents thermal buildup, improves component lifespan, and can boost system stability and performance.",
                cable:
                  "Power Cable: Delivers electrical power from the PSU to components. Proper cable management improves airflow and system reliability.",
              };

              const description =
                componentData?.description ||
                descriptions[componentData?.type as string] ||
                "Component";

              return (
                <div className="absolute top-4 left-4 bg-black/95 backdrop-blur-sm border border-sky-500/40 rounded-lg px-4 py-3 z-10 animate-in fade-in slide-in-from-left-2 duration-200 max-w-xs shadow-lg">
                  <div className="text-sm font-semibold text-sky-400">
                    {componentData?.name || hoveredComponent}
                  </div>
                  <div className="text-xs text-gray-300 mt-2 leading-relaxed">
                    {description}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Click to select • Drag to rotate
                  </div>
                </div>
              );
            })()}

          {/* Canvas overlays */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowControlPanel(!showControlPanel)}
              className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
              title={showControlPanel ? "Hide controls" : "Show controls"}
            >
              {showControlPanel ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Control Panel - Floating overlay in bottom right */}
        {showControlPanel && (
          <div className="absolute top-20 right-4 w-80 max-h-[calc(100vh-200px)] bg-slate-950/95 backdrop-blur-md border border-sky-500/30 rounded-lg overflow-y-auto shadow-2xl z-[100]">
            <div className="p-4 space-y-6">
              {/* View Modes */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Modes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={viewMode.mode === "normal" ? "default" : "outline"}
                    onClick={() => toggleViewMode("normal")}
                    className={viewMode.mode === "normal" ? "bg-sky-600" : ""}
                  >
                    Normal
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      viewMode.mode === "exploded" ? "default" : "outline"
                    }
                    onClick={() => toggleViewMode("exploded")}
                    className={viewMode.mode === "exploded" ? "bg-sky-600" : ""}
                  >
                    Exploded
                  </Button>
                  {showCableRouting && (
                    <Button
                      size="sm"
                      variant={
                        viewMode.mode === "cables" ? "default" : "outline"
                      }
                      onClick={() => toggleViewMode("cables")}
                      className={viewMode.mode === "cables" ? "bg-sky-600" : ""}
                    >
                      <Wifi className="w-3 h-3 mr-1" />
                      Cables
                    </Button>
                  )}
                  {rgbPreview && (
                    <Button
                      size="sm"
                      variant={viewMode.mode === "rgb" ? "default" : "outline"}
                      onClick={() => toggleViewMode("rgb")}
                      className={viewMode.mode === "rgb" ? "bg-sky-600" : ""}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      RGB
                    </Button>
                  )}
                </div>
              </div>

              {/* Camera Controls */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Camera
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleAutoRotate}
                  className={
                    viewMode.autoRotate
                      ? "bg-sky-500/20 border-sky-500/40 text-sky-400 w-full"
                      : "w-full"
                  }
                >
                  {viewMode.autoRotate ? "Auto-rotate: ON" : "Auto-rotate: OFF"}
                </Button>
              </div>

              {/* Explode View Control */}
              {viewMode.mode === "exploded" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-sky-400">
                    Explosion Amount
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explosionAmount}
                    onChange={(e) =>
                      handleExplodeView(parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500"
                  />
                  <div className="text-xs text-gray-400 text-right">
                    {(explosionAmount * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {/* RGB Controls */}
              {rgbPreview && rgbZones.length > 0 && viewMode.mode === "rgb" && (
                <RGBControlPanel
                  zones={rgbZones}
                  onZoneUpdate={handleZoneUpdate}
                  onAllZonesUpdate={handleAllZonesUpdate}
                />
              )}

              {/* Selected Component Info */}
              {selectedComponent && (
                <div className="space-y-2 p-3 bg-sky-500/10 border border-sky-500/20 rounded">
                  <h4 className="text-sm font-semibold text-sky-400">
                    Selected Component
                  </h4>
                  <div className="text-xs text-gray-300">
                    {selectedComponent}
                  </div>
                </div>
              )}

              {/* Export Options */}
              <div className="space-y-2 pt-4 border-t border-sky-500/20">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExport}
                  className="w-full border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                >
                  Export 360° View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement AR preview
                    console.warn("Launch AR preview");
                  }}
                  className="w-full border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
                >
                  <Smartphone className="w-3 h-3 mr-2" />
                  AR Preview
                </Button>
              </div>

              {/* Stats */}
              <div className="space-y-2 p-3 bg-slate-900/50 rounded text-xs text-gray-400">
                <div>Components: {Object.values(components).flat().length}</div>
                {showCableRouting && <div>Cables: {cables.length}</div>}
                {rgbPreview && <div>RGB Zones: {rgbZones.length}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
