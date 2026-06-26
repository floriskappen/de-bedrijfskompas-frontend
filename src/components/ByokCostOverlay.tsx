import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeByokCost } from "../lib/byok";
import { t } from "../lib/i18n";
import { getByokPurposeLabel } from "../lib/i18n/labels";
import { ByokCostValue } from "./ByokCostValue";

// An app-level cost surface that lives apart from any feature screen: it appears
// while paid requests are in flight and stays put afterwards — readable even when
// the feature has advanced — until the user dismisses it (× or swipe). It never
// auto-hides, so it can't vanish mid-run. It subscribes to the byok cost bus, so
// it is decoupled from where the request fired.
//
// Two shapes: a compact pill (just the amount + a pending pulse) and an expanded
// panel (the per-step breakdown + total). Defaults to expanded on desktop and
// collapsed on mobile, where space is tight; either can be toggled.

interface CostEntry {
  purpose: string;
  landed: boolean;
  costUsd: number | null;
}

// After the last in-flight request settles, a short grace window keeps the very
// next request (e.g. the next Ikigai pass, fired moments later) in the SAME
// burst. A pending that arrives after the grace — a genuinely new operation —
// starts a fresh list, so costs from one run don't pile onto the next.
const BURST_GRACE_MS = 2500;

function prefersExpanded(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(min-width: 768px)").matches;
}

