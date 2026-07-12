"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Listing, Lang } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { tr, loc } from "@/lib/i18n";
import Icon from "./ui/Icon";

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

function priceIcon(label: string, active: boolean) {
  // Airbnb-style price pin: white pill by default, flips to solid black
  // (ink-950) with white text when hovered/active, and scales up.
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${active ? "#070708" : "#ffffff"};
      color:${active ? "#ffffff" : "#0d0d10"};
      font-size:13px;font-weight:800;letter-spacing:-0.01em;
      padding:6px 11px;border-radius:9999px;white-space:nowrap;
      box-shadow:0 6px 16px rgba(7,7,8,${active ? ".34" : ".18"});
      border:1px solid ${active ? "#070708" : "rgba(13,13,16,0.10)"};
      transform:scale(${active ? 1.12 : 1});
      transition:transform .15s ease, background .15s ease, color .15s ease;">
      ${label}</div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 15]
  });
}

function clusterIcon(count: number) {
  const size = count >= 10 ? 44 : 38;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:#070708;color:#fff;display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:800;box-shadow:0 8px 20px rgba(7,7,8,.35);
      border:2.5px solid #ffffff;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    // Csak az első betöltéskor illesztünk — mozgatás után nem rángatjuk vissza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function priceShort(price: number): string {
  return price >= 1000000 ? `€${(price / 1000000).toFixed(1)}M` : `€${Math.round(price / 1000)}k`;
}

/** Zoom + mozgás követése: klaszter-számításhoz és terület-kereséshez. */
function ViewportWatcher({
  onZoom,
  areaSearch,
  onBoundsChange
}: {
  onZoom: (z: number) => void;
  areaSearch: boolean;
  onBoundsChange?: (b: MapBounds) => void;
}) {
  const map = useMapEvents({
    zoomend: () => {
      onZoom(map.getZoom());
      if (areaSearch) emit();
    },
    dragend: () => {
      if (areaSearch) emit();
    }
  });
  const emit = () => {
    const b = map.getBounds();
    onBoundsChange?.({
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast()
    });
  };
  // Bekapcsoláskor azonnal alkalmazzuk az aktuális kivágatot.
  useEffect(() => {
    if (areaSearch) emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaSearch]);
  return null;
}

/** Egyszerű rács-alapú klaszterezés az aktuális zoomhoz. */
function clusterize(listings: Listing[], zoom: number) {
  // ~140 px-nyi cella fokban: 360° / 2^zoom a világ szélessége 256 px-en.
  const cell = (360 / Math.pow(2, zoom)) * (140 / 256);
  const buckets = new Map<string, Listing[]>();
  for (const l of listings) {
    const key = `${Math.round(l.lat / cell)}:${Math.round(l.lng / cell)}`;
    const arr = buckets.get(key);
    if (arr) arr.push(l);
    else buckets.set(key, [l]);
  }
  const singles: Listing[] = [];
  const clusters: { lat: number; lng: number; items: Listing[] }[] = [];
  for (const items of buckets.values()) {
    if (items.length === 1) singles.push(items[0]);
    else {
      clusters.push({
        lat: items.reduce((a, l) => a + l.lat, 0) / items.length,
        lng: items.reduce((a, l) => a + l.lng, 0) / items.length,
        items
      });
    }
  }
  return { singles, clusters };
}

function ClusterMarker({
  lat,
  lng,
  count
}: {
  lat: number;
  lng: number;
  count: number;
}) {
  const map = useMap();
  return (
    <Marker
      position={[lat, lng]}
      icon={clusterIcon(count)}
      eventHandlers={{
        click: () => map.flyTo([lat, lng], Math.min(map.getZoom() + 2, 16), { duration: 0.5 })
      }}
    />
  );
}

export default function MapView({
  listings,
  lang,
  activeId,
  onActivate,
  onSelect,
  areaSearchable = false,
  onBoundsChange,
  areaSearch = false,
  onToggleAreaSearch
}: {
  listings: Listing[];
  lang: Lang;
  activeId?: string | null;
  onActivate?: (id: string | null) => void;
  /** Ha meg van adva, pin-koppintás popup helyett ezt hívja (mobil bottom-sheet). */
  onSelect?: (l: Listing) => void;
  /** Mutassuk-e a "keresés ezen a területen" kapcsolót. */
  areaSearchable?: boolean;
  onBoundsChange?: (b: MapBounds) => void;
  areaSearch?: boolean;
  onToggleAreaSearch?: () => void;
}) {
  const center: [number, number] = [42.4, 18.8];
  const [zoom, setZoom] = useState(9);

  const { singles, clusters } = useMemo(() => clusterize(listings, zoom), [listings, zoom]);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds listings={listings} />
        <ViewportWatcher onZoom={setZoom} areaSearch={areaSearch} onBoundsChange={onBoundsChange} />

        {clusters.map((c, i) => (
          <ClusterMarker key={`c-${i}-${c.items.length}`} lat={c.lat} lng={c.lng} count={c.items.length} />
        ))}

        {singles.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={priceIcon(priceShort(l.price), l.id === activeId)}
            zIndexOffset={l.id === activeId ? 1000 : 0}
            eventHandlers={{
              mouseover: () => onActivate?.(l.id),
              mouseout: () => onActivate?.(null),
              ...(onSelect ? { click: () => onSelect(l) } : {})
            }}
          >
            {!onSelect && (
              <Popup>
                <Link href={`/listing/${l.id}`} className="block w-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.images[0]}
                    alt={loc(l.title, lang)}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                  <div className="px-0.5 pt-2">
                    <div className="text-sm font-extrabold text-ink-900">{formatPrice(l.price, lang)}</div>
                    <div className="truncate text-[13px] font-medium text-ink-700">{loc(l.title, lang)}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                      <Icon name="mapPin" size={12} /> {l.city} · {l.district}
                    </div>
                  </div>
                </Link>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* "Keresés ezen a területen" kapcsoló — Airbnb-minta, a térkép tetején */}
      {areaSearchable && (
        <button
          onClick={onToggleAreaSearch}
          className={`absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold shadow-float transition ${
            areaSearch
              ? "bg-ink-900 text-white"
              : "border border-ink-200 bg-white text-ink-800 hover:border-ink-300"
          }`}
        >
          <span
            className={`grid h-4 w-4 place-items-center rounded border ${
              areaSearch ? "border-white bg-white" : "border-ink-300 bg-white"
            }`}
          >
            {areaSearch && <Icon name="check" size={12} strokeWidth={3} className="text-ink-900" />}
          </span>
          {tr("map_area_search", lang)}
        </button>
      )}
    </div>
  );
}
