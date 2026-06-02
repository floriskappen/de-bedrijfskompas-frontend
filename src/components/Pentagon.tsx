import React from "react";
import type { Company } from "../lib/company-data/types";
import { getAxisLabel } from "../lib/i18n/labels";

interface PentagonProps {
  scores: Company["scores"];
  locale?: "nl" | "en";
}

const AXES = [
  { id: "substance" },
  { id: "ecology" },
  { id: "power" },
  { id: "embeddedness" },
  { id: "posture" },
] as const;

export default function Pentagon({ scores, locale = "nl" }: PentagonProps) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const n = AXES.length;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, v: number): [number, number] => [
    cx + Math.cos(angle(i)) * r * v,
    cy + Math.sin(angle(i)) * r * v,
  ];

  const ringPoints = (k: number) =>
    Array.from({ length: n }, (_, i) => point(i, k).join(",")).join(" ");

  // polygon — null axes treated as 0 to keep shape closed
  const valuePoints = AXES.map((a, i) => {
    const v = scores[a.id]?.score;
    return point(i, v !== null && v !== undefined ? v / 100 : 0).join(",");
  }).join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible" style={{ display: "block" }}>
      {/* concentric rings */}
      {[0.33, 0.66, 1].map((k, i) => (
        <polygon
          key={i}
          points={ringPoints(k)}
          fill="none"
          stroke={i === 2 ? "rgba(31,27,22,0.22)" : "rgba(31,27,22,0.12)"}
          strokeWidth={i === 2 ? 1 : 0.7}
          strokeDasharray={i < 2 ? "2 3" : ""}
        />
      ))}

      {/* spokes */}
      {AXES.map((a, i) => {
        const isNull = scores[a.id]?.score === null || scores[a.id]?.score === undefined;
        const [px, py] = point(i, 1);
        return (
          <line
            key={a.id + "-spoke"}
            x1={cx}
            y1={cy}
            x2={px}
            y2={py}
            stroke="rgba(31,27,22,0.14)"
            strokeWidth={0.7}
            strokeDasharray={isNull ? "2 3" : ""}
          />
        );
      })}

      {/* value polygon */}
      <polygon
        points={valuePoints}
        fill="rgba(184,74,57,0.18)"
        stroke="#B84A39"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* per-axis marker: dot for value, ? for null */}
      {AXES.map((a, i) => {
        const v = scores[a.id]?.score;
        const isNull = v === null || v === undefined;
        if (isNull) {
          const [px, py] = point(i, 0.5);
          return (
            <text
              key={a.id + "-q"}
              x={px}
              y={py + 4}
              fontSize={16}
              fill="#B8AE99"
              textAnchor="middle"
              fontFamily="Archivo, sans-serif"
            >
              ?
            </text>
          );
        }
        const [px, py] = point(i, v / 100);
        return (
          <circle
            key={a.id + "-dot"}
            cx={px}
            cy={py}
            r={3.5}
            fill="#B84A39"
            stroke="#ECE4D2"
            strokeWidth={1.5}
          />
        );
      })}

      {/* axis labels — mono utility mark */}
      {AXES.map((a, i) => {
        const isNull = scores[a.id]?.score === null || scores[a.id]?.score === undefined;
        const [lx, ly] = point(i, 1.24);
        return (
          <text
            key={a.id + "-lbl"}
            x={lx}
            y={ly}
            fontSize={9.5}
            letterSpacing={1.8}
            fill={isNull ? "#B8AE99" : "#4A4239"}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {getAxisLabel(a.id, locale).toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}
