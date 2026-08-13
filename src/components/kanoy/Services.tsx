import { clamp, range, useScrollProgress } from "./anim";
import kanoyK from "@/assets/kanoy-k.png";

export const SERVICES = [
  { n: "01", title: "Website Development", text: "Premium websites designed specifically for each business — not templates." },
  { n: "02", title: "Automated Systems", text: "We build custom systems inside websites whenever the operation requires it." },
  { n: "03", title: "Restaurant Reservations", text: "Online reservation systems with booking management and service control." },
  { n: "04", title: "Barbershop Systems", text: "Online bookings, individual barber calendars and automated appointments." },
  { n: "05", title: "Beauty & Aesthetics", text: "Appointment systems designed for salons, clinics and beauty businesses." },
  { n: "06", title: "Business Websites", text: "Construction, services, local businesses and industry — built to convert." },
  { n: "07", title: "Custom Digital Systems", text: "Outside the standard package? We design and build the solution from zero." },
];

export function Services() {
  const { ref, p } = useScrollProgress<HTMLDivElement>();

  return (
    <section ref={ref} className="relative h-[520vh] bg-background" aria-label="What KANOY does">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-6 py-[6vh] md:px-14">
        <div
          className="pointer-events-none absolute -right-[8vw] top-1/2 -translate-y-1/2"
          style={{ opacity: 0.26 + p * 0.12, transform: `translate3d(0,-50%,0) rotate(${-10 + p * 20}deg) scale(${1 + p * 0.2})` }}
        >
          <span className="k-halo">
            <img src={kanoyK} alt="" aria-hidden loading="lazy" className="k-glow w-[34vw]" />
          </span>
        </div>

        <div className="relative mx-auto w-full max-w-5xl">
          <div className="eyebrow" style={{ opacity: range(p, 0, 0.06) }}>
            What happens in this room
          </div>
          <h2
            className="mt-[2vh] font-display text-[clamp(1.6rem,4.4vh,3.5rem)] leading-[0.95] tracking-[-0.03em]"
            style={{
              opacity: range(p, 0.01, 0.08),
              transform: `translateY(${(1 - range(p, 0.01, 0.08)) * 40}px)`,
            }}
          >
            Services, revealed as you move
          </h2>

          <ul className="mt-[4vh]">
            {SERVICES.map((s, i) => {
              const start = 0.1 + i * 0.115;
              const t = range(p, start, start + 0.09);
              const past = range(p, start + 0.16, start + 0.3);
              return (
                <li
                  key={s.n}
                  className="border-t border-ink/10 py-[1.4vh]"
                  style={{
                    opacity: clamp(t - past * 0.55),
                    transform: `translate3d(${(1 - t) * 60}px, ${(1 - t) * 18}px, 0)`,
                    filter: `blur(${(1 - t) * 6}px)`,
                  }}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:gap-10">
                    <span className="text-[10px] tracking-[0.4em] text-accent">{s.n}</span>
                    <h3 className="font-display text-[clamp(1.05rem,2.5vh,1.85rem)] tracking-[-0.02em] md:w-[38%]">{s.title}</h3>
                    <p className="max-w-md text-[clamp(0.72rem,1.6vh,0.9rem)] leading-relaxed text-ink/60">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
