/**
 * Miniature website previews shown on the screens inside the KANOY studio.
 * Each entry is a self-contained "fake site" rendered at a fixed 420x264
 * design size and scaled by <MiniSite width={...} />.
 * Replace `render` with real project previews later — the API stays the same.
 *
 * Kept separate from the `MiniSite` component (mini-sites.tsx) because this
 * file exports plain data/types alongside JSX helpers, which breaks Vite's
 * Fast Refresh for the component file if they're combined.
 */
import type { CSSProperties, ReactNode } from "react";
import tierraYMar from "@/assets/portfolio/tierra-y-mar.webp";

export const W = 420;
export const H = 264;

type Palette = { bg: string; ink: string; accent: string; soft: string };

export type MiniSiteDef = {
  id: string;
  label: string;
  kind: string;
  palette: Palette;
  /** A real project screenshot. When set, this replaces the fake mock
   *  render below and can be clicked to open larger. */
  image?: string;
  render?: (p: Palette) => ReactNode;
  /** A caption line shown above the preview, naming where the project is
   *  based. Rendered outside the image itself, never overlaid on it. */
  location?: string;
  /** The live site, for a real project. When set, the label under the
   *  preview links out to it. */
  url?: string;
};

const row: CSSProperties = { display: "flex", alignItems: "center" };
const nav = (p: Palette): CSSProperties => ({
  ...row,
  justifyContent: "space-between",
  padding: "10px 16px",
  fontSize: 7,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: p.ink,
});

function Dots({ p }: { p: Palette }) {
  return (
    <div style={{ ...row, gap: 8 }}>
      {["Work", "About", "Contact"].map((t) => (
        <span key={t} style={{ opacity: 0.6 }}>
          {t}
        </span>
      ))}
      <span
        style={{
          background: p.accent,
          color: p.bg,
          padding: "3px 7px",
          borderRadius: 99,
          fontWeight: 700,
        }}
      >
        Book
      </span>
    </div>
  );
}

function Wordmark({ p, name }: { p: Palette; name: string }) {
  return <span style={{ fontWeight: 800, letterSpacing: 2, color: p.ink }}>{name}</span>;
}

