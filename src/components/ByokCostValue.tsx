import React from "react";
import { t } from "../lib/i18n";

// One place both spend surfaces render a cost figure, so the live flow line and
// the setup-sheet history can never drift. The figure is the mono "value" idiom
// (tabular numerals); the `usd` unit is a separate quiet mark, never doubled
// with a `$`. Pending/unknown render the honest word, never a fabricated number.
export function ByokCostValue({
  landed,
  costUsd,
  locale,
  unit = false,
  className = "",
}: {
  landed: boolean;
  costUsd: number | null;
  locale: "nl" | "en";
  unit?: boolean;
  className?: string;
}) {
  if (!landed) {
    return (
      <span className={`byok-cost-value is-pending ${className}`}>{t("byok_cost_pending", locale)}</span>
    );
  }
  if (costUsd === null) {
    return (
      <span className={`byok-cost-value is-unknown ${className}`}>{t("byok_cost_unknown", locale)}</span>
    );
  }
  return (
    <span className={`byok-cost-value ${className}`}>
      <span className="byok-cost-fig font-mono tabular-nums">{costUsd.toFixed(4)}</span>
      {unit && <span className="byok-cost-unit">usd</span>}
    </span>
  );
}

// The allowance as the ontwerp "rising" state (vendor/ontwerp states.md): a
// vessel that fills from its foot as spend climbs toward the ceiling. The level
// is the real usage/allowance ratio and rises on the stepped clock; at the
// ceiling the water deepens to the accent (full), so the vessel itself reports
// "nearly out of budget" without a separate warning colour.
export function ByokAllowanceMeter({
  usageUsd,
  allowanceUsd,
  label,
}: {
  usageUsd: number;
  allowanceUsd: number;
  label: string;
}) {
  const ratio = allowanceUsd > 0 ? Math.min(Math.max(usageUsd / allowanceUsd, 0), 1) : 0;
  const over = allowanceUsd > 0 && usageUsd >= allowanceUsd;
  return (
    <span
      className={`byok-vessel${over ? " is-full" : ""}`}
      role="img"
      aria-label={label}
      title={label}
      style={{ "--byok-level": ratio } as React.CSSProperties}
    >
      <span className="byok-vessel-fill" aria-hidden="true" />
    </span>
  );
}
