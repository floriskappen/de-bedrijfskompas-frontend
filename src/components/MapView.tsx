import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Company } from "../lib/company-data/types";

interface MapViewProps {
  companies: Company[];
  mapboxToken: string;
}

const PIN_INNER_CLASS =
  "w-[12px] h-[12px] rounded-full bg-ink border-[1.5px] border-paper shadow-[0_0_0_5px_rgba(31,27,22,0.07)]";

// Companies that share an address (e.g. an incubator) collide on the same
// latlng. Spread collocated pins on a small pixel-space rosette around the
// shared point so each pin is individually visible and tappable.
//
// Uses Vogel's sunflower / phyllotaxis spiral: position i sits at radius
// `scale * sqrt(i + 0.5)` and angle `i * golden_angle`. This keeps nearest
// neighbours roughly equidistant for any N, so the layout stays non-
// overlapping whether there are 2 or 50 companies at one point. Scale ~10
// keeps the minimum neighbour distance above the ~15px pin diameter.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ROSETTE_SCALE_PX = 10;
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

export default function MapView({ companies, mapboxToken }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

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
            el.className = "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.5)]";
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

    const pinOffsets = computePinOffsets(companies);

    // Determine initial selection
    const searchParams = new URLSearchParams(window.location.search);
    const initialSelected = searchParams.get("selected");
    const selectedCompany = initialSelected ? companies.find((c) => c.company_id === initialSelected) : null;

    // 8.4 When ?selected resolves to an unknown id, strip the param without opening a peek card
    if (initialSelected && !selectedCompany) {
      const url = new URL(window.location.href);
      url.searchParams.delete("selected");
      window.history.replaceState({}, "", url.toString());
    }

    // Support WebGL fallback for headless E2E testing
    if (!mapboxgl.supported()) {
      console.warn("WebGL not supported. Rendering fallback map for tests.");
      
      const container = mapContainerRef.current;
      container.style.position = "relative";
      container.style.backgroundColor = "#eee";
      
      const bgClick = () => updateSelection(null);
      container.addEventListener("click", bgClick);

      const createdElements: HTMLDivElement[] = [];

      companies.forEach((company) => {
        if (!company.latlng) return;

        const el = document.createElement("div");
        el.setAttribute("data-company-id", company.company_id);
        el.id = `pin-${company.company_id}`;

        el.className = "absolute";

        const innerEl = document.createElement("div");
        innerEl.className = `${PIN_INNER_CLASS} cursor-pointer transition-all duration-200 pin-inner`;

        el.appendChild(innerEl);

        const xPct = ((company.latlng.lng - 4.8) / 0.6) * 100;
        const yPct = (1 - (company.latlng.lat - 52.0) / 0.4) * 100;
        el.style.left = `${Math.max(10, Math.min(90, xPct))}%`;
        el.style.top = `${Math.max(10, Math.min(90, yPct))}%`;
        const [ox, oy] = pinOffsets[company.company_id] ?? [0, 0];
        if (ox || oy) el.style.transform = `translate(${ox}px, ${oy}px)`;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const currentParams = new URLSearchParams(window.location.search);
          const currentSelected = currentParams.get("selected");
          console.log("[fallback] click on:", company.company_id, "currentSelected:", currentSelected);
          if (currentSelected === company.company_id) {
            updateSelection(null);
          } else {
            updateSelection(company.company_id);
          }
        });

        container.appendChild(el);
        createdElements.push(el);
      });

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
        container.removeEventListener("click", bgClick);
        createdElements.forEach(el => el.remove());
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

    // 6.3 Auto-fit bounds on cold load if no selection
    if (!selectedCompany && companies.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      companies.forEach((c) => {
        if (c.latlng) {
          bounds.extend([c.latlng.lng, c.latlng.lat]);
        }
      });
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, animate: false });
    }

    // Handle map click to clear selection
    map.on("click", () => {
      updateSelection(null);
    });

    // Add markers
    companies.forEach((company) => {
      if (!company.latlng) return;

      const el = document.createElement("div");
      el.setAttribute("data-company-id", company.company_id);
      el.id = `pin-${company.company_id}`;

      const innerEl = document.createElement("div");
      innerEl.className = `${PIN_INNER_CLASS} cursor-pointer transition-all duration-200 pin-inner`;

      el.appendChild(innerEl);

      // Handle marker click
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const currentParams = new URLSearchParams(window.location.search);
        const currentSelected = currentParams.get("selected");
        console.log("[mapbox] click on:", company.company_id, "currentSelected:", currentSelected);
        if (currentSelected === company.company_id) {
          updateSelection(null);
        } else {
          updateSelection(company.company_id);
        }
      });

      const marker = new mapboxgl.Marker({
        element: el,
        offset: pinOffsets[company.company_id] ?? [0, 0],
      })
        .setLngLat([company.latlng.lng, company.latlng.lat])
        .addTo(map);

      markersRef.current[company.company_id] = marker;
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
      map.remove();
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

  // React to selectedId changes to update marker DOM elements (selected class/ring) and pan map
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

    companies.forEach((company) => {
      const el = document.querySelector(`[data-company-id="${company.company_id}"]`);
      if (el) {
        const innerEl = el.querySelector(".pin-inner");
        if (innerEl) {
          if (company.company_id === selectedId) {
            innerEl.classList.add("ring-2", "ring-offset-2", "ring-red", "scale-110");
            el.classList.add("z-50");
          } else {
            innerEl.classList.remove("ring-2", "ring-offset-2", "ring-red", "scale-110");
            el.classList.remove("z-50");
          }
        }
      }
    });
  }, [selectedId, companies]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} id="map-view" className="w-full h-full" />
      
      <button
        id="geolocate-button"
        onClick={handleGeolocate}
        className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-10 h-10 bg-paper/85 text-ink-soft border border-ink/25 hover:bg-paper hover:text-ink hover:border-ink/40 active:scale-95 transition-all cursor-pointer"
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

      {userLocation && !mapboxgl.supported() && (
        <div
          id="user-location-marker"
          className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(59,130,246,0.5)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${Math.max(10, Math.min(90, ((userLocation.lng - 4.8) / 0.6) * 100))}%`,
            top: `${Math.max(10, Math.min(90, (1 - (userLocation.lat - 52.0) / 0.4) * 100))}%`,
          }}
        />
      )}
    </div>
  );
}
