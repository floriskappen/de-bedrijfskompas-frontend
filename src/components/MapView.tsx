import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Company } from "../lib/company-data/types";
import { computeAggregate, pinTier } from "../lib/company-data";

interface MapViewProps {
  companies: Company[];
  mapboxToken: string;
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

        el.className = "absolute w-[18px] h-[18px]";

        const innerEl = document.createElement("div");
        innerEl.className = "w-full h-full rounded-full border border-paper-warm cursor-pointer transition-all duration-200 pin-inner bg-ink shadow-[0_0_0_4px_rgba(28,25,23,0.15)]";

        el.appendChild(innerEl);

        const xPct = ((company.latlng.lng - 4.8) / 0.6) * 100;
        const yPct = (1 - (company.latlng.lat - 52.0) / 0.4) * 100;
        el.style.left = `${Math.max(10, Math.min(90, xPct))}%`;
        el.style.top = `${Math.max(10, Math.min(90, yPct))}%`;

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
    map.on("click", (e) => {
      updateSelection(null);
    });

    // Add markers
    companies.forEach((company) => {
      if (!company.latlng) return;

      const el = document.createElement("div");
      el.setAttribute("data-company-id", company.company_id);
      el.id = `pin-${company.company_id}`;

      el.style.width = "18px";
      el.style.height = "18px";

      const innerEl = document.createElement("div");
      innerEl.className = "w-full h-full rounded-full border border-paper-warm cursor-pointer transition-all duration-200 pin-inner bg-ink shadow-[0_0_0_4px_rgba(28,25,23,0.15)]";

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

      const marker = new mapboxgl.Marker({ element: el })
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
      if (company && company.latlng) {
        mapRef.current.panTo([company.latlng.lng, company.latlng.lat]);
      }
    }

    companies.forEach((company) => {
      const el = document.querySelector(`[data-company-id="${company.company_id}"]`);
      if (el) {
        const innerEl = el.querySelector(".pin-inner");
        if (innerEl) {
          if (company.company_id === selectedId) {
            innerEl.classList.add("ring-2", "ring-offset-2", "ring-ink", "scale-110");
            el.classList.add("z-50");
          } else {
            innerEl.classList.remove("ring-2", "ring-offset-2", "ring-ink", "scale-110");
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
        className="absolute bottom-6 right-6 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-paper-warm text-ink border border-ink shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-paper-card active:scale-95 transition-all cursor-pointer"
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
          className="w-6 h-6"
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