export default function ByokCostOverlay({ locale, onManage }: { locale: "nl" | "en"; onManage?: () => void }) {
  const [entries, setEntries] = useState<CostEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(prefersExpanded);
  const inFlightRef = useRef(0);
  const graceRef = useRef<number | null>(null);
  const burstDoneRef = useRef(false);
  // applies the per-viewport expand default once when the overlay appears, so a
  // manual collapse/expand survives the rest of a burst.
  const shownRef = useRef(false);
  // the positioned wrapper holding BOTH the dither shadow and the card — the
  // drag transform/opacity ride here, not on the card, so the stippled shadow
  // travels with the card instead of detaching from it.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  // set true once a drag passes the tap threshold, so a swipe doesn't also fire
  // the tap action (expand) when it ends short of dismissal.
  const movedRef = useRef(false);

  const clearGrace = () => {
    if (graceRef.current !== null) {
      window.clearTimeout(graceRef.current);
      graceRef.current = null;
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeByokCost((event) => {
      if (event.phase === "pending") {
        inFlightRef.current += 1;
        clearGrace();
        setVisible(true);
        if (!shownRef.current) {
          shownRef.current = true;
          setExpanded(prefersExpanded());
        }
        setEntries((current) => {
          const base = burstDoneRef.current ? [] : current;
          burstDoneRef.current = false;
          if (base.some((entry) => entry.purpose === event.purpose)) {
            return base.map((entry) =>
              entry.purpose === event.purpose
                ? { purpose: entry.purpose, landed: false, costUsd: null }
                : entry
            );
          }
          return [...base, { purpose: event.purpose, landed: false, costUsd: null }];
        });
        return;
      }

      // terminal — landed (real cost) or ended (aborted/failed before usage)
      inFlightRef.current = Math.max(0, inFlightRef.current - 1);
      if (event.phase === "landed") {
        setEntries((current) =>
          current.map((entry) =>
            entry.purpose === event.purpose
              ? { ...entry, landed: true, costUsd: event.costUsd }
              : entry
          )
        );
      } else {
        // never landed → drop the still-pending row, keep any already-landed one
        setEntries((current) =>
          current.filter((entry) => entry.purpose !== event.purpose || entry.landed)
        );
      }
      // when nothing is in flight, open the burst-boundary grace window — but
      // never auto-hide; the surface stays until the user dismisses it.
      if (inFlightRef.current === 0) {
        clearGrace();
        graceRef.current = window.setTimeout(() => {
          burstDoneRef.current = true;
          shownRef.current = false;
          graceRef.current = null;
        }, BURST_GRACE_MS);
      }
    });
    return () => {
      unsubscribe();
      clearGrace();
    };
  }, []);

  const dismiss = () => {
    clearGrace();
    setVisible(false);
    setEntries([]);
    burstDoneRef.current = false;
    shownRef.current = false;
  };

  if (typeof document === "undefined" || !visible || entries.length === 0) return null;

  const busy = entries.some((entry) => !entry.landed);
  const landed = entries.filter((entry) => entry.landed && entry.costUsd !== null);
  const total = landed.reduce((sum, entry) => sum + (entry.costUsd ?? 0), 0);

  // The running total is always shown (0.0000 at the start), so the figure — and
  // its `usd` unit — is a fixed anchor rather than something that pops in late.
  const totalFigure = (
    <span className="byok-cost-overlay-total-value font-mono tabular-nums">
      {total.toFixed(4)}
      <span className="byok-cost-unit">usd</span>
    </span>
  );

  // Swipe up or to the right to dismiss (mirrors the sheet gestures elsewhere) —
  // works on both the pill and the panel. Disabled while busy: you can't dismiss
  // unfinished work. The header controls (`.byok-cost-overlay-control`) opt out
  // of dragging so their taps stay clean.
  const resetDragStyles = () => {
    const root = rootRef.current;
    if (!root) return;
    root.style.transform = "";
    root.style.opacity = "";
  };

  const onDragStart = (event: React.PointerEvent<HTMLElement>) => {
    movedRef.current = false;
    if (busy) return;
    if ((event.target as HTMLElement).closest(".byok-cost-overlay-control")) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDragMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current || !rootRef.current) return;
    const dx = Math.max(0, event.clientX - dragRef.current.x);
    const dy = Math.min(0, event.clientY - dragRef.current.y);
    if (dx > 6 || dy < -6) movedRef.current = true;
    const root = rootRef.current;
    root.style.transform = `translate(${dx}px, ${dy}px)`;
    root.style.opacity = String(Math.max(0.25, 1 - (dx - dy) / 200));
  };

  const onDragEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = null;
    if (dx > 56 || dy < -56) {
      dismiss();
      return;
    }
    resetDragStyles();
  };

  // a cancelled pointer (OS gesture, focus loss) would otherwise strand the
  // drag transform/opacity on the root — snap it back.
  const onDragCancel = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    resetDragStyles();
  };

  const dither = <span className="byok-cost-overlay-dither" aria-hidden="true" />;

  // ── collapsed pill: amount + a pending pulse; tap to expand, swipe or × to
  //    dismiss once done (same as the panel) ──
  if (!expanded) {
    return createPortal(
      <div className="byok-cost-overlay-root" ref={rootRef}>
        {dither}
        <div
          id="byok-cost-overlay"
          className={`byok-cost-overlay is-pill${busy ? " is-busy" : ""}`}
          aria-live="polite"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragCancel}
        >
          <button
            type="button"
            className="byok-cost-overlay-pill-main"
            aria-expanded={false}
            aria-label={t("byok_cost_label", locale)}
            onClick={() => {
              // a swipe that ended short of dismissal must not also expand
              if (movedRef.current) {
                movedRef.current = false;
                return;
              }
              setExpanded(true);
            }}
          >
            <span className="byok-cost-overlay-pill-label">{t("byok_cost_label", locale)}</span>
            {busy && <span className="byok-cost-overlay-dot" aria-hidden="true" />}
            {totalFigure}
          </button>
          {onManage && (
            <button
              type="button"
              className="byok-cost-overlay-control"
              aria-label={t("byok_settings_entry", locale)}
              onClick={onManage}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
            </button>
          )}
          {!busy && (
            <button
              type="button"
              className="byok-cost-overlay-control"
              aria-label={t("close_label", locale)}
              onClick={dismiss}
            >
              ×
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // ── expanded panel: per-step breakdown + total ──
  return createPortal(
    <div className="byok-cost-overlay-root" ref={rootRef}>
      {dither}
      <aside
        id="byok-cost-overlay"
        className={`byok-cost-overlay is-expanded${busy ? " is-busy" : ""}`}
        aria-live="polite"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragCancel}
      >
        <div className="byok-cost-overlay-head">
        <span className="byok-cost-overlay-title">{t("byok_cost_label", locale)}</span>
        <div className="byok-cost-overlay-actions">
          {onManage && (
            <button
              type="button"
              id="byok-cost-manage"
              className="ontwerp-icon-button is-compact"
              aria-label={t("byok_settings_entry", locale)}
              onClick={onManage}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
            </button>
          )}
          <button
              type="button"
              className="byok-cost-overlay-control"
              aria-label={t("byok_cost_collapse", locale)}
              aria-expanded
              onClick={() => setExpanded(false)}
            >
              –
            </button>
            {/* dismiss only once the work is done — never mid-request */}
            {!busy && (
              <button
                type="button"
                className="byok-cost-overlay-control"
                aria-label={t("close_label", locale)}
                onClick={dismiss}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <ul className="byok-cost-overlay-list">
          {entries.map((entry) => (
            <li key={entry.purpose} className="byok-cost-overlay-row">
              <span className="byok-cost-overlay-purpose">{getByokPurposeLabel(entry.purpose, locale)}</span>
              <ByokCostValue landed={entry.landed} costUsd={entry.costUsd} locale={locale} />
            </li>
          ))}
        </ul>

        <div className="byok-cost-overlay-total">
          <span className="byok-cost-overlay-total-label">{t("byok_cost_total", locale)}</span>
          {totalFigure}
        </div>
      </aside>
    </div>,
    document.body
  );
}
