import React from "react";
import { focusLevelOrdinal, type FocusLevel } from "../lib/company-data/focus-level";

// A compact three-bar "focus meter" — how much focus a company puts on an axis,
// read at a glance instead of in words. low = one bar, medium = two, high =
// three; no signal shows three faint, hollow bars so it reads as "unknown",
// never as zero/bad. Used on the detail page, the favorites cards, and the
// filter sheet (where it shows the selected minimum).
export default function FocusMeter({
  level,
  label,
  className = "",
}: {
  level: FocusLevel;
  label?: string;
  className?: string;
}) {
  const filled = focusLevelOrdinal(level); // none 0 · low 1 · medium 2 · high 3
  const isNone = level === "none";

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-focus-meter
      data-level={level}
      className={`focus-meter${isNone ? " is-none" : ""} ${className}`}
    >
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden="true"
          className={`focus-meter-bar${!isNone && step <= filled ? " is-on" : " is-off"}`}
        />
      ))}
    </span>
  );
}
