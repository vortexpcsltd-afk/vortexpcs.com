import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

interface PSUGLTFModelProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
}

export function PSUGLTFModel({
  position = [0, 0, 0],
  scale: _scale = [1, 1, 1],
  rotation = [0, 0, 0],
  isSelected = false,
  onClick,
}: PSUGLTFModelProps) {
  const { scene } = useGLTF("/models/psu/asus_rog_psu.glb");

  const clonedScene = useMemo(() => {
    if (!scene) return null;

    const cloned = scene.clone(true);
    let meshCount = 0;

    cloned.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;

        // Enhance materials
        if (child.material && child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.envMapIntensity = 1.0;
          mat.metalness = 0.7;
          mat.roughness = 0.3;
          // Force visible color
          mat.color = new THREE.Color("#2a2a2a");
          mat.emissive = new THREE.Color("#ff0000");
          mat.emissiveIntensity = 0.3;
          mat.needsUpdate = true;
        }
      }
    });

    console.warn(`PSU GLB loaded with ${meshCount} meshes`);

    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    if (
      Number.isFinite(center.x) &&
      Number.isFinite(center.y) &&
      Number.isFinite(center.z)
    ) {
      cloned.position.sub(center); // center the model at origin so positioning works as expected
    }

    const targetMaxDimension = 0.12; // PSU size to match scene scale
    const maxDimension = Math.max(size.x, size.y, size.z);
    const normalizer = maxDimension > 0 ? targetMaxDimension / maxDimension : 1;
    cloned.scale.multiplyScalar(normalizer);

    return cloned;
  }, [scene]);

  if (!clonedScene) return null;

  return (
    <group position={position} rotation={rotation} onClick={onClick}>
      <primitive object={clonedScene} />

      {/* Fallback PSU shape - gray box with red accent */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.06, 0.1]} />
        <meshStandardMaterial
          color="#2a2a2a"
          metalness={0.8}
          roughness={0.2}
          emissive="#ff0000"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 0.1]} />
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
