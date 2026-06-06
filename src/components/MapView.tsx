import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import type { AxisId, Company, DomainGroupId } from "../lib/company-data/types";
import { AXIS_IDS, DOMAIN_GROUP_IDS } from "../lib/company-data/types";
import {
  DEFAULT_AXIS_MINIMUMS,
  filterCompanies,
  getCompaniesForAxisFacet,
  getCompositeScore,
  getDomainGroupCounts,
  getHistogramBuckets,
  hasActiveFilters,
  type CompanyFilters,
} from "../lib/company-data/filters";
import { t } from "../lib/i18n";
import { getAxisLabel, getDomainGroupLabel } from "../lib/i18n/labels";
import { DOMAIN_ICON_PATHS } from "../lib/company-data/domain-icons";

interface MapViewProps {
  companies: Company[];
  mapboxToken: string;
  locale: "nl" | "en";
}

const PIN_BADGE_CLASS =
  "pin-inner score-badge";

function getScoreBadgeVariant(score: number | null): string {
  if (score === null) return "is-score-unknown";
  if (score >= 70) return "is-score-high";
  if (score >= 40) return "is-score-mid";
  return "is-score-low";
}

function DomainIcon({ domain }: { domain: DomainGroupId }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d={DOMAIN_ICON_PATHS[domain]}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Companies that share an address (e.g. an incubator) collide on the same
// latlng. Spread collocated pins on a small pixel-space rosette around the
// shared point so each pin is individually visible and tappable.
//
// Uses Vogel's sunflower / phyllotaxis spiral: position i sits at radius
// `scale * sqrt(i + 0.5)` and angle `i * golden_angle`. This keeps nearest
// neighbours roughly equidistant for any N, so the layout stays non-
// overlapping whether there are 2 or 50 companies at one point. Scale ~32
// keeps the minimum neighbour distance above the wider score badge footprint.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ROSETTE_SCALE_PX = 32;
function computePinOffsets(
  companies: Company[]
): Record<string, [number, number]> {
  const groups = new Map<string, string[]>();
  companies.forEach((c) => {
    if (!c.latlng) return;
    const key = `${c.latlng.lat.toFixed(6)},${c.latlng.lng.toFixed(6)}`;
    const arr = groups.get(key) ?? [];
    arr.push(c.company_id);
    groups.set(key, arr);
  });
  const offsets: Record<string, [number, number]> = {};
  groups.forEach((ids) => {
    if (ids.length === 1) {
      offsets[ids[0]] = [0, 0];
      return;
    }
    // sort for deterministic ordering — each company keeps the same slot
    ids.sort();
    ids.forEach((id, i) => {
      const radius = ROSETTE_SCALE_PX * Math.sqrt(i + 0.5);
      const angle = i * GOLDEN_ANGLE - Math.PI / 2;
      offsets[id] = [Math.cos(angle) * radius, Math.sin(angle) * radius];
    });
  });
  return offsets;
}

export default function MapView({ companies, mapboxToken, locale }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<CompanyFilters>({
    axisMinimums: { ...DEFAULT_AXIS_MINIMUMS },
    selectedDomains: [],
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // `isFilterOpen` is intent; `filterVisible` keeps the sheet mounted long
  // enough to play the stepped exit animation, mirroring the peek card.
  const [filterVisible, setFilterVisible] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelDragRef = useRef<{ startY: number; panelH: number } | null>(null);
  const skipPanelExitRef = useRef(false);

  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  // Determine initial selection and zoom
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialSelected = searchParams ? searchParams.get("selected") : null;
  const selectedCompany = initialSelected ? companies.find((c) => c.company_id === initialSelected) : null;
  const initialZoom = selectedCompany ? 13 : 10;

  // Clustering states
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [supercluster, setSupercluster] = useState<Supercluster | null>(null);

  const filteredCompanies = useMemo(() => filterCompanies(companies, filters), [companies, filters]);
  const filteredCompanyIds = useMemo(
    () => new Set(filteredCompanies.map((company) => company.company_id)),
    [filteredCompanies]
  );
  const companyById = useMemo(
    () => new Map(companies.map((company) => [company.company_id, company])),
    [companies]
  );
  const pinOffsets = useMemo(() => computePinOffsets(filteredCompanies), [filteredCompanies]);
  const domainCounts = useMemo(() => getDomainGroupCounts(companies, filters), [companies, filters]);
  const filtersActive = hasActiveFilters(filters);
  const activeFilterCount = useMemo(
    () =>
      filters.selectedDomains.length +
      AXIS_IDS.filter((axis) => (filters.axisMinimums[axis] ?? 0) > 0).length,
    [filters]
  );
  const histogramMaxima = useMemo(
    () =>
      AXIS_IDS.reduce(
        (maxima, axis) => {
          maxima[axis] = Math.max(1, ...getHistogramBuckets(companies, axis).map((bucket) => bucket.count));
          return maxima;
        },
        {} as Record<AxisId, number>
      ),
    [companies]
  );

  // Initialize Supercluster
  useEffect(() => {
    const sc = new Supercluster({
      radius: 40,
      maxZoom: 12,
    });

    const geojsonPoints = filteredCompanies
      .filter((c): c is Company & { latlng: { lat: number; lng: number } } => Boolean(c.latlng))
      .map((c) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          companyId: c.company_id,
          company: c,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [c.latlng.lng, c.latlng.lat],
        },
      }));

    sc.load(geojsonPoints);
    setSupercluster(sc);
  }, [filteredCompanies]);

  // Support window hooks for E2E tests
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).setTestZoom = (z: number) => {
        setZoom(z);
        if (mapboxgl.supported() && mapRef.current) {
          mapRef.current.setZoom(z);
        }
      };
      (window as any).setTestCenterAndZoom = (lng: number, lat: number, z: number) => {
        setZoom(z);
        if (mapboxgl.supported() && mapRef.current) {
          mapRef.current.setZoom(z);
          mapRef.current.setCenter([lng, lat]);
        }
      };
      (window as any).setTestFilters = (nextFilters: Partial<CompanyFilters>) => {
        setFilters((current) => ({
          axisMinimums: {
            ...current.axisMinimums,
            ...(nextFilters.axisMinimums ?? {}),
          },
          selectedDomains: nextFilters.selectedDomains ?? current.selectedDomains,
        }));
      };
    }
  }, []);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setUserLocation({ lat, lng });

        // Dispatch user-location-changed event
        window.dispatchEvent(
          new CustomEvent("user-location-changed", { detail: { lat, lng } })
        );

        // Center map & update Mapbox marker
        if (mapboxgl.supported() && mapRef.current) {
          const map = mapRef.current;
          map.flyTo({ center: [lng, lat], zoom: 13 });

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([lng, lat]);
          } else {
            const el = document.createElement("div");
            el.id = "user-location-marker";
            el.className = "user-location-marker";
            const marker = new mapboxgl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);
            userMarkerRef.current = marker;
          }
        }
      },
      (error) => {
        console.warn("Geolocation error:", error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Determine initial selection
    const searchParams = new URLSearchParams(window.location.search);
    const initialSelected = searchParams.get("selected");
    const selectedCompany = initialSelected ? companies.find((c) => c.company_id === initialSelected) : null;

    // When ?selected resolves to an unknown id, strip the param without opening a peek card
    if (initialSelected && !selectedCompany) {
      const url = new URL(window.location.href);
      url.searchParams.delete("selected");
      window.history.replaceState({}, "", url.toString());
    }

    // Support WebGL fallback for headless E2E testing
    if (!mapboxgl.supported()) {
      console.warn("WebGL not supported. Rendering fallback map for tests.");
      
      if (selectedCompany) {
        setSelectedId(selectedCompany.company_id);
        window.dispatchEvent(
          new CustomEvent("selection-changed", { detail: { companyId: selectedCompany.company_id } })
        );
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          updateSelection(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      const handleExternalSelection = (e: Event) => {
        const customEvent = e as CustomEvent;
        const id = customEvent.detail?.companyId;
        setSelectedId(id);
      };
      window.addEventListener("selection-changed", handleExternalSelection);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("selection-changed", handleExternalSelection);
      };
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: (selectedCompany && selectedCompany.latlng) ? [selectedCompany.latlng.lng, selectedCompany.latlng.lat] : [4.9, 52.37],
      zoom: selectedCompany ? 13 : 10,
    });

    mapRef.current = map;

    // Auto-fit bounds on cold load if no selection
    if (!selectedCompany && companies.length > 0) {
      const boundsObj = new mapboxgl.LngLatBounds();
      companies.forEach((c) => {
        if (c.latlng) {
          boundsObj.extend([c.latlng.lng, c.latlng.lat]);
        }
      });
      map.fitBounds(boundsObj, { padding: 80, maxZoom: 14, animate: false });
    }

    const updateViewport = () => {
      setZoom(map.getZoom());
    };

    map.on("zoom", updateViewport);
    map.on("move", updateViewport);

    // Initial viewport sync
    updateViewport();

    // Handle map click to clear selection
    map.on("click", () => {
      updateSelection(null);
    });

    // Set initial selection state
    if (selectedCompany) {
      setSelectedId(selectedCompany.company_id);
      window.dispatchEvent(
        new CustomEvent("selection-changed", { detail: { companyId: selectedCompany.company_id } })
      );
    }

    // Keyboard Escape listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        updateSelection(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Listen to selection-changed events
    const handleExternalSelection = (e: Event) => {
      const customEvent = e as CustomEvent;
      const id = customEvent.detail?.companyId;
      setSelectedId(id);
    };
    window.addEventListener("selection-changed", handleExternalSelection);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("selection-changed", handleExternalSelection);
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      // Remove all remaining markers
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [companies, mapboxToken]);

  // Update URL and state, and dispatch event
  const updateSelection = (id: string | null) => {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set("selected", id);
    } else {
      url.searchParams.delete("selected");
    }
    window.history.pushState({}, "", url.toString());
    setSelectedId(id);
    window.dispatchEvent(new CustomEvent("selection-changed", { detail: { companyId: id } }));
  };

  useEffect(() => {
    if (selectedId && !filteredCompanyIds.has(selectedId)) {
      updateSelection(null);
    }
  }, [filteredCompanyIds, selectedId]);

  const updateAxisMinimum = (axis: AxisId, minimum: number) => {
    setFilters((current) => ({
      ...current,
      axisMinimums: {
        ...current.axisMinimums,
        [axis]: minimum,
      },
    }));
  };

  const toggleDomain = (domain: DomainGroupId) => {
    setFilters((current) => {
      const selectedDomains = current.selectedDomains.includes(domain)
        ? current.selectedDomains.filter((selectedDomain) => selectedDomain !== domain)
        : [...current.selectedDomains, domain];

      return {
        ...current,
        selectedDomains,
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      axisMinimums: { ...DEFAULT_AXIS_MINIMUMS },
      selectedDomains: [],
    });
  };

  // Drag the panel header down to dismiss it, mirroring the peek card gesture.
  const onPanelHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    const panelH = panelRef.current.getBoundingClientRect().height;
    panelDragRef.current = { startY: e.clientY, panelH };
    e.currentTarget.setPointerCapture(e.pointerId);
    panelRef.current.style.animation = "none";
    panelRef.current.style.transition = "none";
    panelRef.current.style.transform = "translateY(0px)";
  };

  const onPanelHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = panelDragRef.current;
    if (!s || !panelRef.current) return;
    const raw = e.clientY - s.startY;
    // down: 1:1 tracking. up: stiff rubber-band capped at -20px.
    const y = raw >= 0 ? raw : Math.max(-20, raw / 6);
    panelRef.current.style.transform = `translateY(${y}px)`;
  };

  const onPanelHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = panelDragRef.current;
    if (!s || !panelRef.current) return;
    const panel = panelRef.current;
    const raw = e.clientY - s.startY;
    const shouldClose = raw > s.panelH * 0.3;
    panelDragRef.current = null;
    if (shouldClose) {
      panel.style.transition = "transform 160ms steps(4, end)";
      const cleanup = () => {
        panel.removeEventListener("transitionend", cleanup);
        // the drag already animated the sheet out — skip the keyframe exit
        skipPanelExitRef.current = true;
        setIsFilterOpen(false);
      };
      panel.addEventListener("transitionend", cleanup);
      panel.style.transform = `translateY(${s.panelH}px)`;
    } else {
      panel.style.transition = "transform 160ms steps(4, end)";
      panel.style.transform = "translateY(0px)";
    }
  };

  // Sync filter intent into the mounted sheet. Opening shows it immediately;
  // closing (tap-out, ×, Escape) plays the same stepped slide-out + backdrop
  // fade as the peek card before unmounting. Drag-close skips the keyframe.
  useEffect(() => {
    if (isFilterOpen) {
      setFilterVisible(true);
      panelRef.current?.classList.remove("is-exiting");
      backdropRef.current?.classList.remove("is-exiting");
      return;
    }
    if (!filterVisible) return;
    if (skipPanelExitRef.current) {
      skipPanelExitRef.current = false;
      setFilterVisible(false);
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      setFilterVisible(false);
      return;
    }
    // drop any inline drag transforms so the exit keyframe starts cleanly
    panel.style.transition = "";
    panel.style.transform = "";
    panel.style.animation = "";
    void panel.offsetWidth;
    panel.classList.add("is-exiting");
    backdropRef.current?.classList.add("is-exiting");
    const onEnd = () => {
      panel.removeEventListener("animationend", onEnd);
      setFilterVisible(false);
    };
    panel.addEventListener("animationend", onEnd);
  }, [isFilterOpen]);

  // Synchronize standard Mapbox markers
  useEffect(() => {
    if (!mapboxgl.supported() || !mapRef.current || !supercluster) return;
    const map = mapRef.current;
    const sc = supercluster;

    const currentZoom = Math.min(16, Math.round(zoom));
    const clusters = sc.getClusters([-180, -90, 180, 90], currentZoom);
    const nextMarkerKeys = new Set<string>();

    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const { cluster, point_count, companyId } = feature.properties;

      if (cluster) {
        const clusterId = feature.id as number;
        const key = `cluster-${clusterId}`;
        nextMarkerKeys.add(key);

        if (!markersRef.current[key]) {
          const el = document.createElement("div");
          el.id = `cluster-${clusterId}`;

          const innerEl = document.createElement("div");
          innerEl.className = "cluster-badge";
          innerEl.innerHTML = `<span>${point_count}</span>`;
          el.appendChild(innerEl);

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const expansionZoom = sc.getClusterExpansionZoom(clusterId);
            const targetZoom = Math.min(18, Math.max(Math.round(map.getZoom()) + 2, expansionZoom));
            map.easeTo({
              center: [lng, lat],
              zoom: targetZoom,
              duration: 160,
              easing: (t) => (t >= 1 ? 1 : Math.floor(t * 4) / 4),
            });
          });

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map);

          markersRef.current[key] = marker;
        }
      } else {
        const key = `pin-${companyId}`;
        nextMarkerKeys.add(key);

        if (!markersRef.current[key]) {
          const el = document.createElement("div");
          el.setAttribute("data-company-id", companyId);
          el.id = `pin-${companyId}`;

          const company = companyById.get(companyId);
          const score = company ? getCompositeScore(company) : null;
          const innerEl = document.createElement("div");
          innerEl.className = `${PIN_BADGE_CLASS} ${getScoreBadgeVariant(score)}`;
          innerEl.innerHTML = `<span aria-hidden="true" class="score-badge-dot"></span><span>${score === null ? "?" : String(score)}</span>`;
          innerEl.setAttribute("data-score-badge", score === null ? "unknown" : String(score));
          
          if (companyId === selectedId) {
            innerEl.classList.add("is-selected");
            el.classList.add("z-50");
          }

          el.appendChild(innerEl);

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            const currentSelectedId = selectedIdRef.current;
            if (currentSelectedId === companyId) {
              updateSelection(null);
            } else {
              updateSelection(companyId);
            }
          });

          const marker = new mapboxgl.Marker({
            element: el,
            offset: pinOffsets[companyId] ?? [0, 0],
          })
            .setLngLat([lng, lat])
            .addTo(map);

          markersRef.current[key] = marker;
        } else {
          // Update selected style
          const el = markersRef.current[key].getElement();
          const innerEl = el.querySelector(".pin-inner");
          if (innerEl) {
            if (companyId === selectedId) {
              innerEl.classList.add("is-selected");
              el.classList.add("z-50");
            } else {
              innerEl.classList.remove("is-selected");
              el.classList.remove("z-50");
            }
          }
        }
      }
    });

    // Remove markers that are no longer visible
    Object.keys(markersRef.current).forEach((key) => {
      if (!nextMarkerKeys.has(key)) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }
    });
  }, [zoom, supercluster, companyById, pinOffsets, selectedId]);

  // React to selectedId changes to pan map
  useEffect(() => {
    if (selectedId && mapRef.current) {
      const company = companies.find((c) => c.company_id === selectedId);
      if (company?.latlng) {
        const map = mapRef.current;
        const target: [number, number] = [company.latlng.lng, company.latlng.lat];
        // The peek card may still be mounting/animating in when selection
        // changes. Retry across a few animation frames until the card is in
        // the DOM with a real height, then pan with offset = -height/2 so
        // the pin centres in the strip of map visible above the card.
        let tries = 0;
        const tryPan = () => {
          const card = document.getElementById("peek-card");
          const h = card?.getBoundingClientRect().height ?? 0;
          if (h > 0 || tries >= 8) {
            map.easeTo({
              center: target,
              offset: [0, -h / 2],
              duration: 160,
              // 4-step easing matches the peek card's stepped slide-in
              easing: (t) => (t >= 1 ? 1 : Math.floor(t * 4) / 4),
            });
            return;
          }
          tries++;
          requestAnimationFrame(tryPan);
        };
        requestAnimationFrame(tryPan);
      }
    }
  }, [selectedId, companies]);

  const isSupported = mapboxgl.supported();
  const fallbackFeatures = !isSupported && supercluster
    ? supercluster.getClusters([-180, -90, 180, 90], Math.round(zoom))
    : [];
  const selectedDomainSet = new Set(filters.selectedDomains);

  return (
    <div className="relative w-full h-full">
      <div className="map-atmosphere" aria-hidden="true" />
      <div ref={mapContainerRef} id="map-view" className="w-full h-full">
        {!isSupported && (
          <div
            className="absolute inset-0 bg-paper-deep"
            onClick={() => updateSelection(null)}
          >
            {fallbackFeatures.map((feature) => {
              const [lng, lat] = feature.geometry.coordinates;
              const { cluster, point_count, companyId } = feature.properties;

              const xPct = ((lng - 4.8) / 0.6) * 100;
              const yPct = (1 - (lat - 52.0) / 0.4) * 100;

              const left = `${Math.max(10, Math.min(90, xPct))}%`;
              const top = `${Math.max(10, Math.min(90, yPct))}%`;

              if (cluster) {
                const clusterId = feature.id as number;
                return (
                  <div
                    key={`cluster-${clusterId}`}
                    id={`cluster-${clusterId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const expansionZoom = supercluster!.getClusterExpansionZoom(clusterId);
                      const targetZoom = Math.min(18, Math.max(Math.round(zoom) + 2, expansionZoom));
                      setZoom(targetZoom);
                    }}
                    className="absolute cluster-badge -translate-x-1/2 -translate-y-1/2"
                    style={{ left, top }}
                  >
                    <span>{point_count}</span>
                  </div>
                );
              } else {
                const [ox, oy] = pinOffsets[companyId] ?? [0, 0];
                const isSelected = companyId === selectedId;
                const company = companyById.get(companyId);
                const score = company ? getCompositeScore(company) : null;
                return (
                  <div
                    key={`pin-${companyId}`}
                    data-company-id={companyId}
                    id={`pin-${companyId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedId === companyId) {
                        updateSelection(null);
                      } else {
                        updateSelection(companyId);
                      }
                    }}
                    className="absolute cursor-pointer"
                    style={{
                      left,
                      top,
                      transform: `translate(${ox}px, ${oy}px) translate(-50%, -50%)`,
                      zIndex: isSelected ? 50 : undefined,
                    }}
                  >
                    <div
                      data-score-badge={score === null ? "unknown" : score}
                      className={`${PIN_BADGE_CLASS} ${getScoreBadgeVariant(score)} ${isSelected ? "is-selected" : ""}`}
                    >
                      <span aria-hidden="true" className="score-badge-dot" />
                      <span>{score === null ? "?" : score}</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {companies.length > 0 && filteredCompanies.length === 0 && (
        <div
          id="filtered-empty-state-overlay"
          className="absolute inset-0 z-10 flex items-center justify-center bg-paper/70 pointer-events-none"
        >
          <div className="ontwerp-card px-5 py-4 text-center">
            <p className="font-mono text-[10px] text-ink-soft">{t("empty_state", locale)}</p>
          </div>
        </div>
      )}

      <a
        id="about-button"
        href={locale === "en" ? "/en/about/" : "/over/"}
        aria-label={t("about", locale)}
        className="ontwerp-icon-button absolute top-4 left-4 z-20"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6.7" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M9 8.2v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="9" cy="5.7" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="0.7" />
        </svg>
      </a>

      <button
        id="filters-button"
        type="button"
        onClick={() => setIsFilterOpen(true)}
        aria-label={t("filters", locale)}
        aria-expanded={isFilterOpen}
        aria-controls="filters-panel"
        className="ontwerp-icon-button absolute top-4 right-4 z-20"
      >
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {activeFilterCount > 0 && (
          <span
            id="filters-active-count"
            className="filter-count-badge"
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {filterVisible && createPortal(
        <div
          ref={backdropRef}
          className="filter-backdrop fixed inset-0 z-[60] flex items-end"
          onClick={() => setIsFilterOpen(false)}
        >
          <section
            ref={panelRef}
            id="filters-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t("filters", locale)}
            className="filter-sheet ontwerp-sheet max-h-[82vh] w-full overflow-y-auto px-4 pb-6 will-change-transform"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 -mx-4 border-b border-border-quiet bg-[var(--filter-surface)] px-4 pt-2.5 pb-3">
              <div
                className="mx-auto mb-2 flex h-7 w-20 cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing"
                onPointerDown={onPanelHandlePointerDown}
                onPointerMove={onPanelHandlePointerMove}
                onPointerUp={onPanelHandlePointerUp}
                onPointerCancel={onPanelHandlePointerUp}
                aria-label={t("drag_handle", locale)}
                role="button"
              >
                <div className="drag-handle-bar" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono text-[11px] text-ink">{t("filters", locale)}</h2>
                  <p className="mt-1 text-[12px] text-ink-quiet">
                    {filteredCompanies.length}/{companies.length} bedrijven
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="filters-reset"
                    type="button"
                    onClick={resetFilters}
                    disabled={!filtersActive}
                    className="ontwerp-button h-9"
                  >
                    reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    aria-label="sluit filters"
                    className="ontwerp-icon-button is-compact"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {AXIS_IDS.map((axis) => {
                const facetCompanies = getCompaniesForAxisFacet(companies, filters, axis);
                const buckets = getHistogramBuckets(facetCompanies, axis);
                const maxCount = histogramMaxima[axis];
                const value = filters.axisMinimums[axis] ?? 0;

                return (
                  <section key={axis} data-axis-filter={axis} className="ontwerp-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-mono text-[9px] text-ink-soft">{getAxisLabel(axis, locale)}</h3>
                      <span className="font-mono text-[9px] text-red-dark">{value === 0 ? "geen voorkeur" : `min ${value}`}</span>
                    </div>
                    <div className="mb-2 grid grid-cols-[1.4rem_1fr] items-end gap-2">
                      <div className="flex h-12 flex-col items-center justify-end gap-1" aria-label={`${getAxisLabel(axis, locale)} onbekend`}>
                        {buckets.filter((bucket) => bucket.id === "unknown").map((bucket) => (
                          <div key={bucket.id} data-axis={axis} data-bucket={bucket.id} title={`${bucket.label}: ${bucket.count}`} className="flex h-full w-full flex-col items-center justify-end gap-1">
                            <div className="w-full bg-ink-faint opacity-80" style={{ height: `${Math.max(4, (bucket.count / maxCount) * 34)}px` }} />
                            <span className="font-mono text-[7px] text-ink-quiet">?</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex h-12 items-end gap-1" aria-label={`${getAxisLabel(axis, locale)} verdeling`}>
                      {buckets.map((bucket) => (
                        bucket.id === "unknown" ? null : (
                        <div
                          key={bucket.id}
                          data-axis={axis}
                          data-bucket={bucket.id}
                          title={`${bucket.label}: ${bucket.count}`}
                          className={`flex min-w-0 flex-1 flex-col items-center justify-end gap-1 ${
                            bucket.minimum !== null && bucket.minimum >= value ? "opacity-100" : "opacity-35"
                          }`}
                        >
                          <div
                            className="w-full bg-ink opacity-80"
                            style={{ height: `${Math.max(4, (bucket.count / maxCount) * 34)}px` }}
                          />
                          <span className="font-mono text-[7px] text-ink-quiet">{bucket.id}</span>
                        </div>
                        )
                      ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[1.4rem_1fr] gap-2">
                      <div />
                      <div>
                        <input
                          aria-label={`${getAxisLabel(axis, locale)} minimum`}
                          type="range"
                          min="0"
                          max="90"
                          step="10"
                          value={value}
                          onChange={(event) => updateAxisMinimum(axis, Number(event.currentTarget.value))}
                          className="filter-range w-full"
                        />
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <section className="mt-5">
              <h3 className="mb-2 font-mono text-[10px] text-ink-soft">{t("work_fields", locale)}</h3>
              {DOMAIN_GROUP_IDS.some((domain) => domainCounts[domain] > 0 || selectedDomainSet.has(domain)) ? (
                <div className="flex flex-wrap gap-2">
                  {DOMAIN_GROUP_IDS.filter((domain) => domainCounts[domain] > 0 || selectedDomainSet.has(domain)).map((domain) => {
                    const selected = selectedDomainSet.has(domain);
                    return (
                      <button
                        key={domain}
                        type="button"
                        data-domain-filter={domain}
                        aria-pressed={selected}
                        onClick={() => toggleDomain(domain)}
                        className="filter-chip"
                      >
                        <DomainIcon domain={domain} />
                        <span>{getDomainGroupLabel(domain, locale)}</span>
                        <span className="font-mono text-[9px]">{domainCounts[domain]}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p id="domains-empty-state" className="ontwerp-card p-3 text-[12px] text-ink-quiet">
                  {t("work_fields_empty", locale)}
                </p>
              )}
            </section>
          </section>
        </div>,
        document.body
      )}

      <button
        id="geolocate-button"
        onClick={handleGeolocate}
        className="ontwerp-icon-button absolute bottom-6 right-6 z-10"
        aria-label="get current location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
        </svg>
      </button>

      {userLocation && !isSupported && (
        <div
          id="user-location-marker"
          className="user-location-marker absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${Math.max(10, Math.min(90, ((userLocation.lng - 4.8) / 0.6) * 100))}%`,
            top: `${Math.max(10, Math.min(90, (1 - (userLocation.lat - 52.0) / 0.4) * 100))}%`,
          }}
        />
      )}
    </div>
  );
}
