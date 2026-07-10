"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import { useEffect } from "react";
import type { Listing, Lang } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import Icon from "./ui/Icon";

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

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [listings, map]);
  return null;
}

function priceShort(price: number): string {
  return price >= 1000000 ? `€${(price / 1000000).toFixed(1)}M` : `€${Math.round(price / 1000)}k`;
}

export default function MapView({
  listings,
  lang,
  activeId,
  onActivate
}: {
  listings: Listing[];
  lang: Lang;
  activeId?: string | null;
  onActivate?: (id: string | null) => void;
}) {
  const center: [number, number] = [42.4, 18.8];

  return (
    <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds listings={listings} />
      {listings.map((l) => (
        <Marker
          key={l.id}
          position={[l.lat, l.lng]}
          icon={priceIcon(priceShort(l.price), l.id === activeId)}
          zIndexOffset={l.id === activeId ? 1000 : 0}
          eventHandlers={{
            mouseover: () => onActivate?.(l.id),
            mouseout: () => onActivate?.(null)
          }}
        >
          <Popup>
            <Link href={`/listing/${l.id}`} className="block w-52 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={l.images[0]}
                alt={l.title[lang]}
                className="h-28 w-full rounded-xl object-cover"
              />
              <div className="px-0.5 pt-2">
                <div className="text-sm font-extrabold text-ink-900">{formatPrice(l.price, lang)}</div>
                <div className="truncate text-[13px] font-medium text-ink-700">{l.title[lang]}</div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                  <Icon name="mapPin" size={12} /> {l.city} · {l.district}
                </div>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
