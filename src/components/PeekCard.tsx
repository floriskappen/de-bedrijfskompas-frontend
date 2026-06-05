import React, { useEffect, useRef, useState } from "react";
import type { Company } from "../lib/company-data/types";
import { getLocalizedField } from "../lib/company-data";
import { t } from "../lib/i18n";
import { concealThenNavigate } from "../lib/transitions/bloom-curtain";
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
  const [displayedId, setDisplayedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startY: number; cardH: number; moved: boolean } | null>(null);
  const skipExitAnimRef = useRef(false);

  // Sync intent (selectedId) into the rendered card (displayedId). When the
  // selection clears externally (tap-out, Escape), play a quick exit
  // animation before unmounting. Drag-close skips this because the drag
  // already animated the card out.
  useEffect(() => {
    if (selectedId) {
      const card = cardRef.current;
      if (card) card.classList.remove("peek-card-exit");
      setFaviconFailed(false);
      setDisplayedId(selectedId);
      return;
    }
    if (!displayedId) return;
    if (skipExitAnimRef.current) {
      skipExitAnimRef.current = false;
      setDisplayedId(null);
      return;
    }
    const card = cardRef.current;
    if (!card) {
      setDisplayedId(null);
      return;
    }
    card.style.transition = "";
    card.style.transform = "";
    card.style.animation = "";
    card.classList.remove("peek-card-enter");
    // force reflow so the exit keyframe restarts cleanly
    void card.offsetWidth;
    card.classList.add("peek-card-exit");
    const onEnd = () => {
      card.removeEventListener("animationend", onEnd);
      setDisplayedId(null);
    };
    card.addEventListener("animationend", onEnd);
  }, [selectedId]);

  const dispatchClose = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("selected");
    window.history.pushState({}, "", url.toString());
    setSelectedId(null);
    window.dispatchEvent(
      new CustomEvent("selection-changed", { detail: { companyId: null } })
    );
  };

  const navigate = () => {
    // bloom out from the centre of the card, then load the detail page
    const rect = cardRef.current?.getBoundingClientRect();
    const ox = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const oy = rect ? rect.top + rect.height / 2 : window.innerHeight * 0.8;
    concealThenNavigate(ctaUrl, ox, oy);
  };

  // The whole card is the drag surface: drag it down past a third of its height
  // to dismiss, or release without really moving (a tap) to open the profile.
  // The top-right action buttons stop propagation so they never start a drag.
  const onCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const cardH = cardRef.current.getBoundingClientRect().height;
    dragStartRef.current = { startY: e.clientY, cardH, moved: false };
    cardRef.current.setPointerCapture(e.pointerId);
    // disable entrance animation / prior transitions so inline transform wins
    cardRef.current.style.animation = "none";
    cardRef.current.style.transition = "none";
    cardRef.current.style.transform = "translateY(0px)";
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStartRef.current;
    if (!s || !cardRef.current) return;
    const raw = e.clientY - s.startY;
    if (Math.abs(raw) > 4) s.moved = true;
    // down: 1:1 finger tracking. up: very stiff rubber-band capped at -20px.
    const y = raw >= 0 ? raw : Math.max(-20, raw / 6);
    cardRef.current.style.transform = `translateY(${y}px)`;
  };

  const onCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragStartRef.current;
    dragStartRef.current = null;
    if (!s || !cardRef.current) return;
    const card = cardRef.current;
    const raw = e.clientY - s.startY;
    const shouldClose = raw > s.cardH * 0.3;
    if (shouldClose) {
      card.style.transition = "transform 160ms steps(4, end)";
      const cleanup = () => {
        card.removeEventListener("transitionend", cleanup);
        skipExitAnimRef.current = true;
        dispatchClose();
      };
      card.addEventListener("transitionend", cleanup);
      card.style.transform = `translateY(${s.cardH}px)`;
      return;
    }
    // a tap (no real movement) opens the profile; a small drag snaps back
    if (!s.moved) {
      navigate();
      return;
    }
    card.style.transition = "transform 160ms steps(4, end)";
    card.style.transform = "translateY(0px)";
  };

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate();
    }
  };

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

  if (!displayedId) return null;

  const company = companies.find((c) => c.company_id === displayedId);
  if (!company) return null;

  const city = company.address?.city || t("address_fallback", locale);
  const tagline = getLocalizedField(company, locale, "tagline") || t("tagline_fallback", locale);

  const distance =
    userLoc && company.latlng
      ? haversineDistance(userLoc, company.latlng).toFixed(1)
      : null;

  const ctaUrl = locale === "en" ? `/en/${company.company_id}/` : `/${company.company_id}/`;
  const monogram = (company.name || "?").trim().charAt(0).toUpperCase();

  // keep action buttons from starting a card drag or triggering the tap-to-open
  const stopDrag = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={cardRef}
      id="peek-card"
      role="button"
      tabIndex={0}
      aria-label={`${t("cta", locale)} — ${company.name}`}
      className="peek-card-enter peek-card-float ontwerp-card is-warm relative w-full max-w-md mx-auto px-5 pt-4 pb-5 pointer-events-auto will-change-transform cursor-pointer touch-none select-none"
      onPointerDown={onCardPointerDown}
      onPointerMove={onCardPointerMove}
      onPointerUp={onCardPointerUp}
      onPointerCancel={onCardPointerUp}
      onKeyDown={onCardKeyDown}
    >
      {/* top-right actions: favourite + close (drag-down and tap-out also close) */}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        <button
          className="ontwerp-icon-button is-compact"
          aria-label={t("bookmark_label", locale)}
          type="button"
          onPointerDown={stopDrag}
          onClick={stopDrag}
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
        <button
          className="ontwerp-icon-button is-compact"
          aria-label={t("close_label", locale)}
          type="button"
          onPointerDown={stopDrag}
          onClick={(e) => {
            stopDrag(e);
            dispatchClose();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* pentagon — the headline of the card, given the most room */}
      <div className="flex justify-center pt-1">
        <Pentagon scores={company.scores} locale={locale} />
      </div>

      {/* identity: favicon + name + locality/distance */}
      <div className="flex items-center gap-3">
        {company.favicon_url && !faviconFailed ? (
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center border border-border-quiet bg-[var(--wash-wine)]">
            <img
              src={company.favicon_url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFaviconFailed(true)}
            />
          </div>
        ) : (
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-ink font-sans text-[26px] leading-none text-paper normal-case">
            {monogram}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2
            id="peek-card-title"
            className="font-sans text-[26px] leading-none text-ink normal-case"
          >
            {company.name}
          </h2>
          <p className="mt-1 font-sans text-[12px] text-ink-quiet">
            {city}
            {distance !== null && ` · ${distance} km`}
          </p>
        </div>
      </div>

      {/* description — plain inline text, no card chrome or header */}
      <p className="mt-3.5 font-sans text-[15px] leading-snug text-ink-soft">{tagline}</p>
    </div>
  );
}
