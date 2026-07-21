"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Icon from "./ui/Icon";

// next/image-alapú kép shimmer-helykitöltővel és kecses gradiens-fallbackkel.
// A `fill` mód a méretezett, `relative` szülőt tölti ki, így minden hívási hely
// (kártya, galéria, bélyegkép) automatikusan AVIF/WebP-t, reszponzív srcset-et
// és méretre optimalizált képet kap — a nyers <img> helyett. Ez adja a
// PageSpeed „Képtovábbítás javítása" megtakarítás nagy részét.
export default function Photo({
  src,
  alt,
  className,
  eager = false,
  // Alapértelmezés a leggyakoribb esetre (kártya ~400px, telefonon teljes szél.).
  // Nagy képekhez (galéria-főkép) a hívó adjon nagyobb értéket.
  sizes = "(max-width: 768px) 100vw, 400px"
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Gyorsítótárazott képek a React commit és egy effekt lefutása közti résben is
  // betöltődhetnek, így a JS `onLoad` sosem futna le — emiatt a kép átlátszón
  // ragadt. A next/image a `ref`-et továbbadja a mögöttes <img>-nek, így a
  // callback-ref szinkron ellenőrzi a `complete`-et, amint a node csatlakozik.
  const attachRef = useCallback((node: HTMLImageElement | null) => {
    if (!node) return;
    if (node.complete) {
      if (node.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, []);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-ink-100 via-brand-50 to-brand-100 text-ink-300 ${className ?? ""}`}
      >
        <Icon name="home" size={32} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {!loaded && <div className="shimmer absolute inset-0" />}
      <Image
        ref={attachRef}
        key={src}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
