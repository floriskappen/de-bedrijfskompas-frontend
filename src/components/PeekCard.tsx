import React, { useEffect, useState } from "react";
import type { Company } from "../lib/company-data/types";
import { getLocalizedField } from "../lib/company-data";
import { t } from "../lib/i18n";
import Pentagon from "./Pentagon";

interface PeekCardProps {
  companies: Company[];
  locale: "nl" | "en";
}

function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PeekCard({ companies, locale }: PeekCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialSelected = searchParams.get("selected");
    if (initialSelected && companies.some((c) => c.company_id === initialSelected)) {
      setSelectedId(initialSelected);
    }

    const handleSelectionChange = (e: Event) => {
      const id = (e as CustomEvent).detail?.companyId;
      setSelectedId(id);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const url = new URL(window.location.href);
        url.searchParams.delete("selected");
        window.history.pushState({}, "", url.toString());
        setSelectedId(null);
        window.dispatchEvent(
          new CustomEvent("selection-changed", { detail: { companyId: null } })
        );
      }
    };

    const handleUserLocationChange = (e: Event) => {
      setUserLoc((e as CustomEvent).detail);
    };

    window.addEventListener("selection-changed", handleSelectionChange);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("user-location-changed", handleUserLocationChange);
    return () => {
      window.removeEventListener("selection-changed", handleSelectionChange);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("user-location-changed", handleUserLocationChange);
    };
  }, [companies]);

  if (!selectedId) return null;

  const company = companies.find((c) => c.company_id === selectedId);
  if (!company) return null;

  const city = company.address?.city || t("address_fallback", locale);
  const tagline = getLocalizedField(company, locale, "tagline") || t("tagline_fallback", locale);

  const distance =
    userLoc && company.latlng
      ? haversineDistance(userLoc, company.latlng).toFixed(1)
      : null;

  const ctaUrl = locale === "en" ? `/en/${company.company_id}/` : `/${company.company_id}/`;
  const monogram = (company.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className="w-full max-w-lg mx-auto bg-paper-card paper-grain border-t border-x border-ink/15 shadow-[0_-8px_24px_rgba(31,27,22,0.10)] px-5 pt-2.5 pb-9 pointer-events-auto"
      style={{ contentVisibility: "auto" }}
    >
      {/* drag handle */}
      <div className="mx-auto mb-3.5 h-1 w-10 rounded-sm bg-ink/20" />

      {/* header row: monogram + name + locality/distance */}
      <div className="mb-3.5 flex items-center gap-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-ink font-sans text-[26px] leading-none text-paper normal-case">
          {monogram}
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="peek-card-title"
            className="font-sans text-[26px] leading-none tracking-tight text-ink normal-case"
          >
            {company.name}
          </h2>
          <p className="mt-1 font-sans text-[12px] text-ink-quiet">
            {city}
            {distance !== null && ` · ${distance} km`}
          </p>
        </div>
      </div>

      {/* "in het echt" callout */}
      <div className="mb-3.5 bg-red-soft px-3.5 py-3">
        <div className="mb-1 font-mono text-[9.5px] tracking-[0.15em] uppercase text-red-dark">
          {t("in_het_echt", locale)}
        </div>
        <div className="font-sans text-[16px] leading-snug text-ink">{tagline}</div>
      </div>

      {/* pentagon */}
      <div className="flex justify-center pt-0.5 pb-4">
        <Pentagon scores={company.scores} />
      </div>

      {/* CTA + bookmark */}
      <div className="flex gap-2">
        <a
          href={ctaUrl}
          className="flex h-12 flex-1 items-center justify-center gap-2 bg-ink px-4 font-sans text-[14px] font-medium tracking-[0.01em] text-paper hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-opacity"
        >
          {t("cta", locale)}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 7h8m-3-3l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <button
          className="flex h-12 w-12 items-center justify-center border border-ink/20 bg-transparent text-ink hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-ink"
          aria-label={t("bookmark_label", locale)}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2l2.09 4.26L16 7l-3.5 3.4.83 4.6L9 13l-4.33 2L5.5 10.4 2 7l4.91-.74L9 2z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
