/**
 * Cable routing visualization with spline curves
 * Shows power, data, and SATA connections between components
 */

import { Line } from "@react-three/drei";
import { CableRoute } from "./types";

interface CableVisualizerProps {
  cables: CableRoute[];
  visible?: boolean;
}

// Create a Bezier curve between two points
function createBezierCurve(
  start: [number, number, number],
  end: [number, number, number],
  intensity: number = 0.3
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const steps = 20;

  // Control points for Bezier curve
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2 + intensity; // Arc upward
  const midZ = (start[2] + end[2]) / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t1 = 1 - t;

    // Quadratic Bezier formula
    const x = t1 * t1 * start[0] + 2 * t1 * t * midX + t * t * end[0];
    const y = t1 * t1 * start[1] + 2 * t1 * t * midY + t * t * end[1];
    const z = t1 * t1 * start[2] + 2 * t1 * t * midZ + t * t * end[2];

    points.push([x, y, z]);
  }

  return points;
}

// Cable color mapping
const getCableColor = (cableType: "power" | "data" | "sata"): string => {
  switch (cableType) {
    case "power":
      return "#fbbf24"; // Gold/yellow for power cables
    case "data":
      return "#0ea5e9"; // Cyan for data/PCIe
    case "sata":
      return "#ef4444"; // Red for SATA
    default:
      return "#888888";
  }
};

export function CableVisualizer({
  cables,
  visible = true,
}: CableVisualizerProps) {
  if (!visible || cables.length === 0) {
    return null;
  }

  return (
    <group>
      {cables.map((cable) => {
        // Parse component positions from IDs (simplified)
        const fromPos: [number, number, number] = [0, 0, 0];
        const toPos: [number, number, number] = [0.2, 0, 0];

        const curvePoints = createBezierCurve(fromPos, toPos, 0.15);
        const color = getCableColor(cable.type);

        return (
          <group key={cable.id}>
            {/* Main cable line */}
            <Line
              points={curvePoints}
              color={color}
              lineWidth={2}
              dashed={cable.type === "data"}
              dashScale={2}
              dashSize={0.02}
              gapSize={0.01}
            />

            {/* Cable glow effect */}
            <Line
              points={curvePoints}
              color={color}
              lineWidth={5}
              transparent
              opacity={0.1}
            />

            {/* Connection point glow at start */}
            <mesh position={fromPos}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Connection point glow at end */}
            <mesh position={toPos}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.5}
              />
            </mesh>

            {/* Cable label at midpoint */}
            <mesh
              position={[
                (fromPos[0] + toPos[0]) / 2,
                (fromPos[1] + toPos[1]) / 2 + 0.02,
                (fromPos[2] + toPos[2]) / 2,
              ]}
            >
              <planeGeometry args={[0.04, 0.01]} />
              <meshStandardMaterial color="#000000" transparent opacity={0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
