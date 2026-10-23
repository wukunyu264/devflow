import { ImageResponse } from "next/og";
export const alt = "DevFlow — a community for developers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#12161e",
        color: "#f2f5f9",
        padding: 90,
      }}
    >
      <div style={{ fontSize: 28, color: "#5be2ff", letterSpacing: 6 }}>
        BUILT FOR DEVELOPERS
      </div>
      <div style={{ fontSize: 112, fontWeight: 700, marginTop: 35 }}>
        DevFlow.
      </div>
      <div style={{ fontSize: 36, marginTop: 30 }}>
        Ideas worth building. Knowledge worth sharing.
      </div>
    </div>,
    size,
  );
}
