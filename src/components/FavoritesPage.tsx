import React, { useEffect, useMemo, useState } from "react";
import type { Company } from "../lib/company-data/types";
import { AXIS_IDS } from "../lib/company-data/types";
import { getLocalizedField } from "../lib/company-data";
import { getFocusLevel } from "../lib/company-data/focus-level";
import { getAxisLabel, getFocusLevelLabel } from "../lib/i18n/labels";
import { t } from "../lib/i18n";
import { readFavoriteIds, subscribeFavorites, toggleFavorite } from "../lib/favorites";
import AxisGlyph from "./AxisGlyph";
import FocusMeter from "./FocusMeter";

interface FavoritesPageProps {
  companies: Company[];
  locale: "nl" | "en";
}

function detailHref(companyId: string, locale: "nl" | "en"): string {
  // carry the origin so the detail page's back button returns here, not to the map
  const base = locale === "en" ? `/en/${companyId}/` : `/${companyId}/`;
  return `${base}?from=favorites`;
}

function FavoriteCard({ company, locale }: { company: Company; locale: "nl" | "en" }) {
  const city = company.address?.city || t("address_fallback", locale);
  const tagline = getLocalizedField(company, locale, "tagline") || t("tagline_fallback", locale);
  const monogram = (company.name || "?").trim().charAt(0).toUpperCase();

  return (
    <article className="ontwerp-card is-warm-surface relative p-4" data-favorite-company={company.company_id}>
      <button
        type="button"
        className="ontwerp-icon-button is-compact favorite-toggle is-favorite absolute right-3 top-3 z-10"
        aria-label={t("favorite_remove_label", locale)}
        aria-pressed={true}
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

      {/* identity — monogram, then name with
          locality tight beneath it in the same text column */}
      <div className="flex items-center gap-3 pr-9">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-ink font-sans text-[26px] leading-none text-paper normal-case">
          {monogram}
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={detailHref(company.company_id, locale)}
            className="favorite-card-link block font-sans text-[22px] leading-none text-ink no-underline normal-case"
          >
            {company.name}
          </a>
          <p className="mt-1 font-sans text-[12px] text-ink-quiet">{city}</p>
        </div>
      </div>

      <p className="mt-3.5 font-sans text-[14px] leading-snug text-ink-soft">{tagline}</p>

      {/* compass summary — one focus meter per axis, read at a glance */}
      <div className="mt-4 flex items-end justify-between border-t border-ink/10 pt-3">
        {AXIS_IDS.map((axis) => {
          const level = getFocusLevel(company.scores[axis]?.score);
          const meterLabel = `${getAxisLabel(axis, locale)}: ${getFocusLevelLabel(level, locale)}`;
          return (
            <div key={axis} className="flex flex-col items-center gap-2" title={meterLabel}>
              <AxisGlyph axis={axis} size={15} muted={level === "none"} />
              <FocusMeter level={level} label={meterLabel} />
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function FavoritesPage({ companies, locale }: FavoritesPageProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoriteIds());
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.company_id, company])),
    [companies]
  );
  const favoriteCompanies = favoriteIds
    .map((id) => companyById.get(id))
    .filter((company): company is Company => Boolean(company));
  const mapHref = locale === "en" ? "/en/" : "/";

  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
    return subscribeFavorites(setFavoriteIds);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-16 pt-4">
      <div className="mb-6 flex items-center justify-between gap-3">
        <a href={mapHref} className="ontwerp-icon-button is-compact" aria-label={t("back_to_map", locale)}>
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
        <div className="min-w-0 flex-1 text-right">
          <h1 className="font-sans text-[30px] leading-none text-ink">{t("favorites_page", locale)}</h1>
          <p className="mt-1 font-mono text-[10px] text-ink-quiet">
            {favoriteCompanies.length} {t("favorites_count", locale)}
          </p>
        </div>
      </div>

      {favoriteCompanies.length === 0 ? (
        <div id="favorites-empty-state" className="ontwerp-card is-warm p-5 text-center">
          <p className="font-mono text-[11px] text-ink-soft">{t("favorites_empty", locale)}</p>
        </div>
      ) : (
        <div id="favorites-list" className="space-y-3">
          {favoriteCompanies.map((company) => (
            <FavoriteCard key={company.company_id} company={company} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
