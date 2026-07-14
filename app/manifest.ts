import type { MetadataRoute } from "next";

/** PWA manifest — telepíthető app, montenegrói ingatlan-kereső. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROOPIFY — Ingatlan Montenegróban",
    short_name: "PROOPIFY",
    description:
      "Verifikált ingatlanhirdetések Montenegróban — átlátható árak, térképes keresés, több nyelven.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "hu",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      // A `/icon` egy Next által generált 512×512 PNG (sok launcher az SVG-t nem
      // fogadja el) — „any" és „maskable" célra is.
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
