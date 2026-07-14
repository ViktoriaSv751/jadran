import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** PNG app-ikon (Next auto-wire) — sok launcher az SVG-t nem fogadja el. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0c0a",
          color: "#c8ff00",
          fontSize: 300,
          fontWeight: 800,
          fontFamily: "sans-serif"
        }}
      >
        P
      </div>
    ),
    size
  );
}