function Card({
  p,
  h = 46,
  style,
  children,
}: {
  p: Palette;
  h?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        height: h,
        borderRadius: 4,
        background: p.soft,
        border: `1px solid ${p.ink}14`,
        padding: 7,
        fontSize: 6,
        color: p.ink,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Bars({ p, n = 3, w = 70 }: { p: Palette; n?: number; w?: number }) {
  return (
    <div style={{ display: "grid", gap: 3, marginTop: 5 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 2,
            width: `${w - i * 14}%`,
            background: p.ink,
            opacity: 0.16,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export const MINI_SITES: MiniSiteDef[] = [
  {
    id: "restaurant",
    label: "Tierra y Mar — Restaurant",
    kind: "Restaurant & reservations",
    palette: { bg: "#120f0d", ink: "#f4ece1", accent: "#c8a45c", soft: "#ffffff0d" },
    image: tierraYMar,
    location: "Ayamonte (Espanha)",
    url: "https://tierraymar-ayamonte.es",
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="LUME" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 30, lineHeight: 1, color: p.ink, fontWeight: 300 }}>
            Fire &amp; <em style={{ color: p.accent }}>Season</em>
          </div>
          <div style={{ fontSize: 6.5, opacity: 0.6, color: p.ink, marginTop: 6 }}>
            Tasting menu · Lisbon · Reservations open
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}
          >
            {[0, 1, 2].map((i) => (
              <Card
                key={i}
                p={p}
                h={62}
                style={{ background: `linear-gradient(160deg,${p.accent}33,#0000)` }}
              >
                <div style={{ fontSize: 7, color: p.accent }}>0{i + 1}</div>
                <Bars p={p} n={3} />
              </Card>
            ))}
          </div>
          <div style={{ ...row, gap: 6, marginTop: 10 }}>
            <div
              style={{
                background: p.accent,
                color: p.bg,
                fontSize: 6.5,
                padding: "5px 10px",
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              RESERVE A TABLE
            </div>
            <div style={{ fontSize: 6.5, color: p.ink, opacity: 0.5 }}>19:00 · 20:30 · 21:45</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "hotel",
    label: "Maré — Luxury Hotel",
    kind: "Hospitality & booking",
    palette: { bg: "#f6f2ea", ink: "#1b1b18", accent: "#2f6f6a", soft: "#ffffff" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="MARÉ" />
          <Dots p={p} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 10,
            padding: "10px 16px",
          }}
        >
          <div>
            <div style={{ fontSize: 22, lineHeight: 1.05, color: p.ink, fontWeight: 400 }}>
              A quiet suite above the Atlantic
            </div>
            <Bars p={p} n={3} w={95} />
            <div
              style={{
                marginTop: 10,
                background: p.soft,
                border: `1px solid ${p.ink}12`,
                borderRadius: 3,
                padding: 7,
              }}
            >
              <div style={{ fontSize: 6, letterSpacing: 1, opacity: 0.55, color: p.ink }}>
                CHECK IN — CHECK OUT
              </div>
              <div style={{ ...row, justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 7.5, color: p.ink }}>12 Sep — 15 Sep</span>
                <span
                  style={{
                    background: p.accent,
                    color: "#fff",
                    fontSize: 6,
                    padding: "4px 8px",
                    borderRadius: 2,
                  }}
                >
                  CHECK
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <Card
              p={p}
              h={70}
              style={{ background: `linear-gradient(140deg,${p.accent},#9dc9c2)` }}
            />
            <Card p={p} h={48} style={{ background: "#dcd3c4" }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "barber",
    label: "Rasor — Barbershop",
    kind: "Bookings & barber calendars",
    palette: { bg: "#0e0e10", ink: "#f2f2f2", accent: "#38e1c0", soft: "#ffffff0f" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="RASOR" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 26, color: p.ink, fontWeight: 800, letterSpacing: -0.5 }}>
            BOOK YOUR BARBER
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 10 }}
          >
            {["Rui", "Tomás", "Léo", "Ana"].map((n, i) => (
              <Card
                key={n}
                p={p}
                h={40}
                style={{ textAlign: "center", borderColor: i === 1 ? p.accent : undefined }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    margin: "0 auto",
                    background: i === 1 ? p.accent : "#ffffff22",
                  }}
                />
                <div style={{ fontSize: 6, marginTop: 4, opacity: 0.8 }}>{n}</div>
              </Card>
            ))}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 4, marginTop: 8 }}
          >
            {["09:00", "10:30", "11:15", "14:00", "16:30", "18:00"].map((t, i) => (
              <div
                key={t}
                className={i === 3 ? "mini-pulse" : undefined}
                style={{
                  fontSize: 5.6,
                  textAlign: "center",
                  padding: "5px 0",
                  borderRadius: 2,
                  color: i === 3 ? p.bg : p.ink,
                  background: i === 3 ? p.accent : "#ffffff10",
                  opacity: i === 1 ? 0.35 : 1,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, fontSize: 6.5, color: p.accent }}>Confirm appointment →</div>
        </div>
      </div>
    ),
  },
  {
    id: "gym",
    label: "Iron/Set — Gym",
    kind: "Memberships & classes",
    palette: { bg: "#101215", ink: "#ffffff", accent: "#c6ff3d", soft: "#ffffff0d" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="IRON/SET" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div
            style={{
              fontSize: 34,
              lineHeight: 0.95,
              fontWeight: 900,
              color: p.ink,
              letterSpacing: -1.4,
            }}
          >
            TRAIN<span style={{ color: p.accent }}>.</span>
            <br />
            NO EXCUSES
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, marginTop: 10 }}
          >
            {["BASIC", "PRO", "ELITE"].map((t, i) => (
              <Card
                key={t}
                p={p}
                h={54}
                style={{
                  background: i === 1 ? p.accent : p.soft,
                  color: i === 1 ? "#101215" : p.ink,
                }}
              >
                <div style={{ fontSize: 6.5, fontWeight: 800, letterSpacing: 1 }}>{t}</div>
                <Bars p={p} n={3} />
              </Card>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              height: 16,
              borderRadius: 2,
              background: p.soft,
              ...row,
              justifyContent: "space-between",
              padding: "0 7px",
              fontSize: 5.6,
              color: p.ink,
            }}
          >
            <span>HIIT · 18:00</span>
            <span>SPIN · 19:00</span>
            <span style={{ color: p.accent }}>JOIN NOW</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "construction",
    label: "Novacon — Construction",
    kind: "Business & projects",
    palette: { bg: "#f3f1ee", ink: "#17181a", accent: "#ff5c1b", soft: "#ffffff" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="NOVACON" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div
            style={{ fontSize: 20, lineHeight: 1.05, color: p.ink, fontWeight: 700, maxWidth: 200 }}
          >
            Building infrastructure that lasts decades
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginTop: 10 }}
          >
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} p={p} h={44} style={{ background: i === 1 ? p.accent : "#d9d5cf" }} />
            ))}
          </div>
          <div style={{ ...row, gap: 14, marginTop: 10, fontSize: 6, color: p.ink }}>
            {[
              ["24", "years"],
              ["310", "projects"],
              ["98%", "on time"],
            ].map(([a, b]) => (
              <div key={b}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{a}</div>
                <div style={{ opacity: 0.5 }}>{b}</div>
              </div>
            ))}
            <div
              style={{
                marginLeft: "auto",
                background: p.ink,
                color: "#fff",
                fontSize: 6,
                padding: "5px 9px",
              }}
            >
              REQUEST QUOTE
            </div>
          </div>
        </div>
      </div>
    ),
  },
];
