import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GACETA_TIMELINE } from "./data";

gsap.registerPlugin(ScrollTrigger);

function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export default function TimelineMobile() {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Cards (Entrada lateral suave)
      gsap.fromTo("[data-mobile-card]", 
        { opacity: 0, x: 20 },
        { 
          opacity: 1, x: 0, duration: 0.6, ease: "power2.out", stagger: 0.05,
          scrollTrigger: { trigger: containerRef.current, start: "top 75%" } 
        }
      );
      
      // 2. Láser Dorado (Se dibuja hacia abajo)
      gsap.fromTo("[data-global-line]",
        { scaleY: 0 },
        { 
          scaleY: 1, ease: "none", transformOrigin: "top", 
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 50%", 
            end: "bottom 80%",
            scrub: true
          }
        }
      );

      // 3. Puntos (Pop in)
      const dots = gsap.utils.toArray("[data-timeline-dot]");
      dots.forEach(dot => {
         gsap.fromTo(dot,
            { scale: 0, opacity: 0 },
            { 
              scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)",
              scrollTrigger: { trigger: dot, start: "top 80%", toggleActions: "play none none reverse" }
            }
         );
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full bg-[#0a0a0a] text-white py-24 px-4 overflow-hidden">
      
      {/* === EJE CENTRAL === */}
      {/* Guía base gris (oscura) */}
      <div className="absolute top-0 bottom-0 left-8 w-[2px] bg-white/5 rounded-full" />
      
      {/* LÁSER DORADO (Progreso) */}
      <div 
        data-global-line 
        className="absolute top-0 bottom-0 left-8 w-[2px] bg-gradient-to-b from-[#dee5a0] via-[#dee5a0] to-transparent shadow-[0_0_12px_#dee5a0] z-10 origin-top rounded-full" 
      />

      {/* Degradado superior para que la línea no corte de golpe al inicio */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-20 pointer-events-none" />

      <div className="flex flex-col gap-20 relative z-20">
        {GACETA_TIMELINE.map((block) => (
          <YearBlockMobile key={block.year} year={block.year} events={block.events} />
        ))}
      </div>
    </section>
  );
}

function YearBlockMobile({ year, events }) {
  return (
    <div className="relative">
      
      {/* AÑO STICKY (Fondo negro para tapar la línea al pasar) */}
      <div className="sticky top-24 z-30 mb-8 -ml-2">
          <div className="bg-[#0a0a0a]/90 backdrop-blur-md py-2 pr-4 pl-2 w-fit rounded-r-full border border-white/5 border-l-0 shadow-xl">
            <span className="text-4xl font-black text-white/20 select-none tracking-tighter leading-none block">
                {year}
            </span>
          </div>
      </div>

      {/* EVENTOS */}
      <div className="flex flex-col gap-14">
        {events.map((ev) => (
          <article key={ev.id} data-mobile-card className="relative pl-16"> {/* pl-16 da espacio al conector */}
            
            {/* 1. PUNTO DE CONEXIÓN (Centrado en la línea left-8) */}
            {/* left-8 (32px) - mitad del punto (5px) = aprox 27px */}
            <div 
                data-timeline-dot
                className="absolute left-[27px] top-2 w-[10px] h-[10px] rounded-full bg-[#0a0a0a] border-2 border-[#dee5a0] shadow-[0_0_8px_#dee5a0] z-20"
            />
            
            {/* 2. CONECTOR HORIZONTAL */}
            {/* Sale de la línea (left-8) hacia el contenido */}
            <div className="absolute left-8 top-[1.1rem] w-6 h-[1px] bg-gradient-to-r from-[#dee5a0] to-transparent opacity-50" />

            {/* FECHA */}
            <div className="mb-2 flex items-center gap-2">
                 <span className="text-[10px] font-mono text-[#dee5a0] tracking-widest uppercase opacity-90">
                    {fmt(ev.date)}
                 </span>
            </div>
            
            {/* MEDIA (Imagen/Video) */}
            {ev.media && (
                <div className="mb-4 overflow-hidden rounded-sm aspect-video bg-white/5 border border-white/10 shadow-lg relative group">
                    {ev.media.type === "video" ? (
                        <video src={ev.media.src} muted loop autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <img src={ev.media.src} alt={ev.title} className="w-full h-full object-cover opacity-80" loading="lazy" />
                    )}
                    {/* Brillo interno */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>
            )}

            {/* TÍTULO */}
            <h3 className="text-2xl font-serif italic leading-none mb-2 text-white">
              {ev.title}
            </h3>

            {/* DESCRIPCIÓN */}
            {ev.desc && (
              <p className="text-sm text-white/50 leading-relaxed font-light text-pretty border-l border-white/10 pl-3">
                {ev.desc}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}