import { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GACETA_TIMELINE } from "./data";

function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function VideoItem({ src, className }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <video ref={videoRef} src={src} muted loop playsInline preload="metadata" className={className} />
  );
}

export default function TimelineMobile() {
  const containerRef = useRef(null);
  const laserRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Cards
      const cards = gsap.utils.toArray("[data-mobile-card]");
      cards.forEach((card) => {
        gsap.fromTo(card,
          { opacity: 0, x: 14 },
          { opacity: 1, x: 0, duration: 0.55, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true } }
        );
      });

      // 2. Dots
      const dots = gsap.utils.toArray("[data-timeline-dot]");
      dots.forEach((dot) => {
        gsap.fromTo(dot,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "power2.out",
            scrollTrigger: { trigger: dot, start: "top 85%", toggleActions: "play none none reverse" } }
        );
      });

      // 3. Láser — scrub directo al scroll, igual que el timeline horizontal
      gsap.fromTo(laserRef.current,
        { height: 0 },
        {
          height: () => containerRef.current?.offsetHeight ?? 0,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-fondo text-white pt-8 pb-24 px-5 overflow-hidden">

      {/* Eje estático */}
      <div className="absolute top-0 bottom-0 left-[33px] w-px bg-white/[0.07]" />

      {/* Láser dorado — antes del contenido para que los puntos queden encima */}
      <div
        ref={laserRef}
        className="absolute top-0 left-[33px] w-px pointer-events-none"
        style={{
          background: "var(--color-secundario)",
          height: "0px",
        }}
      />

      {/* Fade de entrada */}
      <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-fondo to-transparent z-20 pointer-events-none" />

      <div className="flex flex-col gap-16 relative">
        {GACETA_TIMELINE.map((block) => (
          <YearBlockMobile key={block.year} year={block.year} events={block.events} />
        ))}

        {/* Bloque final */}
        <div className="relative pl-16 pt-6 pb-16">
          <div className="absolute left-[18px] top-[0.9rem] w-5 h-[1px] bg-gradient-to-r from-secundario/40 to-transparent" />
          <div className="absolute left-[8px] top-[0.6rem] w-[10px] h-[10px] rounded-full bg-fondo border-2 border-white/15" />
          <span className="block text-5xl font-black text-white/[0.04] tracking-tighter leading-none mb-3 select-none">
            2026
          </span>
          <h3 className="text-2xl font-serif italic text-secundario mb-1">To be continued...</h3>
          <p className="text-xs text-white/30 font-light">La historia continúa.</p>
        </div>
      </div>
    </section>
  );
}

function YearBlockMobile({ year, events }) {
  return (
    <div className="relative">

      {/* Año — label editorial minimal, con bg para tapar el eje */}
      <div className="sticky top-[4.5rem] z-30 mb-12">
        <div className="pl-[52px] py-2 bg-gradient-to-r from-fondo via-fondo/95 to-transparent">
          <span className="text-base font-mono uppercase tracking-[0.2em] text-secundario/80">
            {year}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {events.map((ev) => (
          <article key={ev.id} data-mobile-card className="relative pl-16">

            {/* Dot en el eje */}
            <div
              data-timeline-dot
              className="absolute left-[8px] top-2.5 w-[10px] h-[10px] rounded-full bg-fondo border-2 border-secundario shadow-[0_0_6px_var(--color-secundario)]"
            />
            {/* Conector horizontal dot → contenido */}
            <div className="absolute left-[18px] top-[0.9rem] w-5 h-[1px] bg-gradient-to-r from-secundario/50 to-transparent" />

            {/* Fecha */}
            <span className="block text-[10px] font-mono text-secundario/70 tracking-widest uppercase mb-3">
              {fmt(ev.date)}
            </span>

            {/* Imagen — aspect-square, sin border, full opacity */}
            {ev.media && (
              <div className="mb-4 overflow-hidden rounded-sm aspect-square relative bg-white/5">
                {ev.media.type === "video" ? (
                  <VideoItem src={ev.media.src} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src={ev.media.src}
                    alt={ev.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* Título */}
            <h3 className="text-xl font-serif italic leading-snug mb-2 text-white">
              {ev.title}
            </h3>

            {/* Descripción */}
            {ev.desc && (
              <p className="text-sm text-white/60 leading-relaxed font-light text-pretty">
                {ev.desc}
              </p>
            )}

          </article>
        ))}
      </div>
    </div>
  );
}
