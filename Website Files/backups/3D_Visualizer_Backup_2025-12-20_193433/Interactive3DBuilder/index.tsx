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

import { useState, useCallback, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Html,
  useProgress,
} from "@react-three/drei";
import { Card } from "../ui/card";
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
  onComponentClick: (componentId: string) => void;
  cables: CableRoute[];
  rgbZones: RGBZone[];
  explosionAmount: number;
}

function SceneContent({
  components,
  viewMode,
  selectedComponent,
  onComponentClick,
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
        autoRotateSpeed={1.5}
        enableZoom
        enablePan
        minDistance={0.25}
        maxDistance={2.0}
        target={[0, 0.25, 0]}
      />
      {/* Cooler scale is now computed above */}
      {/* Dark environment with custom lighting */}
      <Environment preset="night" background={false} />

      {/* Professional lighting setup with focal lights */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[0.4, 0.6, 0.3]} intensity={1.5} castShadow />
      <directionalLight
        position={[-0.3, 0.4, 0.2]}
        intensity={1.0}
        color="#a0d8ff"
      />
      <pointLight
        position={[0.15, 0.2, 0.25]}
        intensity={0.8}
        color="#0ea5e9"
        distance={2}
      />
      <pointLight
        position={[-0.15, 0.25, -0.15]}
        intensity={0.6}
        color="#06b6d4"
        distance={1.5}
      />
      <pointLight
        position={[0, 0.2, 0.4]}
        intensity={1.0}
        color="#0ea5e9"
        distance={2.5}
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
            onClick={() => onComponentClick(components.gpu!.id)}
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
                onClick={() => onComponentClick(ram.id)}
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
            onClick={() => onComponentClick(components.psu!.id)}
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
              onClick={() => onComponentClick(`${components.cooler!.id}-pump`)}
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
              onClick={() =>
                onComponentClick(`${components.cooler!.id}-radiator`)
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
              onClick={() => onComponentClick(`${components.cooler!.id}-fans`)}
            />
          </>
        )}

        {viewMode.mode === "cables" && cables.length > 0 && (
          <CableVisualizer cables={cables} visible />
        )}

        {viewMode.mode === "rgb" && rgbZones.length > 0 && (
          <RGBVisualizer zones={rgbZones} visible autoPlay />
        )}
      </group>

      {/* Grid */}
      {viewMode.mode === "normal" && (
        <gridHelper args={[1, 10]} position={[0, -0.15, 0]} />
      )}
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
  className = "",
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
  const [explosionAmount, setExplosionAmount] = useState(0);
  const [showControlPanel, setShowControlPanel] = useState(true);

  // Mock RGB zones based on components
  const rgbZones = useMemo<RGBZone[]>(() => {
    const zones: RGBZone[] = [];

    if (components.gpu) {
      zones.push({
        id: `rgb-gpu-${components.gpu.id}`,
        componentId: components.gpu.id,
        name: "GPU RGB",
        color: "#0ea5e9",
        intensity: 0.8,
        pattern: "breathing",
        speed: 0.5,
      });
    }

    components.fans?.forEach((fan, idx) => {
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

    return zones;
  }, [components]);

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
    <div
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center ${className}`}
    >
      <Card className="w-[80vw] h-[calc(70vh+100px)] max-w-full bg-black border-sky-500/20 rounded-lg overflow-hidden mt-[200px]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sky-500/20 bg-black/50">
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
          <div className="flex-1 flex overflow-hidden">
            {/* 3D Canvas */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-950 to-black">
              <Canvas shadows dpr={[1, 2]}>
                <Suspense fallback={<Loader />}>
                  <SceneContent
                    components={components}
                    viewMode={viewMode}
                    selectedComponent={selectedComponent}
                    onComponentClick={handleComponentClick}
                    cables={cables}
                    rgbZones={rgbZones}
                    explosionAmount={explosionAmount}
                  />
                </Suspense>
              </Canvas>

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

            {/* Control Panel - Collapsible */}
            {showControlPanel && (
              <div className="w-80 bg-black border-l border-sky-500/20 overflow-y-auto">
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
                        variant={
                          viewMode.mode === "normal" ? "default" : "outline"
                        }
                        onClick={() => toggleViewMode("normal")}
                        className={
                          viewMode.mode === "normal" ? "bg-sky-600" : ""
                        }
                      >
                        Normal
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          viewMode.mode === "exploded" ? "default" : "outline"
                        }
                        onClick={() => toggleViewMode("exploded")}
                        className={
                          viewMode.mode === "exploded" ? "bg-sky-600" : ""
                        }
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
                          className={
                            viewMode.mode === "cables" ? "bg-sky-600" : ""
                          }
                        >
                          <Wifi className="w-3 h-3 mr-1" />
                          Cables
                        </Button>
                      )}
                      {rgbPreview && (
                        <Button
                          size="sm"
                          variant={
                            viewMode.mode === "rgb" ? "default" : "outline"
                          }
                          onClick={() => toggleViewMode("rgb")}
                          className={
                            viewMode.mode === "rgb" ? "bg-sky-600" : ""
                          }
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
                      {viewMode.autoRotate
                        ? "Auto-rotate: ON"
                        : "Auto-rotate: OFF"}
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
                  {rgbPreview &&
                    rgbZones.length > 0 &&
                    viewMode.mode === "rgb" && (
                      <RGBControlPanel zones={rgbZones} />
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
                    <div>
                      Components: {Object.values(components).flat().length}
                    </div>
                    {showCableRouting && <div>Cables: {cables.length}</div>}
                    {rgbPreview && <div>RGB Zones: {rgbZones.length}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Interactive3DBuilder;
