/**
 * 3D Component Models - Procedurally generated Three.js models
 * Each component is created as a reusable mesh group
 */

import { forwardRef, useState } from "react";
import * as THREE from "three";
import { PCComponent } from "./types";

interface Component3DProps {
  component: PCComponent;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  exploded?: boolean;
  explosionForce?: number;
}

// CPU Cooler Model
export const CPUCoolerModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
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
        {/* Base mounting plate */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.08]} />
          <meshStandardMaterial
            color={isSelected ? "#0ea5e9" : hovered ? "#06b6d4" : "#1f2937"}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Heat sink fins */}
        {[...Array(6)].map((_, i) => (
          <mesh
            key={`fin-${i}`}
            castShadow
            receiveShadow
            position={[0, 0.025 + i * 0.015, 0]}
          >
            <boxGeometry args={[0.08, 0.008, 0.08]} />
            <meshStandardMaterial
              color={isSelected ? "#0ea5e9" : "#374151"}
              metalness={0.5}
              roughness={0.6}
            />
          </mesh>
        ))}

        {/* CPU fan */}
        <group position={[0, 0.12, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.01, 32]} />
            <meshStandardMaterial
              color={hovered ? "#0ea5e9" : "#000000"}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
          {/* Fan blades */}
          {[0, 90, 180, 270].map((angle) => (
            <mesh
              key={`blade-${angle}`}
              position={[
                Math.cos((angle * Math.PI) / 180) * 0.035,
                0.01,
                Math.sin((angle * Math.PI) / 180) * 0.035,
              ]}
            >
              <boxGeometry args={[0.007, 0.005, 0.035]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.4}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>

        {/* Label */}
        {isSelected && (
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.08, 0.01, 0.02]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={0.5}
            />
          </mesh>
        )}
      </group>
    );
  }
);

CPUCoolerModel.displayName = "CPUCoolerModel";

// GPU Model (Graphics Card)
export const GPUModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);
    const gpuLength = component.specs?.length || 330; // mm, default RTX 4080 length
    const scaledLength = gpuLength / 1000; // Convert to scene units

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
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
        {/* GPU PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[scaledLength, 0.06, 0.04]} />
          <meshStandardMaterial
            color={isSelected ? "#0ea5e9" : "#0f172a"}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* GPU Die (cooler area) */}
        <mesh castShadow receiveShadow position={[0, 0.045, 0]}>
          <boxGeometry args={[scaledLength * 0.7, 0.035, 0.02]} />
          <meshStandardMaterial
            color={hovered ? "#0ea5e9" : "#1f2937"}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Power connectors */}
        {[0, 0.03].map((offset, i) => (
          <mesh
            key={`pwr-${i}`}
            position={[-scaledLength / 2 + 0.02, 0.04, offset]}
          >
            <boxGeometry args={[0.012, 0.015, 0.008]} />
            <meshStandardMaterial
              color="#ef4444"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* VRAM modules */}
        {[...Array(4)].map((_, i) => (
          <mesh
            key={`vram-${i}`}
            position={[-scaledLength / 4 + i * 0.05, 0.035, 0]}
            castShadow
          >
            <boxGeometry args={[0.02, 0.015, 0.04]} />
            <meshStandardMaterial
              color="#4f46e5"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
        ))}

        {/* RGB LEDs on GPU */}
        {[...Array(3)].map((_, i) => (
          <mesh key={`rgb-${i}`} position={[0, 0.035, -0.025 + i * 0.015]}>
            <sphereGeometry args={[0.003, 8, 8]} />
            <meshStandardMaterial
              color={component.color || "#0ea5e9"}
              emissive={component.color || "#0ea5e9"}
              emissiveIntensity={2}
            />
          </mesh>
        ))}

        {/* Mounting bracket */}
        <mesh position={[scaledLength / 2 - 0.01, -0.035, 0]} castShadow>
          <boxGeometry args={[0.015, 0.08, 0.04]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
    );
  }
);

GPUModel.displayName = "GPUModel";

