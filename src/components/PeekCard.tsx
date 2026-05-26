import React, { useEffect, useState } from "react";
import type { Company } from "../lib/company-data/types";
import { getLocalizedField } from "../lib/company-data";
import { t } from "../lib/i18n";
import Pentagon from "./Pentagon";

interface PeekCardProps {
  companies: Company[];
  locale: "nl" | "en";
}

function haversineDistance(coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PeekCard({ companies, locale }: PeekCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Read initial from URL on mount
    const searchParams = new URLSearchParams(window.location.search);
    const initialSelected = searchParams.get("selected");
    if (initialSelected && companies.some((c) => c.company_id === initialSelected)) {
      setSelectedId(initialSelected);
    }

    // Listen to selection-changed events
    const handleSelectionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail?.companyId;
      setSelectedId(id);
    };

    // Keyboard Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const url = new URL(window.location.href);
        url.searchParams.delete("selected");
        window.history.pushState({}, "", url.toString());
        setSelectedId(null);
        window.dispatchEvent(new CustomEvent("selection-changed", { detail: { companyId: null } }));
      }
    };

    // Listen to user-location-changed events
    const handleUserLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setUserLoc(customEvent.detail);
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
  
  // Compute distance in km
  const distance = (userLoc && company.latlng)
    ? haversineDistance(userLoc, company.latlng).toFixed(1)
    : null;
  
  // CTA URL: /<slug>/ on nl, /en/<slug>/ on en
  const ctaUrl = locale === "en" ? `/en/${company.company_id}/` : `/${company.company_id}/`;

  const handleClose = () => {
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete("selected");
    window.history.pushState({}, "", url.toString());
    
    // Set local state & notify MapView
    setSelectedId(null);
    window.dispatchEvent(new CustomEvent("selection-changed", { detail: { companyId: null } }));
  };

  return (
    <div 
      className="w-full max-w-lg mx-auto bg-paper-card border-t border-x border-ink/10 rounded-t-2xl shadow-xl p-6 pointer-events-auto transform translate-y-0 transition-transform duration-300 ease-out"
      style={{ contentVisibility: "auto" }}
    >
      {/* Drag handle & close button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 id="peek-card-title" className="text-xl font-bold tracking-tight text-ink lowercase">
            {company.name}
          </h2>
          <p className="text-xs font-mono text-ink/60 lowercase mt-0.5 animate-fade-in">
            {city}{distance !== null && ` • ${distance} km`}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-ink/5 text-ink/40 hover:text-ink/80 focus:outline-none focus:ring-2 focus:ring-ink"
          aria-label="close peek card"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tagline */}
      <p className="text-sm text-ink/80 lowercase leading-relaxed mb-5">
        {tagline}
      </p>

      {/* Pentagon Visualization */}
      <div className="mb-6">
        <Pentagon scores={company.scores} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Primary CTA */}
        <a
          href={ctaUrl}
          className="flex-1 bg-ink text-paper-warm text-sm font-medium py-3 px-4 rounded-xl text-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink lowercase transition-all"
        >
          {t("cta", locale)}
        </a>

        {/* Secondary Bookmark Action (Inert) */}
        <button
          className="p-3 bg-ink/5 hover:bg-ink/10 text-ink/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink"
          aria-label={t("bookmark_label", locale)}
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
