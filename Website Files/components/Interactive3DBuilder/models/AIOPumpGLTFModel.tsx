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

export const AIOPumpGLTFModel = forwardRef<THREE.Group, Component3DProps>(
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

    const { scene } = useGLTF("/models/liquid_cooler.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        child.castShadow = true;
        child.receiveShadow = true;

        // Show only the pump body; hide brackets, bolts, cables, and other extras
        const name = child.name || "";
        const isPump = name.includes("Pump_09");
        child.visible = isPump;
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

        {/* Selection overlay removed to avoid any flat quad artifacts */}
      </group>
    );
  }
);

AIOPumpGLTFModel.displayName = "AIOPumpGLTFModel";
