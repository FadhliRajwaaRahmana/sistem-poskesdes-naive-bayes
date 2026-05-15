import { ImageResponse } from "next/og";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Sistem Diagnosis POSKESDES";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #111827 45%, #0d9488 130%)",
          color: "white",
          padding: "56px 64px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "rgba(20, 184, 166, 0.20)",
            filter: "blur(18px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -80,
            bottom: -120,
            width: 360,
            height: 360,
            borderRadius: 9999,
            background: "rgba(14, 165, 233, 0.18)",
            filter: "blur(18px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 28,
                background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                boxShadow: "0 18px 40px rgba(13,148,136,0.28)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  borderRadius: 20,
                  border: "3px solid rgba(255,255,255,0.3)",
                }}
              />
              <svg
                width="52"
                height="52"
                viewBox="0 0 42 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="4" width="34" height="34" rx="10" stroke="white" strokeWidth="3.2" />
                <path
                  d="M10 22H16L19 16L23 28L26 22H32"
                  stroke="white"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  letterSpacing: -1.2,
                }}
              >
                POSKESDES
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#99f6e4",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                Sistem Diagnosis Naive Bayes
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              maxWidth: 860,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                padding: "10px 18px",
                fontSize: 20,
                fontWeight: 700,
                color: "#d1fae5",
                alignSelf: "flex-start",
              }}
            >
              Platform Admin Kesehatan Desa
            </div>

            <div
              style={{
                fontSize: 72,
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: -2.5,
              }}
            >
              {appName}
            </div>

            <div
              style={{
                fontSize: 28,
                lineHeight: 1.4,
                color: "#cbd5e1",
                fontWeight: 500,
                maxWidth: 880,
              }}
            >
              Kelola gejala, penyakit, dan diagnosis gizi balita berbasis Naive Bayes dalam satu dashboard yang rapi dan siap digunakan.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
