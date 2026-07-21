/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF először (kisebb, mint a WebP), majd WebP fallback. A next/image
    // méretre optimalizál + reszponzív srcset-et ad → a nagy 1200×800 forrás-
    // képek helyett a megjelenítési méretnek megfelelő, modern formátumú kép megy ki.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 nap – optimalizált képek gyorsítótárazása
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" }
    ]
  },
  // www.proopify.app → proopify.app (301), hogy a fő (kanonikus) domain legyen
  // az egyetlen indexelt cím; a többi hoston (jadran.vercel.app, preview) nincs hatása.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.proopify.app" }],
        destination: "https://proopify.app/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
