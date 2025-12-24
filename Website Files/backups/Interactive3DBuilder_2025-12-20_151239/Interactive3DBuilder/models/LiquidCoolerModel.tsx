import { forwardRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
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

/**
 * LiquidCoolerModel
 * Loads an AIO liquid cooler from OBJ+MTL placed in public/models.
 * Expected files:
 * - /models/liquid_cooler.mtl
 * - /models/liquid_cooler.obj
 */
export const LiquidCoolerModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    const materials = useLoader(
      MTLLoader,
      "/models/liquid_cooler.mtl",
      (loader) => {
        // Ensure texture references in MTL resolve relative to /models
        (loader as MTLLoader).setResourcePath("/models/");
        (loader as MTLLoader).setPath("/models/");
      }
    );
    useEffect(() => {
      materials.preload();
    }, [materials]);

    const obj = useLoader(
      OBJLoader as unknown as typeof OBJLoader,
      "/models/liquid_cooler.obj",
      (loader) => {
        (loader as unknown as OBJLoader).setMaterials(materials);
      }
    ) as unknown as THREE.Group;

    const group = useMemo(() => obj.clone(true), [obj]);

    useEffect(() => {
      group.traverse((child: THREE.Object3D) => {
        if (!(child instanceof THREE.Mesh)) return;

        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material && !Array.isArray(child.material)) {
          child.material.side = THREE.FrontSide;
        }
      });
    }, [group]);

    // Fallback scale if none provided; OBJ often authored in millimeters
    const scale: [number, number, number] = (component.scale as [
      number,
      number,
      number
    ]) || [0.0012, 0.0012, 0.0012];

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
        {/* Loaded OBJ model */}
        <primitive object={group} />

        {/* Optional selection accent (subtle emissive plate) */}
        {isSelected && (
          <mesh position={[0, -0.01, 0]}>
            <boxGeometry args={[0.12, 0.001, 0.12]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={hovered ? 0.6 : 0.3}
              opacity={0.25}
              transparent
            />
          </mesh>
        )}
      </group>
    );
  }
);

LiquidCoolerModel.displayName = "LiquidCoolerModel";
