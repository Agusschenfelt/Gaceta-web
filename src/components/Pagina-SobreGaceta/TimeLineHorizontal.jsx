import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GACETA_TIMELINE } from "./data";

gsap.registerPlugin(ScrollTrigger);

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

  const meta = useMemo(() => {
    return { totalWidth: getTotalWidth(data) };
  }, [data]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const row = rowRef.current;
    const line = lineRef.current;
    const vLine = verticalLineRef.current;
    
    if (!section || !track || !row) return;

    const totalW = meta.totalWidth;
    track.style.width = `${totalW}px`;
    
    const maxX = () => Math.max(0, totalW - viewportW(section));

    gsap.set(track, { x: 0, force3D: true, willChange: "transform" });

    // 1. Línea Vertical
    gsap.fromTo(vLine, 
        { scaleY: 0 },
        { 
          scaleY: 1, 
          duration: 0.8, 
          ease: "power2.inOut", 
          transformOrigin: "top", 
          scrollTrigger: { 
            trigger: section, 
            start: "top 60%", 
            end: "top 30%", 
            scrub: true 
          } 
        }
    );

    // 2. Línea Horizontal
    gsap.fromTo(line, 
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

    const doRefresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", doRefresh, { once: true });
    return () => { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  }, [data, meta]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100svh] overflow-hidden bg-transparent text-white z-20"
    >
      
      {/* Fondos */}
      <div className="absolute top-0 left-0 w-full h-[30svh] bg-gradient-to-b from-transparent via-black/95 to-black pointer-events-none z-0" />
      <div className="absolute top-[30vh] left-0 w-full h-full bg-black pointer-events-none z-0" />

      {/* Vertical Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px z-10" style={{ height: `${LINE_TOP_PCT}vh` }}>
          <div ref={verticalLineRef} className="w-full h-full bg-gradient-to-b from-[#dee5a0] via-[#dee5a0]/50 to-white/10 shadow-[0_0_15px_rgba(222,229,160,0.4)]" />
      </div>

      {/* Horizontal Line */}
      <div ref={lineRef} className="absolute left-0 right-0 z-10 origin-center" style={{ top: `${LINE_TOP_PCT}vh` }}>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#dee5a0] rounded-full shadow-[0_0_15px_#dee5a0]" />
      </div>

      <div
        ref={trackRef}
        className="absolute inset-0 pl-[50vw] pr-[40vw]"
        style={{
          paddingTop: `${LINE_TOP_PCT}vh`,
          willChange: "transform",
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
             <span className="absolute -top-[180px] left-10 text-[20rem] font-black text-white/[0.08] select-none pointer-events-none leading-none font-inter z-0 blur-md transition-opacity duration-1000 group-hover/future:text-white/[0.02]">
                 2026
             </span>
             <div className="absolute top-0 left-0 w-64 h-px bg-gradient-to-r from-white/10 to-transparent" />
             <div className="pt-16 pl-20 opacity-60 hover:opacity-100 transition-opacity duration-500 cursor-default">
                 <h3 className="text-4xl font-serif italic text-[#dee5a0] mb-2">To be continued...</h3>
                 <p className="text-sm text-white/50 font-light">La historia continúa.</p>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function EventCard({ ev }) {
  return (
    <div className="relative w-[320px] shrink-0 group" data-event-card>
      <div className="absolute -top-[64px] left-0 h-[64px] w-px bg-gradient-to-b from-white/20 to-transparent" />
      <div className="absolute -top-[69px] left-[-4px] w-[9px] h-[9px] bg-[#dee5a0] rounded-full shadow-[0_0_10px_#dee5a0] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <article className="w-full transition-transform duration-500 group-hover:-translate-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#dee5a0] mb-3 font-mono opacity-80 group-hover:opacity-100 transition-opacity">{fmt(ev.date)}</p>
        
        {/* CAMBIO AQUÍ: aspect-square (1:1) para portadas cuadradas */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 mb-5 transition-all duration-500 group-hover:ring-[#dee5a0]/40 group-hover:shadow-[0_10px_40px_-10px_rgba(222,229,160,0.15)]">
            {ev.media?.type === "video" ? (
                <video className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" src={ev.media.src} muted loop autoPlay playsInline />
            ) : (
                <img src={ev.media.src} alt={ev.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 transition-transform duration-700" loading="lazy" />
            )}
        </div>
        
        <h3 className="text-2xl font-serif italic leading-none mb-2 text-white/90 group-hover:text-white transition-colors">{ev.title}</h3>
        {ev.desc && <p className="text-sm text-white/60 leading-relaxed font-light text-pretty group-hover:text-white/80 transition-colors">{ev.desc}</p>}
      </article>
    </div>
  );
}