/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
