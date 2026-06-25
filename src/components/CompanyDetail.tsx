import React, { useEffect, useState } from "react";
import type { AxisId, Company, EvidenceLevel } from "../lib/company-data/types";
import { AXIS_IDS } from "../lib/company-data/types";
import { getLocalizedField } from "../lib/company-data";
import { formatLastChecked } from "../lib/company-data/last-checked";
import { getAxisLabel, getFocusLevelLabel } from "../lib/i18n/labels";
import { t } from "../lib/i18n";
import { getFocusLevel } from "../lib/company-data/focus-level";
import {
  getAxisInfoHref,
  getEvidenceLabel,
  getMoonType,
  type MoonType,
} from "../lib/company-data/axis-detail";
import { concealThenNavigate } from "../lib/transitions/bloom-curtain";
import { readFavoriteIds, subscribeFavorites, toggleFavorite } from "../lib/favorites";
import AxisGlyph from "./AxisGlyph";
import FocusMeter from "./FocusMeter";
import Pentagon from "./Pentagon";

interface CompanyDetailProps {
  company: Company;
  locale: "nl" | "en";
}

function MoonGlyph({ type, size = 9 }: { type: MoonType; size?: number }) {
  const r = size / 2;
  const w = size + 2;
  return (
    <svg width={w} height={w} viewBox={`0 0 ${w} ${w}`} style={{ flexShrink: 0 }} aria-hidden="true">
      {type === "full" && <circle cx={r + 1} cy={r + 1} r={r} fill="currentColor" />}
      {type === "half" && (
        <>
          <circle cx={r + 1} cy={r + 1} r={r} fill="none" stroke="currentColor" strokeWidth="1" />
          <path d={`M ${r + 1} 1 A ${r} ${r} 0 0 1 ${r + 1} ${r * 2 + 1} Z`} fill="currentColor" />
        </>
      )}
      {type === "empty" && (
        <circle
          cx={r + 1}
          cy={r + 1}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="1.6 1.5"
        />
      )}
    </svg>
  );
}

