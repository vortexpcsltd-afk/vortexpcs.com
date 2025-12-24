import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Smartphone,
  Eye,
  Box,
  Layers,
  X,
} from "lucide-react";
import { is3DEnabled } from "../utils/featureFlags";

// Loading component for 3D scene
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-black/80 backdrop-blur-sm border border-sky-500/30 rounded-xl p-6">
        <Box className="w-12 h-12 text-sky-400 animate-spin" />
        <div className="text-white font-semibold">{progress.toFixed(0)}%</div>
        <div className="text-gray-400 text-sm">Loading 3D Model...</div>
      </div>
    </Html>
  );
}

// Placeholder PC Case Model (will be replaced with actual GLTF models)
interface PCCaseModelProps {
  caseType?: "mid-tower" | "full-tower" | "mini-itx" | "atx" | "e-atx";
  color?: string;
  autoRotate?: boolean;
}

function PCCaseModel({
  caseType = "mid-tower",
  color = "#1e293b",
  autoRotate = false,
}: PCCaseModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Auto-rotation animation
  useFrame((_state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  // Case dimensions based on type (in meters, scaled down for display)
  const dimensions = {
    "mid-tower": { width: 0.45, height: 0.9, depth: 0.5 },
    "full-tower": { width: 0.5, height: 1.1, depth: 0.55 },
    "mini-itx": { width: 0.35, height: 0.4, depth: 0.4 },
    atx: { width: 0.45, height: 0.85, depth: 0.5 },
    "e-atx": { width: 0.55, height: 1.0, depth: 0.6 },
  };

  const dim = dimensions[caseType];

  return (
    <group
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main case body */}
      <mesh position={[0, dim.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[dim.width, dim.height, dim.depth]} />
        <meshStandardMaterial
          color={hovered ? "#0ea5e9" : color}
          metalness={0.8}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Front panel with mesh cutouts */}
      <mesh position={[0, dim.height / 2, dim.depth / 2 + 0.01]} castShadow>
        <boxGeometry args={[dim.width * 0.9, dim.height * 0.8, 0.02]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Tempered glass side panel */}
      <mesh position={[-dim.width / 2 - 0.01, dim.height / 2, 0]} castShadow>
        <boxGeometry args={[0.02, dim.height * 0.9, dim.depth * 0.9]} />
        <meshPhysicalMaterial
          color="#1e40af"
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.3}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>

      {/* Top panel */}
      <mesh position={[0, dim.height + 0.01, 0]} castShadow>
        <boxGeometry args={[dim.width, 0.02, dim.depth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* RGB LED strip simulation */}
      <mesh position={[0, dim.height / 4, dim.depth / 2]}>
        <boxGeometry args={[dim.width * 0.8, 0.01, 0.01]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0ea5e9"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Front I/O panel */}
      <group position={[0, dim.height - 0.1, dim.depth / 2 + 0.02]}>
        {/* Power button */}
        <mesh position={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" />
        </mesh>
        {/* USB ports */}
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.04, 0.015, 0.01]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
        {/* Audio jacks */}
        <mesh position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.01, 16]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      </group>

      {/* Bottom feet */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`foot-${x}-${z}`}
            position={[(x * dim.width) / 2.5, 0.02, (z * dim.depth) / 2.5]}
            castShadow
          >
            <cylinderGeometry args={[0.02, 0.025, 0.04, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.9} />
          </mesh>
        ))
      )}

      {/* Ventilation holes on top */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`vent-${i}`}
          position={[-dim.width / 3 + i * 0.06, dim.height + 0.015, 0]}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.03, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
    </group>
  );
}

