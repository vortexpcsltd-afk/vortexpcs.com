import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

interface PSUGLTFModelProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  isSelected?: boolean;
  onClick?: () => void;
  isHovered?: boolean;
  onHover?: (hovered: boolean) => void;
}

export function PSUGLTFModel({
  position = [0, 0, 0],
  scale: _scale = [1, 1, 1],
  rotation = [0, 0, 0],
  isSelected = false,
  onClick,
  isHovered: _isHovered = false,
  onHover,
}: PSUGLTFModelProps) {
  const { scene } = useGLTF("/models/psu/corsair_sf850l_psu.glb");

  const clonedScene = useMemo(() => {
    if (!scene) return null;

    const cloned = scene.clone(true);
    (cloned as unknown as { frustumCulled: boolean }).frustumCulled = false;

    cloned.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true;
        child.visible = true;
        child.frustumCulled = false;

        // Preserve GLB materials with subtle enhancements
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material;
          // Slight sheen
          mat.envMapIntensity = 0.08;
          // Fallback if no base texture: apply dark PSU-like finish
          const hasBaseMap = !!mat.map;
          if (!hasBaseMap) {
            // Matte black with a touch of sheen
            mat.color.set(0x0a0a0a);
            if (typeof mat.roughness === "number") mat.roughness = 0.95;
            if (typeof mat.metalness === "number") mat.metalness = 0.06;
            if (mat.emissive) mat.emissive.set(0x000000);
          }
          mat.needsUpdate = true;
        }
      }
    });

    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    console.warn("📐 PSU Bounds:", {
      size: { x: size.x, y: size.y, z: size.z },
      center: { x: center.x, y: center.y, z: center.z },
      min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
      max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
    });

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
    <group
      position={position}
      rotation={rotation}
      scale={_scale}
      onClick={onClick}
      onPointerOver={() => onHover?.(true)}
      onPointerOut={() => onHover?.(false)}
    >
      <primitive object={clonedScene} />

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

// Preload PSU asset to reduce initial red-box fallback risk
useGLTF.preload("/models/psu/corsair_sf850l_psu.glb");
