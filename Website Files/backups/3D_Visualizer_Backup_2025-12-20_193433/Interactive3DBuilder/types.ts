/**
 * Types for Interactive3DBuilder component
 * Defines the structure of PC components and builder state
 */

export interface PCComponent {
  id: string;
  name: string;
  type: ComponentType;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  // Component-specific properties
  specs?: {
    tdp?: number; // Thermal Design Power in watts
    length?: number; // GPU length in mm
    height?: number; // Component height
    width?: number;
  };
}

export type ComponentType =
  | "case"
  | "motherboard"
  | "cpu"
  | "gpu"
  | "ram"
  | "psu"
  | "storage"
  | "cooler"
  | "fan"
  | "cable";

export interface SelectedComponents {
  case?: PCComponent;
  motherboard?: PCComponent;
  cpu?: PCComponent;
  gpu?: PCComponent;
  ram: PCComponent[];
  psu?: PCComponent;
  storage: PCComponent[];
  cooler?: PCComponent;
  fans: PCComponent[];
}

export interface CableRoute {
  id: string;
  from: string; // Component ID
  to: string; // Component ID
  type: "power" | "data" | "sata";
  points: [number, number, number][]; // Bezier curve points
}

export interface RGBZone {
  id: string;
  componentId: string;
  name: string;
  color: string;
  intensity: number; // 0-1
  pattern: "static" | "breathing" | "pulse" | "rainbow" | "wave";
  speed: number; // 0-1
}

export interface BuilderViewMode {
  mode: "normal" | "exploded" | "cables" | "rgb" | "thermal";
  autoRotate: boolean;
  showLabels: boolean;
  showShadows: boolean;
}

export interface Interactive3DBuilderProps {
  components: SelectedComponents;
  caseType?: "mid-tower" | "full-tower" | "mini-itx" | "atx" | "e-atx";
  onComponentClick?: (componentId: string) => void;
  showCableRouting?: boolean;
  rgbPreview?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}
