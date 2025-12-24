import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";

interface GPUGLTFModelProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

export function GPUGLTFModel({
  position = [0.08, 0.4, 0.05], // PCIe slot position, roughly at motherboard level
  scale = [0.008, 0.008, 0.008], // Increased scale for better visibility
  rotation = [Math.PI / 2, -Math.PI / 2, 0], // 90 degrees X, flipped 180 on Y
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
}: GPUGLTFModelProps) {
  const { scene } = useGLTF("/models/gpu/Detailed_Graphics_Card.gltf");

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;

      const geometry = child.geometry;

      // Filter out PlaneGeometry artifacts from modeling software
      if (geometry && geometry.type === "PlaneGeometry") {
        child.visible = false;
        return;
      }

      // Hide meshes with "Plane" in the name (artifact from 3D software)
      if (child.name && child.name.toLowerCase().includes("plane")) {
        child.visible = false;
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      // Enhance materials if needed
      if (child.material && !Array.isArray(child.material)) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.envMapIntensity = 1.2;

        // Add hover glow effect
        if (isHovered || isSelected) {
          material.emissive = new THREE.Color(
            isSelected ? "#0ea5e9" : "#06b6d4"
          );
          material.emissiveIntensity = isSelected ? 0.4 : 0.2;
        } else {
          material.emissiveIntensity = 0;
        }
      }
    });

    return cloned;
  }, [scene, isHovered, isSelected]);

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover?.(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHover?.(false);
      }}
    >
      <primitive object={clonedScene} scale={scale} />

      {/* Selection indicator plate */}
      {isSelected && (
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 0.15]} />
          <meshStandardMaterial
            color="#00ccff"
            emissive="#00ccff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/gpu/Detailed_Graphics_Card.gltf");
