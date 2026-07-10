"use client";

import { useCallback, useState } from "react";
import Icon from "./ui/Icon";

// Plain <img> with a shimmer placeholder while loading and a graceful gradient
// fallback so the demo still looks fine if the sample photos can't load offline.
export default function Photo({
  src,
  alt,
  className,
  eager = false
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Cached images can finish loading in the gap between React's commit and an
  // effect firing, so a JS `onLoad` listener may never run — which previously
  // left the image stuck transparent. A callback ref checks `complete`
  // synchronously the instant the node attaches, closing that race.
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={attachRef}
        key={src}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
