/**
 * Miniature website previews shown on the screens inside the KANOY studio.
 * Each entry is a self-contained "fake site" rendered at a fixed 420x264
 * design size and scaled by <MiniSite width={...} />.
 * Replace `render` with real project previews later — the API stays the same.
 */
import type { CSSProperties, ReactNode } from "react";

const W = 420;
const H = 264;

type Palette = { bg: string; ink: string; accent: string; soft: string };

export type MiniSiteDef = {
  id: string;
  label: string;
  kind: string;
  palette: Palette;
  render: (p: Palette) => ReactNode;
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
    label: "Lume — Restaurant",
    kind: "Restaurant & reservations",
    palette: { bg: "#120f0d", ink: "#f4ece1", accent: "#c8a45c", soft: "#ffffff0d" },
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
  {
    id: "dj",
    label: "NOKT — DJ / Artist",
    kind: "Artist & events",
    palette: { bg: "#07070a", ink: "#f0efff", accent: "#7c5cff", soft: "#ffffff0d" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: "-30% -10% auto",
            height: 220,
            background: `radial-gradient(circle at 50% 50%, ${p.accent}66, transparent 65%)`,
          }}
        />
        <div style={{ ...nav(p), position: "relative" }}>
          <Wordmark p={p} name="NOKT" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "6px 16px", position: "relative" }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: -2,
              color: p.ink,
              lineHeight: 0.9,
            }}
          >
            LIVE SET
          </div>
          <div style={{ ...row, gap: 2, marginTop: 8, height: 34, alignItems: "flex-end" }}>
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className="mini-eq"
                style={{
                  flex: 1,
                  background: p.accent,
                  opacity: 0.75,
                  height: `${20 + ((i * 37) % 80)}%`,
                  animationDelay: `${(i % 9) * 0.11}s`,
                }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gap: 3, marginTop: 8, fontSize: 6, color: p.ink }}>
            {["18 OCT — LISBON", "02 NOV — PORTO", "22 NOV — MADRID"].map((t) => (
              <div
                key={t}
                style={{
                  ...row,
                  justifyContent: "space-between",
                  borderTop: "1px solid #ffffff18",
                  paddingTop: 3,
                }}
              >
                <span>{t}</span>
                <span style={{ color: p.accent }}>TICKETS</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "salon",
    label: "Aurelle — Beauty Salon",
    kind: "Aesthetics & appointments",
    palette: { bg: "#fbf5f4", ink: "#241d1f", accent: "#c98b8b", soft: "#ffffff" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="AURELLE" />
          <Dots p={p} />
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "8px 16px" }}
        >
          <div>
            <div style={{ fontSize: 21, color: p.ink, fontWeight: 400, lineHeight: 1.1 }}>
              Skin, nails &amp; <em style={{ color: p.accent }}>calm</em>
            </div>
            <div style={{ display: "grid", gap: 4, marginTop: 9, fontSize: 6, color: p.ink }}>
              {["Facial ritual · 60 min", "Gel manicure · 45 min", "Lash lift · 40 min"].map(
                (s) => (
                  <div
                    key={s}
                    style={{
                      ...row,
                      justifyContent: "space-between",
                      background: p.soft,
                      padding: "5px 7px",
                      borderRadius: 99,
                    }}
                  >
                    <span>{s}</span>
                    <span style={{ color: p.accent }}>+</span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div>
            <Card
              p={p}
              h={62}
              style={{ background: `linear-gradient(150deg,${p.accent},#f0d9d4)` }}
            />
            <div style={{ marginTop: 6, background: p.soft, borderRadius: 3, padding: 7 }}>
              <div style={{ fontSize: 5.6, opacity: 0.6, color: p.ink }}>NEXT AVAILABLE</div>
              <div style={{ fontSize: 8, color: p.ink, marginTop: 2 }}>Tomorrow, 11:30</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "realestate",
    label: "Terra — Real Estate",
    kind: "Listings & viewings",
    palette: { bg: "#101410", ink: "#f0f4ef", accent: "#8fd694", soft: "#ffffff0f" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="TERRA" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div style={{ ...row, justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, color: p.ink, fontWeight: 500 }}>42 listings · Cascais</div>
            <div style={{ fontSize: 6, color: p.accent }}>Map view</div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 9 }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 3, overflow: "hidden", background: p.soft }}>
                <div
                  style={{
                    height: 40,
                    background: `linear-gradient(160deg,${p.accent}55,#ffffff10)`,
                  }}
                />
                <div style={{ padding: 6, fontSize: 5.8, color: p.ink }}>
                  <div>Villa 0{i}</div>
                  <div style={{ opacity: 0.5, marginTop: 2 }}>3 bed · 180 m²</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, ...row, gap: 6, fontSize: 6, color: p.ink }}>
            <span
              style={{
                background: p.accent,
                color: "#101410",
                padding: "5px 9px",
                borderRadius: 2,
              }}
            >
              BOOK VIEWING
            </span>
            <span style={{ opacity: 0.5 }}>Instant confirmation</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "business",
    label: "Vantor — Business",
    kind: "Corporate & services",
    palette: { bg: "#ffffff", ink: "#101114", accent: "#1d5cff", soft: "#f4f5f7" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="VANTOR" />
          <Dots p={p} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div
            style={{
              fontSize: 22,
              color: p.ink,
              fontWeight: 600,
              letterSpacing: -0.6,
              maxWidth: 230,
            }}
          >
            Operations, handled end to end
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 10 }}
          >
            {["Logistics", "Compliance", "Support"].map((t) => (
              <Card key={t} p={p} h={50}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: p.accent }} />
                <div style={{ fontSize: 6.5, marginTop: 5, fontWeight: 600 }}>{t}</div>
                <Bars p={p} n={2} />
              </Card>
            ))}
          </div>
          <div
            style={{
              marginTop: 9,
              height: 20,
              borderRadius: 3,
              background: p.soft,
              ...row,
              padding: "0 7px",
              gap: 6,
              fontSize: 6,
              color: p.ink,
            }}
          >
            <span style={{ opacity: 0.5 }}>Trusted across 12 markets</span>
            <span style={{ marginLeft: "auto", color: p.accent, fontWeight: 700 }}>
              Contact sales
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "booking",
    label: "Slotly — Booking Platform",
    kind: "Custom booking system",
    palette: { bg: "#0b1220", ink: "#e8f1ff", accent: "#26d5f0", soft: "#ffffff0f" },
    render: (p) => (
      <div style={{ background: p.bg, height: "100%" }}>
        <div style={nav(p)}>
          <Wordmark p={p} name="SLOTLY" />
          <Dots p={p} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 8,
            padding: "6px 16px",
          }}
        >
          <div>
            <div style={{ fontSize: 17, color: p.ink, fontWeight: 600 }}>Dashboard</div>
            <div style={{ display: "grid", gap: 4, marginTop: 7 }}>
              {["Today · 14", "Week · 96", "Revenue ↑"].map((t) => (
                <div
                  key={t}
                  style={{
                    background: p.soft,
                    borderRadius: 3,
                    padding: "6px 7px",
                    fontSize: 6,
                    color: p.ink,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: p.soft, borderRadius: 4, padding: 7 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 8,
                    borderRadius: 1.5,
                    background: [3, 9, 15, 16, 22].includes(i) ? p.accent : "#ffffff14",
                    opacity: [3, 9, 15, 16, 22].includes(i) ? 0.9 : 1,
                  }}
                />
              ))}
            </div>
            <div
              className="mini-slide"
              style={{
                marginTop: 7,
                background: p.accent,
                color: "#04121a",
                fontSize: 6,
                padding: "5px 7px",
                borderRadius: 2,
                fontWeight: 700,
              }}
            >
              NEW RESERVATION · 20:30
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function MiniSite({ site, width }: { site: MiniSiteDef; width: number }) {
  const scale = width / W;
  return (
    <div style={{ width, height: H * scale, overflow: "hidden" }}>
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: "var(--font-body)",
        }}
      >
        {site.render(site.palette)}
      </div>
    </div>
  );
}
