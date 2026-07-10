import type { MetadataRoute } from "next";

/** PWA manifest — telepíthető app, montenegrói ingatlan-kereső. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JADRAN — Ingatlan Montenegróban",
    short_name: "JADRAN",
    description:
      "Verifikált ingatlanhirdetések Montenegróban — átlátható árak, térképes keresés, 4 nyelven.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "hu",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      { src: "/nav/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
