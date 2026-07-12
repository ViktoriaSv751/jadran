import type { MetadataRoute } from "next";

/** PWA manifest — telepíthető app, montenegrói ingatlan-kereső. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROOPIFY — Ingatlan Montenegróban",
    short_name: "PROOPIFY",
    description:
      "Verifikált ingatlanhirdetések Montenegróban — átlátható árak, térképes keresés, 4 nyelven.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "hu",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