function ArrowOut() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" className="shrink-0 text-ink-quiet" aria-hidden="true">
      <path
        d="M3 8 L 8 3 M 4.5 3 L 8 3 L 8 6.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function AxisRow({
  axis,
  company,
  locale,
  expanded,
  onToggle,
}: {
  axis: AxisId;
  company: Company;
  locale: "nl" | "en";
  expanded: boolean;
  onToggle: () => void;
}) {
  const detail = company.scores[axis];
  const evidence: EvidenceLevel = detail?.evidence ?? "no_signal";
  const unknown = evidence === "no_signal" || detail?.score === null || detail?.score === undefined;
  // Collapsed rows show the focus level as a compact meter; a no-signal axis
  // shows the hollow "none" meter and reads as "geen signaal".
  const meterLevel = unknown ? "none" : getFocusLevel(detail?.score);
  const levelLabel = unknown ? t("evidence_none", locale) : getFocusLevelLabel(meterLevel, locale);
  const label = getAxisLabel(axis, locale);
  const reason: string | undefined = getLocalizedField(company, locale, `scores.${axis}.reason`);
  const explainer =
    locale === "en"
      ? `${t("axis_explainer", locale)} ${label} mean?`
      : `${t("axis_explainer", locale)} ${label}?`;

  return (
    <div className="border-t border-ink/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-axis={axis}
        className="flex w-full items-center gap-3.5 py-4 text-left"
      >
        <AxisGlyph axis={axis} size={22} muted={unknown} />
        <span
          className={`min-w-0 flex-1 font-sans text-[22px] leading-none normal-case ${
            unknown ? "text-ink-quiet" : "text-ink"
          }`}
        >
          {label}
        </span>
        <span data-axis-level={axis} data-level={meterLevel} aria-label={levelLabel}>
          <FocusMeter level={meterLevel} label={levelLabel} />
        </span>
        <svg
          width="10"
          height="14"
          viewBox="0 0 10 14"
          aria-hidden="true"
          className="axis-chevron ml-1 shrink-0 text-ink-quiet"
          style={{ transform: expanded ? "rotate(90deg)" : "none" }}
        >
          <path
            d="M2 2 L 7 7 L 2 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      <div className={`axis-panel${expanded ? " is-open" : ""}`}>
        <div className="axis-panel-inner" aria-hidden={!expanded}>
          <div className="ml-9 pb-4">
            <div data-axis-evidence={axis} className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-quiet">
              <MoonGlyph type={getMoonType(evidence)} size={8} />
              {getEvidenceLabel(evidence, locale)}
            </div>
            {reason && (
              <p className="mb-3.5 font-sans text-[16px] leading-snug text-ink-soft">{reason}</p>
            )}
            <a
              href={getAxisInfoHref(axis, locale, company.company_id)}
              data-axis-info={axis}
              tabIndex={expanded ? undefined : -1}
              className="flex items-center gap-2.5 bg-ink/[0.04] px-3 py-2 no-underline"
            >
              <span className="w-12 shrink-0 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink-quiet">
                {t("explainer_tag", locale)}
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-[13px] text-ink">
                {explainer}
              </span>
              <ArrowOut />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetail({ company, locale }: CompanyDetailProps) {
  const [openId, setOpenId] = useState<AxisId | null>(AXIS_IDS[0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  // Where "back" returns to. Defaults to the map (the peek-card origin); a
  // `?from=favorites` marker means the visitor came from the favorites page.
  const [fromFavorites, setFromFavorites] = useState(false);

  const city = company.address?.city || t("address_fallback", locale);
  const tagline = getLocalizedField(company, locale, "tagline") || t("tagline_fallback", locale);
  const monogram = (company.name || "?").trim().charAt(0).toUpperCase();
  const base = locale === "en" ? "/en/" : "/";
  // back to the map keeps this company selected, so the peek card it was opened
  // from re-opens; back to favorites returns to the shortlist.
  const mapHref = `${base}?selected=${encodeURIComponent(company.company_id)}`;
  const favoritesHref = locale === "en" ? "/en/favorites/" : "/favorieten/";
  const backHref = fromFavorites ? favoritesHref : mapHref;
  const backLabel = fromFavorites ? t("back_to_favorites", locale) : t("back_to_map", locale);
  const lastChecked = formatLastChecked(company.updated_at, locale);
  const isCurrentFavorite = favoriteIds.includes(company.company_id);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFromFavorites(new URLSearchParams(window.location.search).get("from") === "favorites");
    }
    setFavoriteIds(readFavoriteIds());
    return subscribeFavorites(setFavoriteIds);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-16 pt-4">
      {/* top bar: back (keeps the company selected) + favourite + website */}
      <div className="mb-5 flex items-center justify-between">
        <a
          href={backHref}
          className="ontwerp-icon-button is-compact"
          aria-label={backLabel}
          onClick={(e) => {
            // reverse of the peek-card bloom: paper blooms up from the bottom
            // (where the card will re-appear), then the destination reveals
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            concealThenNavigate(backHref, window.innerWidth / 2, window.innerHeight * 0.8);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9 2 L 4 7 L 9 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={`ontwerp-icon-button is-compact favorite-toggle${isCurrentFavorite ? " is-favorite" : ""}`}
            aria-label={isCurrentFavorite ? t("favorite_remove_label", locale) : t("bookmark_label", locale)}
            aria-pressed={isCurrentFavorite}
            onClick={() => toggleFavorite(company.company_id)}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9 2l2.09 4.26L16 7l-3.5 3.4.83 4.6L9 13l-4.33 2L5.5 10.4 2 7l4.91-.74L9 2z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {company.website && (
            <a
              id="company-website-link"
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="ontwerp-icon-button is-compact"
              aria-label={t("website_label", locale)}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M2.5 9h13M9 2.5c1.8 1.7 2.8 4 2.8 6.5S10.8 13.8 9 15.5C7.2 13.8 6.2 11.5 6.2 9S7.2 4.2 9 2.5z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* identity — monogram + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-ink font-sans text-[26px] leading-none text-paper normal-case">
          {monogram}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-sans text-[26px] leading-none text-ink normal-case">{company.name}</h1>
          <p className="mt-1 font-sans text-[12px] text-ink-quiet">{city}</p>
        </div>
      </div>

      {/* tagline — plain inline text, same as the peek card */}
      <p className="mt-3.5 font-sans text-[15px] leading-snug text-ink-soft">{tagline}</p>

      {/* pentagon — the headline of the page, given the most room */}
      <div className="mt-6 flex justify-center">
        <Pentagon scores={company.scores} locale={locale} size={300} />
      </div>

      <p className="mb-1 mt-4 text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-quiet">
        {t("axis_hint", locale)}
      </p>

      {/* axis list */}
      <div className="mt-2">
        {AXIS_IDS.map((axis) => (
          <AxisRow
            key={axis}
            axis={axis}
            company={company}
            locale={locale}
            expanded={openId === axis}
            onToggle={() => setOpenId(openId === axis ? null : axis)}
          />
        ))}
        <div className="border-t border-ink/10" />
      </div>

      {/* footer meta — real last-refreshed time, omitted when unknown */}
      {lastChecked && (
        <p className="mt-6 text-center font-mono text-[10px] tracking-[0.08em] text-ink-quiet">
          {t("last_checked", locale)} {lastChecked}
        </p>
      )}
    </div>
  );
}
