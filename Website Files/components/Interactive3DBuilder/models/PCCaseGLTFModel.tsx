import { forwardRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { PCComponent } from "../types";
import { logger } from "../../../services/logger";

interface Component3DProps {
  component: PCComponent;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  exploded?: boolean;
  explosionForce?: number;
}

// Preload the PC case model
useGLTF.preload("/models/pc_case/meshify_c.glb");

export const PCCaseGLTFModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [_hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/pc_case/meshify_c.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        // Make sure mesh is visible by default
        child.visible = true;
        child.castShadow = true;
        child.receiveShadow = true;

        // Hide the specific side panel if requested by name
        if (child.name === "Plane012") {
          child.visible = false;
        }

        // Setup materials for case parts
        if (child.material) {
          child.material = child.material.clone();
          child.material.needsUpdate = true;
        }
      });
    }, [cloned]);

    const scale: [number, number, number] = (component.scale as [
      number,
      number,
      number
    ]) || [1.0, 1.0, 1.0];

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={scale}
        onClick={onClick}
        onPointerOver={(e: THREE.Event) => {
          setHovered(true);
          onHover?.(true);
          // Log the hovered mesh name via logger
          const target = e.target as THREE.Object3D;
          logger.debug("Case hover:", { name: target?.name });
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(false);
        }}
      >
        <primitive object={cloned} />
        {isSelected && (
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.45, 0.001, 0.45]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={0.5}
              transparent
              opacity={0.3}
            />
          </mesh>
        )}
      </group>
    );
  }
);

PCCaseGLTFModel.displayName = "PCCaseGLTFModel";
