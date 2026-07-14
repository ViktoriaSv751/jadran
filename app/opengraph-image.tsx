import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Proopify — ingatlan Montenegróban";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Dinamikus, márkázott OG-kép a megosztott linkekhez (neon-fekete arculat). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(120deg, #070708 0%, #0d0d10 55%, #33420a 82%, #c8ff00 130%)",
          padding: "72px",
          color: "#ffffff",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#c8ff00",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px"
            }}
          >
            🏛️
          </div>
          <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-0.02em" }}>PROOPIFY</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "76px", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: "900px" }}>
            Ingatlan Montenegróban, egy helyen.
          </div>
          <div style={{ fontSize: "34px", color: "rgba(255,255,255,0.75)" }}>
            Verifikált hirdetések · átlátható árak · térképes keresés
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {["Budva", "Kotor", "Tivat", "Herceg Novi", "Bar"].map((c) => (
            <div
              key={c}
              style={{
                fontSize: "26px",
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: "999px",
                border: "2px solid rgba(255,255,255,0.25)"
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
