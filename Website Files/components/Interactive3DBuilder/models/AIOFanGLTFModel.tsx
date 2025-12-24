import { forwardRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { PCComponent } from "../types";

interface Component3DProps {
  component: PCComponent;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  isHovered?: boolean;
}

useGLTF.preload("/models/liquid_cooler.glb");

export const AIOFanGLTFModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover, isHovered: _isHovered }, ref) => {
    const [_hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/liquid_cooler.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        child.castShadow = true;
        child.receiveShadow = true;

        // Show only fans and fan housing
        const name = child.name || "";
        const isFan =
          name.includes("FAN") ||
          name.includes("Fan_gehäuse") ||
          name.includes("Fan-Plug");

        child.visible = isFan;
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
            <boxGeometry args={[0.3, 0.001, 0.15]} />
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

AIOFanGLTFModel.displayName = "AIOFanGLTFModel";
