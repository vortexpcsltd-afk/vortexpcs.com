import { forwardRef, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { PCComponent } from "../types";

interface Component3DProps {
  component: PCComponent;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

useGLTF.preload("/models/liquid_cooler.glb");

export const AIORadiatorGLTFModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [_hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/liquid_cooler.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        child.castShadow = true;
        child.receiveShadow = true;

        // Show only radiator, hide pump, fans, hoses, and cables
        const name = child.name || "";
        const isRadiator = name.includes("Radiator_Cube114");
        const isNut =
          name.includes("Nut") &&
          !name.includes("Nut003_Nut004") &&
          !name.includes("Nut002_Nut003") &&
          !name.includes("Nut001_Nut002") &&
          !name.includes("Nut_Nut001");
        const isRGB =
          name.includes("RGB_Rings_Cube116") ||
          name.includes("RGB-Plug_Cube115");
        const isFanPlug = name.includes("Fan-Plug_Cube006");

        child.visible = isRadiator || isNut || isRGB || isFanPlug;
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

AIORadiatorGLTFModel.displayName = "AIORadiatorGLTFModel";
