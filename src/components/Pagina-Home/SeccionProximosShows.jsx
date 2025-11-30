import React, { useRef, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { showsData } from "../../data/showsData"; 

gsap.registerPlugin(ScrollTrigger);

export default function SeccionProximosShows() {
  const container = useRef(null);

  // === TRANSFORMACIÓN DE DATOS (HYPE MODE) ===
  const processedShows = useMemo(() => {
    return showsData.map((show) => {
      // Lógica para shows misteriosos (sin fecha)
      const isMystery = !show.date;
      
      let day = "??";
      let month = "SOON";

      if (!isMystery) {
        const [_, m, d] = show.date.split("-");
        day = d;
        month = m;
      }
      
      return {
        id: show.id,
        day: day,
        month: month,
        artist: show.artist,
        venue: show.venue || "Secret Location",
        city: show.city,
        // Estados: sold out | tickets | coming soon
        status: show.soldOut ? "sold out" : (isMystery ? "soon" : "tickets"), 
        isMystery: isMystery,
      };
    });
  }, []);

  useGSAP(() => {
    const rows = gsap.utils.toArray(".show-row");
    
    rows.forEach((row, i) => {
      gsap.fromTo(row,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.3,
          delay: i * 0.01,
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 90%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, { scope: container });

  return (
    <section 
      ref={container} 
      className="relative w-full min-h-screen flex flex-col justify-center py-32 px-4 md:px-10 overflow-hidden bg-black z-10"
    >
      
      {/* VIDEO FONDO */}
      <div className="absolute inset-0 z-0">
        <video 
            src="/assets/video-shows.mp4" 
            autoPlay muted loop playsInline 
            className="w-full h-full object-cover opacity-40 grayscale" 
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 border-b border-white/20 pb-6">
          <div>
            <span className="block text-xs font-mono text-[#dee5a0] tracking-widest mb-2 uppercase text-left">
              Calendario 2025
            </span>
            {/* text-left asegura que no herede centrado */}
            <h2 className="text-5xl md:text-8xl font-serif italic leading-none text-white text-left">
              Próximos <span className="text-white/50">Shows</span>
            </h2>
          </div>
        </div>

        {/* LISTA DE SHOWS */}
        <div className="flex flex-col gap-2">
          {processedShows.map((show, i) => (
            <div
              key={show.id}
              className={`show-row group relative flex flex-col md:flex-row md:items-center p-6 border border-white/5 transition-all duration-500 rounded-sm
                ${show.isMystery 
                    ? "bg-white/[0.01] hover:bg-white/[0.03]" // Estilo Mystery
                    : "bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#dee5a0]/50" // Estilo Normal
                }
              `}
            >
              
              {/* FECHA */}
              <div className="w-full md:w-1/4 flex items-baseline gap-2 mb-2 md:mb-0">
                <span className={`text-5xl font-light tracking-tighter transition-colors ${show.isMystery ? "text-white/30" : "text-white group-hover:text-[#dee5a0]"}`}>
                  {show.day}
                </span>
                <span className="text-sm font-mono text-white/40 uppercase">
                  /{show.month}
                </span>
              </div>

              {/* ARTISTA & INFO */}
              <div className="w-full md:w-2/4 flex flex-col">
                <h3 className={`text-3xl font-serif italic text-white transition-all duration-500
                    ${show.isMystery 
                        ? "blur-sm opacity-50 group-hover:blur-[2px] group-hover:opacity-80" // Efecto Borroso Hype
                        : "group-hover:translate-x-2"
                    }
                `}>
                  {show.artist}
                </h3>
                <p className={`text-sm text-white/50 mt-1 flex items-center gap-2 ${show.isMystery ? "blur-[2px]" : ""}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${show.isMystery ? "bg-white/20" : "bg-[#dee5a0]"}`} />
                  {show.venue} <span className="text-white/20">/</span> {show.city}
                </p>
              </div>

              {/* BOTON / STATUS */}
              <div className="w-full md:w-1/4 flex justify-end items-center mt-4 md:mt-0">
                {show.status === "sold out" ? (
                  <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-red-500 uppercase border border-red-500/30 px-3 py-1 rounded-full bg-red-500/10">
                    Sold Out
                  </span>
                ) : show.status === "soon" ? (
                  // TAG MYSTERY
                  <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase border border-white/10 px-3 py-1 rounded-full group-hover:text-white/70 group-hover:border-white/30 transition-colors">
                    Coming Soon
                  </span>
                ) : (
                  <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-[#dee5a0] transition-colors">
                    Tickets <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}