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

// Preload the RAM model
useGLTF.preload("/models/ram/Ram_Chip.gltf");

export const RAMTexturedModel = forwardRef<THREE.Group, Component3DProps>(
  (
    {
      component,
      isSelected: _isSelected,
      onClick,
      onHover,
      isHovered: _isHovered,
    },
    ref
  ) => {
    const [_hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/ram/Ram_Chip.gltf");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;
      });
    }, [cloned]);

    const scale: [number, number, number] = (component.scale as [
      number,
      number,
      number
    ]) || [0.003, 0.003, 0.003];

    const rotation: [number, number, number] = component.rotation || [
      Math.PI / 2,
      0,
      0,
    ];

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={rotation}
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
      </group>
    );
  }
);

RAMTexturedModel.displayName = "RAMTexturedModel";
