import { useLayoutEffect, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GACETA_TIMELINE } from "./data";

const LINE_TOP_PCT = 22; 
const CARD_W = 320;
const CARD_GAP = 80;
const YEAR_GAP = 400;
const COL_MIN = 960;

/* ===== HELPERS ===== */
const viewportW = (el) => el && el.getBoundingClientRect ? el.getBoundingClientRect().width : window.innerWidth;
const widthForYear = (events) => Math.max(COL_MIN, 400 + events.length * (CARD_W + CARD_GAP) + YEAR_GAP);
function fmt(iso) { if (!iso) return ""; const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; }

const getTotalWidth = (data) => {
  let totalWidth = 0;
  data.forEach((yearBlock) => {
    totalWidth += widthForYear(yearBlock.events);
  });
  return totalWidth + 600 + window.innerWidth; 
};

export default function TimeLineHorizontal({ data = GACETA_TIMELINE }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const rowRef = useRef(null);
  const lineRef = useRef(null);
  const verticalLineRef = useRef(null);
  const scrollHintRef = useRef(null);

  const meta = useMemo(() => {
    return { totalWidth: getTotalWidth(data) };
  }, [data]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const row = rowRef.current;

    if (!section || !track || !row) return;

    const totalW = meta.totalWidth;
    track.style.width = `${totalW}px`;

    const ctx = gsap.context(() => {
      const maxX = () => Math.max(0, totalW - viewportW(section));

      gsap.set(track, { x: 0, force3D: true });

      // 1. Línea Vertical — ease:none para que arranque inmediatamente sin lag perceptible
      // start:57% solapa 2% con el final de Nosotros (end:55%) para evitar cualquier gap visual
      gsap.fromTo(verticalLineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top",
            scrollTrigger: {
              trigger: section,
              start: "top 57%",
              end: "top 25%",
              scrub: true
            }
          }
      );

      // 2. Línea Horizontal
      gsap.fromTo(lineRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: section, start: "top 30%" } }
      );

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${maxX()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          pinSpacing: true,
        },
      });
      tl.to(track, { x: () => -maxX(), ease: "none" });

      // 3. Animación cartas
      const cards = gsap.utils.toArray("[data-event-card]");
      cards.forEach((card) => {
        gsap.fromTo(card,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out",
            scrollTrigger: {
              trigger: card, containerAnimation: tl, start: "left 100%", end: "left 80%", toggleActions: "play none none reverse"
            }
          }
        );
      });

      // 4. Scroll hint — fade out in the first 15% of horizontal scroll
      gsap.to(scrollHintRef.current, {
        opacity: 0,
        y: 8,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${maxX() * 0.25}`,
          scrub: true,
        }
      });

      if (document.readyState === "complete") {
        ScrollTrigger.refresh();
      } else {
        window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
      }
    });

    return () => ctx.revert();
  }, [data, meta]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100svh] overflow-hidden bg-transparent text-white z-20"
    >
      {/* Skip link — accesibilidad teclado/switch */}
      <a
        href="#timeline-end"
        className="absolute top-4 left-4 z-[100] px-3 py-1.5 bg-fondo border border-secundario text-secundario text-[10px] font-mono uppercase tracking-widest opacity-0 focus:opacity-100 focus-visible:opacity-100 transition-opacity rounded-sm pointer-events-auto"
      >
        Saltar timeline →
      </a>

      {/* Fondos */}
      <div className="absolute top-0 left-0 w-full h-[30svh] bg-gradient-to-b from-transparent via-fondo/95 to-fondo pointer-events-none z-0" />
      <div className="absolute top-[30vh] left-0 w-full h-full bg-fondo pointer-events-none z-0" />
      {/* Fade de salida hacia SeccionEquipos */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-b from-transparent to-fondo pointer-events-none z-30" />

      {/* Scroll hint */}
      <div
        ref={scrollHintRef}
        aria-hidden="true"
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none select-none"
      >
        <span className="font-mono text-[10px] tracking-[0.25em] text-secundario/50 uppercase">Seguí scrolleando</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-secundario/30" />
          <span className="text-secundario/60 text-sm animate-scroll-hint">→</span>
          <div className="w-8 h-px bg-secundario/30" />
        </div>
      </div>

      {/* Vertical Line */}
      <div className="absolute top-0 w-px z-10" style={{ left: "calc(50vw - 0.5px)", height: `${LINE_TOP_PCT}vh` }}>
          <div ref={verticalLineRef} className="w-full h-full bg-gradient-to-b from-secundario via-secundario/50 to-white/10 shadow-[0_0_10px_var(--color-secundario)]" />
      </div>

      {/* Horizontal Line */}
      <div ref={lineRef} className="absolute left-0 right-0 z-10 origin-center" style={{ top: `${LINE_TOP_PCT}vh` }}>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-secundario rounded-full shadow-[0_0_15px_var(--color-secundario)]" />
      </div>

      <div
        ref={trackRef}
        className="absolute inset-0 pl-[50vw] pr-[40vw]"
        style={{
          paddingTop: `${LINE_TOP_PCT}vh`,
        }}
      >
        <div ref={rowRef} className="flex items-start -ml-[160px]">
          
          {data.map((block) => (
            <div key={block.year} className="relative shrink-0 flex" style={{ width: widthForYear(block.events) }}>
                <span className="absolute -top-[180px] left-10 text-[20rem] font-black text-white/[0.08] select-none pointer-events-none leading-none font-inter z-0 blur-sm">
                    {block.year}
                </span>
                <div className="flex items-start gap-[80px] pt-16 pl-80 relative z-10">
                    {block.events.map((ev) => (
                        <EventCard key={ev.id} ev={ev} />
                    ))}
                </div>
            </div>
          ))}

          {/* FINAL */}
          <div className="relative shrink-0 flex w-[600px] items-center group/future">
             <span className="absolute -top-[180px] left-10 text-[20rem] font-black text-white/[0.08] select-none pointer-events-none leading-none font-inter z-0 blur-md transition-opacity duration-500 group-hover/future:text-white/[0.02]">
                 {new Date().getFullYear()}
             </span>
             <div className="absolute top-0 left-0 w-64 h-px bg-gradient-to-r from-white/10 to-transparent" />
             <div className="pt-16 pl-20 opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-default">
                 <h3 className="text-4xl font-serif italic text-secundario mb-2">To be continued...</h3>
                 <p className="text-sm text-white/50 font-light">La historia continúa.</p>
             </div>
          </div>

        </div>
      </div>

      {/* Target del skip link */}
      <div id="timeline-end" tabIndex={-1} className="sr-only" />
    </section>
  );
}

function EventCard({ ev }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (ev.media?.type !== "video" || !videoRef.current) return;
    const video = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [ev.media?.type]);

  return (
    <div className="relative w-[320px] shrink-0 group" data-event-card>
      <div className="absolute -top-[64px] left-0 h-[64px] w-px bg-gradient-to-b from-white/20 to-transparent" />
      <div className="absolute -top-[69px] left-[-4px] w-[9px] h-[9px] bg-secundario rounded-full shadow-[0_0_10px_var(--color-secundario)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <article className="w-full transition-transform duration-500 group-hover:-translate-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-secundario mb-3 font-mono opacity-80 group-hover:opacity-100 transition-opacity">{fmt(ev.date)}</p>

        {/* CAMBIO AQUÍ: aspect-square (1:1) para portadas cuadradas */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 mb-5 transition-[box-shadow,outline-color] duration-500 group-hover:ring-secundario/40 group-hover:shadow-[0_10px_40px_-10px_rgba(222,229,160,0.15)]">
            {ev.media?.type === "video" ? (
                <video ref={videoRef} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src={ev.media.src} muted loop playsInline preload="metadata" />
            ) : (
                <img src={ev.media.src} alt={ev.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-[opacity,transform] duration-500" loading="lazy" />
            )}
        </div>

        <h3 className="text-2xl font-serif italic leading-none mb-2 text-white/90 group-hover:text-white transition-colors">{ev.title}</h3>
        {ev.desc && <p className="text-sm text-white/60 leading-relaxed font-light text-pretty group-hover:text-white/80 transition-colors">{ev.desc}</p>}
      </article>
    </div>
  );
}