// RAM Stick Model
export const RAMModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
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
        {/* RAM PCB */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.008, 0.064, 0.035]} />
          <meshStandardMaterial
            color={isSelected ? "#0ea5e9" : hovered ? "#06b6d4" : "#1e293b"}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* DRAM chips */}
        {[0, 0.02].map((offset, i) => (
          <mesh key={`chip-${i}`} position={[0.001, offset - 0.01, 0]}>
            <boxGeometry args={[0.004, 0.008, 0.015]} />
            <meshStandardMaterial
              color="#4f46e5"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        ))}

        {/* Gold contacts */}
        <mesh position={[0, -0.033, 0]}>
          <boxGeometry args={[0.003, 0.001, 0.035]} />
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Heat spreader stripes */}
        {[...Array(3)].map((_, i) => (
          <mesh key={`stripe-${i}`} position={[0.002, -0.025 + i * 0.015, 0]}>
            <boxGeometry args={[0.001, 0.002, 0.035]} />
            <meshStandardMaterial
              color={component.color || "#0ea5e9"}
              emissive={component.color || "#0ea5e9"}
              emissiveIntensity={1}
            />
          </mesh>
        ))}
      </group>
    );
  }
);

RAMModel.displayName = "RAMModel";

// Storage Drive Model (SSD)
export const StorageModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
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
        {/* SSD case */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.11, 0.01, 0.055]} />
          <meshStandardMaterial
            color={isSelected ? "#0ea5e9" : hovered ? "#06b6d4" : "#1f2937"}
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* PCB */}
        <mesh castShadow receiveShadow position={[0, 0.005, 0]}>
          <boxGeometry args={[0.105, 0.002, 0.05]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        {/* NAND chips */}
        {[...Array(4)].map((_, i) => (
          <mesh key={`nand-${i}`} position={[-0.04 + i * 0.03, 0.004, -0.01]}>
            <boxGeometry args={[0.015, 0.003, 0.015]} />
            <meshStandardMaterial
              color="#374151"
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>
        ))}

        {/* Connector */}
        <mesh position={[0.04, 0.001, 0]}>
          <boxGeometry args={[0.02, 0.005, 0.04]} />
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* LED indicator */}
        <mesh position={[-0.045, 0.006, 0.02]}>
          <sphereGeometry args={[0.002, 8, 8]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    );
  }
);

StorageModel.displayName = "StorageModel";

// PSU (Power Supply) Model
export const PSUModel = forwardRef<THREE.Group, Component3DProps>(
  ({ component, isSelected, onClick, onHover }, ref) => {
    const [hovered, setHovered] = useState(false);

    return (
      <group
        ref={ref}
        position={component.position}
        rotation={component.rotation}
        scale={component.scale}
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
        {/* Main PSU case */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.08, 0.1]} />
          <meshStandardMaterial
            color={isSelected ? "#0ea5e9" : hovered ? "#06b6d4" : "#0f172a"}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Front panel with ventilation */}
        <mesh position={[0, 0, 0.051]} castShadow>
          <boxGeometry args={[0.15, 0.08, 0.01]} />
          <meshStandardMaterial
            color="#1f2937"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Fan intake */}
        <mesh position={[0, 0, 0.055]}>
          <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
          <meshStandardMaterial
            color="#000000"
            metalness={0.3}
            roughness={0.8}
          />
        </mesh>

        {/* Cooling fan */}
        <group position={[0, 0, 0.06]}>
          {[0, 90, 180, 270].map((angle) => (
            <mesh key={`psu-blade-${angle}`}>
              <boxGeometry args={[0.001, 0.025, 0.025]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
          ))}
        </group>

        {/* Power connectors on back */}
        {[...Array(3)].map((_, i) => (
          <mesh
            key={`connector-${i}`}
            position={[-0.07, -0.025 + i * 0.025, -0.05]}
          >
            <boxGeometry args={[0.01, 0.012, 0.01]} />
            <meshStandardMaterial
              color="#ef4444"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Wattage indicator label */}
        <mesh position={[-0.07, 0.03, 0.051]}>
          <boxGeometry args={[0.03, 0.01, 0.01]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
    );
  }
);

PSUModel.displayName = "PSUModel";
