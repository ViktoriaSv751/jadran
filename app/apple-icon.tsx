import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS „add to home screen" ikon (PNG, lekerekített hátérrel). */
export default function AppleIcon() {
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
          fontSize: 108,
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