// Scene component with lighting and environment
function Scene({ caseType, color, autoRotate }: PCCaseModelProps) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[2, 1.5, 2]} fov={50} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#0ea5e9" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />

      {/* 3D Model */}
      <PCCaseModel caseType={caseType} color={color} autoRotate={autoRotate} />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={3}
        blur={2}
        far={2}
      />

      {/* Environment map for reflections */}
      <Environment preset="city" />

      {/* Orbit controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        minDistance={1.5}
        maxDistance={5}
      />
    </>
  );
}

// View presets
const VIEW_PRESETS = {
  front: { position: [0, 1, 3], target: [0, 0.5, 0] },
  back: { position: [0, 1, -3], target: [0, 0.5, 0] },
  left: { position: [-3, 1, 0], target: [0, 0.5, 0] },
  right: { position: [3, 1, 0], target: [0, 0.5, 0] },
  top: { position: [0, 4, 0], target: [0, 0, 0] },
  isometric: { position: [2, 1.5, 2], target: [0, 0.5, 0] },
};

// Main AR/3D Viewer Component
interface AR3DViewerProps {
  productName: string;
  caseType?: "mid-tower" | "full-tower" | "mini-itx" | "atx" | "e-atx";
  color?: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AR3DViewer({
  productName,
  caseType = "mid-tower",
  color = "#1e293b",
  className = "",
  isOpen = false,
  onClose,
}: AR3DViewerProps) {
  const enabled = is3DEnabled();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [arSupported, setArSupported] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for AR support (WebXR)
  useEffect(() => {
    if ("xr" in navigator) {
      const xr = (
        navigator as {
          xr?: { isSessionSupported: (mode: string) => Promise<boolean> };
        }
      ).xr;
      xr?.isSessionSupported("immersive-ar")
        .then((supported: boolean) => {
          setArSupported(supported);
        })
        .catch(() => setArSupported(false));
    }
  }, []);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // AR mode (basic implementation - would need WebXR API)
  const enterARMode = () => {
    if (arSupported) {
      alert(
        "AR Mode: Point your camera at a flat surface to place the PC case. (WebXR implementation required)"
      );
      // In production: Initialize WebXR AR session
    } else {
      alert(
        "AR is not supported on this device. Please use a compatible mobile browser."
      );
    }
  };

  if (!enabled || !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 ${className}`}
      ref={containerRef}
    >
      <Card className="w-full max-w-6xl h-[90vh] bg-gradient-to-br from-gray-900/95 to-black/95 border-sky-500/30 overflow-hidden relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Box className="w-6 h-6 text-sky-400" />
                {productName}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Interactive 3D View • Rotate, zoom, and explore
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-sky-500/20 border-sky-500/40 text-sky-400">
                <Layers className="w-3 h-3 mr-1" />
                3D Model
              </Badge>
              {arSupported && (
                <Badge className="bg-green-500/20 border-green-500/40 text-green-400">
                  <Smartphone className="w-3 h-3 mr-1" />
                  AR Ready
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full pt-20 pb-20">
          <Canvas
            shadows
            gl={{ antialias: true, alpha: true }}
            className="cursor-grab active:cursor-grabbing"
          >
            <Suspense fallback={<Loader />}>
              <Scene
                caseType={caseType}
                color={color}
                autoRotate={autoRotate}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Controls Overlay */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* View Presets */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 mr-2">Views:</span>
                {Object.entries(VIEW_PRESETS).map(([name]) => (
                  <Button
                    key={name}
                    size="sm"
                    variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-sky-500/20 hover:border-sky-500/40 text-gray-300 hover:text-white capitalize"
                    onClick={() => {
                      // In production: Update camera position
                    }}
                  >
                    {name}
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`border-white/20 bg-white/5 hover:bg-sky-500/20 hover:border-sky-500/40 ${
                    autoRotate ? "bg-sky-500/20 border-sky-500/40" : ""
                  }`}
                  onClick={() => setAutoRotate(!autoRotate)}
                >
                  <RotateCw
                    className={`w-4 h-4 mr-2 ${
                      autoRotate ? "animate-spin" : ""
                    }`}
                  />
                  Auto Rotate
                </Button>

                {arSupported && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    onClick={enterARMode}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    View in AR
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Fullscreen
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={() => setShowControls(!showControls)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-3 text-xs text-gray-400 flex flex-wrap gap-4">
              <span>🖱️ Left Click + Drag: Rotate</span>
              <span>🖱️ Right Click + Drag: Pan</span>
              <span>⚙️ Scroll: Zoom</span>
              {arSupported && (
                <span className="text-green-400">
                  📱 AR: View in your space
                </span>
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white hover:bg-white/10"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Minimized Controls Toggle */}
        {!showControls && (
          <Button
            size="sm"
            variant="outline"
            className="absolute bottom-4 right-4 z-20 border-white/20 bg-black/60 backdrop-blur-sm hover:bg-white/10"
            onClick={() => setShowControls(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Show Controls
          </Button>
        )}
      </Card>
    </div>
  );
}
export default AR3DViewer;
