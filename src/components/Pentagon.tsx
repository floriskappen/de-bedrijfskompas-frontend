import React from "react";
import type { Company } from "../lib/company-data/types";

interface PentagonProps {
  scores: Company["scores"];
}

const AXES = [
  { id: "substance", label: "substance" },
  { id: "ecology", label: "ecology" },
  { id: "power", label: "power" },
  { id: "embeddedness", label: "embeddedness" },
  { id: "posture", label: "posture" },
];

export default function Pentagon({ scores }: PentagonProps) {
  const size = 180;
  const center = size / 2;
  const radius = size * 0.35; // leaves room for labels

  // Calculate coordinates for each axis
  const getCoordinates = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const x = center + radius * (value / 100) * Math.cos(angle);
    const y = center + radius * (value / 100) * Math.sin(angle);
    return { x, y };
  };

  const getTipCoordinates = (index: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Generate concentric pentagon grid lines (25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];
  const gridPaths = gridLevels.map((level) => {
    const points = AXES.map((_, index) => {
      const angle = (index * 72 - 90) * (Math.PI / 180);
      const x = center + radius * (level / 100) * Math.cos(angle);
      const y = center + radius * (level / 100) * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  // Calculate polygon points for non-null scores
  const polygonPoints = AXES.map((axis, index) => {
    const scoreVal = scores[axis.id as keyof typeof scores]?.score;
    // For drawing the filled polygon, we treat null as 0, but we style null spokes distinctly.
    // Or we skip it. If we skip it, the polygon connects the other points.
    // Let's treat null as 0 in the filled polygon to keep the shape closed, but mark it clearly as null in the spoke.
    const val = scoreVal !== null && scoreVal !== undefined ? scoreVal : 0;
    const { x, y } = getCoordinates(index, val);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-paper-warm/50 border border-ink/5 rounded-lg">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Concentric grid lines */}
        {gridPaths.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}

        {/* Axis Spoke Lines */}
        {AXES.map((axis, index) => {
          const scoreVal = scores[axis.id as keyof typeof scores]?.score;
          const isNull = scoreVal === null || scoreVal === undefined;
          const { x: xTip, y: yTip } = getTipCoordinates(index);

          return (
            <line
              key={axis.id}
              x1={center}
              y1={center}
              x2={xTip}
              y2={yTip}
              stroke="var(--color-ink)"
              strokeOpacity={isNull ? 0.15 : 0.25}
              strokeWidth={isNull ? 1.5 : 1}
              strokeDasharray={isNull ? "3,3" : undefined}
            />
          );
        })}

        {/* Shaded Area Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(185, 28, 28, 0.15)"
          stroke="var(--color-brand-red)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Data points & null markers */}
        {AXES.map((axis, index) => {
          const scoreVal = scores[axis.id as keyof typeof scores]?.score;
          const isNull = scoreVal === null || scoreVal === undefined;

          if (isNull) {
            // Render null-state styling: hollow circle at the center or tip to indicate no signal
            const { x, y } = getCoordinates(index, 0); // at center
            return (
              <circle
                key={`dot-${axis.id}`}
                cx={x}
                cy={y}
                r={3}
                fill="var(--color-paper-warm)"
                stroke="var(--color-faint)"
                strokeWidth={1.5}
              />
            );
          } else {
            // Render standard point
            const { x, y } = getCoordinates(index, scoreVal);
            return (
              <circle
                key={`dot-${axis.id}`}
                cx={x}
                cy={y}
                r={3.5}
                fill="var(--color-brand-red)"
              />
            );
          }
        })}

        {/* Axis Labels */}
        {AXES.map((axis, index) => {
          const angle = (index * 72 - 90) * (Math.PI / 180);
          const scoreVal = scores[axis.id as keyof typeof scores]?.score;
          const isNull = scoreVal === null || scoreVal === undefined;

          // Push labels slightly outwards
          const labelDist = radius + 15;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle);

          // Adjust text alignment based on position
          let textAnchor = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          if (Math.cos(angle) < -0.1) textAnchor = "end";

          return (
            <text
              key={`label-${axis.id}`}
              x={x}
              y={y + 3}
              textAnchor={textAnchor}
              className="text-[10px] font-mono tracking-tight fill-ink/80 lowercase select-none"
            >
              {axis.label} {isNull ? "(-)" : `(${scoreVal})`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
