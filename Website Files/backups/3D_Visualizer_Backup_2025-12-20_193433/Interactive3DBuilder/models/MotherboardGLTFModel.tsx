import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

interface MotherboardGLTFModelProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  isSelected?: boolean;
}

export function MotherboardGLTFModel({
  position = [-0.08, 0.13, -0.06], // Positioned up and right
  scale = [0.008, 0.008, 0.008], // Increased for proper base platform visibility
  rotation = [0, 0, 0], // Vertical orientation
  isSelected = false,
}: MotherboardGLTFModelProps) {
  const { scene } = useGLTF("/models/motherboard/motherboard.glb");

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
      }
    });

    return cloned;
  }, [scene]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={clonedScene} scale={scale} />

      {/* Selection indicator plate */}
      {isSelected && (
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.25]} />
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
useGLTF.preload("/models/motherboard/motherboard.glb");
