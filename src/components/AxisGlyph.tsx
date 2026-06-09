import React from "react";
import type { AxisId } from "../lib/company-data/types";

// Clean line glyph per axis — the same marks used on the company detail page,
// the filter sheet, and the favorites cards. `muted` drops the stroke to the
// faint tone for no-signal rows.
export default function AxisGlyph({
  axis,
  size = 20,
  muted = false,
}: {
  axis: AxisId;
  size?: number;
  muted?: boolean;
}) {
  const stroke = muted ? "var(--color-text-faint)" : "var(--color-text-soft)";
  const sp = {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke,
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "shrink-0",
    "aria-hidden": true,
  };
  switch (axis) {
    case "substance":
      return (
        <svg {...sp}>
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <rect x="7" y="7" width="6" height="6" fill={stroke} stroke="none" />
        </svg>
      );
    case "ecology":
      return (
        <svg {...sp}>
          <path d="M10 17 C 4 14, 3 8, 10 3 C 17 8, 16 14, 10 17 Z" />
          <path d="M10 16 L 10 8" />
        </svg>
      );
    case "power":
      return (
        <svg {...sp}>
          <path d="M10 3 L 17 16 L 3 16 Z" />
          <line x1="6.5" y1="12" x2="13.5" y2="12" />
          <line x1="8" y1="9" x2="12" y2="9" />
        </svg>
      );
    case "embeddedness":
      return (
        <svg {...sp}>
          <path d="M10 17 C 4 12, 4 6, 10 3 C 16 6, 16 12, 10 17 Z" />
          <circle cx="10" cy="8.5" r="2.2" fill={stroke} stroke="none" />
        </svg>
      );
    case "posture":
      return (
        <svg {...sp}>
          <polyline points="3,15 8,10 11,13 17,5" />
          <polyline points="13,5 17,5 17,9" />
        </svg>
      );
    default:
      return null;
  }
}
