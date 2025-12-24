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

export const AIOPumpGLTFModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [_hovered, setHovered] = useState(false);

    const { scene } = useGLTF("/models/liquid_cooler.glb");
    const cloned = useMemo(() => scene.clone(true), [scene]);

    useMemo(() => {
      cloned.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        child.castShadow = true;
        child.receiveShadow = true;

        // Show only pump and mounting brackets, hide everything else
        const name = child.name || "";
        const isPump = name.includes("Pump_09");
        const isBracket =
          (name.includes("Brecket-AM4") || name.includes("Brecked_TR4")) &&
          !name.includes("Brecked_TR4_Cylinder003");
        const isBolt =
          (name.includes("Bolt-CPU") || name.includes("Bolt004")) &&
          !name.includes("Bolt004_Bolt011") &&
          !name.includes("Bolt-CPU003_Bolt010") &&
          !name.includes("Bolt-CPU002_Bolt009") &&
          !name.includes("Bolt-CPU001_Bolt003") &&
          !name.includes("Bolt-CPU_Bolt002");
        const isUSBCable = name.includes(
          "USB_cableBezierCurve006_BezierCurve034"
        );

        child.visible = isPump || isBracket || isBolt || isUSBCable;
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
            <boxGeometry args={[0.08, 0.001, 0.08]} />
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

AIOPumpGLTFModel.displayName = "AIOPumpGLTFModel";
