import { forwardRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { PCComponent } from "../types";

interface Component3DProps {
  component: PCComponent;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  exploded?: boolean;
  explosionForce?: number;
}

// GLB converted from OBJ with embedded placeholder textures
// TODO: Replace with actual textures when available (1AW2B.jpg, Waermeleitpaste.jpg, Unbenkable23u.jpg, tmc2platnexJ.jpg)
useGLTF.preload("/models/liquid_cooler.glb");

export const LiquidCoolerGLTFModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/liquid_cooler.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        const geometry = child.geometry;

        // Hide plane meshes (both by type and by name)
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
      });
    }, [cloned]);

    const scale: [number, number, number] = (component.scale as [
      number,
      number,
      number
    ]) || [1, 1, 1];

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={scale}
        onClick={onClick}
        onPointerOver={() => {
          setHovered(true);
          onHover?.(true);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(false);
        }}
      >
        <primitive object={cloned} />
        {isSelected && (
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.12, 0.001, 0.12]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={hovered ? 0.6 : 0.3}
              opacity={0.2}
              transparent
            />
          </mesh>
        )}
      </group>
    );
  }
);

LiquidCoolerGLTFModel.displayName = "LiquidCoolerGLTFModel";

export default LiquidCoolerGLTFModel;
