import React, { useRef, useMemo, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";
import { showsData } from "../../data/showsData"; 

export default function SeccionProximosShows() {
  const container = useRef(null);
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVideoSrc("/assets/video-shows.mp4"); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // === TRANSFORMACIÓN DE DATOS ===
  const processedShows = useMemo(() => {
    const sortedShows = [...showsData].sort((a, b) => {
      if (!a.date && b.date) return 1;   // mystery/TBA va al final
      if (a.date && !b.date) return -1;  // fechas concretas primero
      if (!a.date && !b.date) return 0;
      return a.date.localeCompare(b.date); // ascendente = más próximo primero
    });

    return sortedShows.map((show) => {
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
        status: show.soldOut ? "sold out" : (isMystery ? "soon" : "tickets"), 
        isMystery: isMystery,
        // CAMBIO 1: Pasamos el link de la data al componente procesado
        ticketLink: show.ticketLink || "#", 
      };
    });
  }, []);

  useGSAP(() => {
    // Header entrance: eyebrow slide + "Shows" wipe horizontal + borde
    const headerTl = gsap.timeline({
      scrollTrigger: { trigger: container.current, start: "top 75%", once: true }
    });

    headerTl
      .fromTo(".shows-eyebrow",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0)
      .fromTo(".shows-heading",
        { clipPath: "inset(0% 100% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power3.out" }, 0.12);

    // Show rows: un solo ScrollTrigger con stagger en lugar de N instancias individuales
    gsap.fromTo(".show-row",
      { x: -24, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.04,
        scrollTrigger: { trigger: container.current, start: "top 70%", once: true }
      }
    );
  }, { scope: container });

  return (
    <section 
      ref={container} 
      id="shows"
      className="relative w-full min-h-[100svh] grid grid-cols-1 grid-rows-1 bg-black z-10"
    >
      {/* CAPA 1: FONDO (Sin cambios) */}
      <div aria-hidden="true" className="col-start-1 row-start-1 w-full h-full pointer-events-none z-0">
        <div ref={videoRef} className="sticky top-0 w-full h-[100svh] overflow-hidden">
            <video src={videoSrc || undefined} autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-fondo to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-72 bg-gradient-to-t from-fondo to-transparent" />
        </div>
      </div>

      {/* CAPA 2: CONTENIDO */}
      <div className="col-start-1 row-start-1 w-full h-full z-10 flex flex-col items-center py-32 px-4 md:px-10">
        <div className="w-full max-w-[1200px] mx-auto">
            {/* HEADER (Sin cambios) */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 border-b border-white/20 pb-6">
                <div>
                    <span className="shows-eyebrow block text-xs font-mono text-secundario tracking-widest mb-2 uppercase text-left">Calendario 2026</span>
                    <h2 className="shows-heading text-5xl md:text-6xl lg:text-8xl font-serif italic leading-none text-white text-left">Shows</h2>
                </div>
            </div>

            {/* LISTA DE SHOWS */}
            <div className="flex flex-col gap-2 pb-20">
            {processedShows.map((show) => (
                <div
                key={show.id}
                className={`show-row group relative flex flex-col md:flex-row md:items-center p-4 md:p-6 border border-white/10 transition-[background-color,border-color] duration-500 rounded-sm
                    ${show.isMystery
                        ? "bg-black/20 hover:bg-black/30"
                        : "bg-black/50 hover:bg-black/60 hover:border-secundario/50"
                    }
                `}
                >
                
                {/* FECHA & ARTISTA (Sin cambios) */}
                <div className="w-full md:w-1/4 flex items-baseline gap-2 mb-2 md:mb-0">
                    <span className={`text-4xl md:text-5xl font-light tracking-tighter transition-colors ${show.isMystery ? "text-white/30" : "text-white group-hover:text-secundario"}`}>
                    {show.day}
                    </span>
                    <span className="text-2xl font-mono text-white/40 uppercase">/{show.month}</span>
                </div>

                <div className="w-full md:w-2/4 flex flex-col">
                    <h3 className={`text-3xl font-bold text-white uppercase tracking-wider leading-none transition-[filter,opacity,transform] duration-500 ${show.isMystery ? "blur-sm opacity-50 group-hover:blur-[2px] group-hover:opacity-80" : "group-hover:translate-x-2"}`}>
                    {show.artist}
                    </h3>
                    <p className={`text-sm text-white/50 mt-1 flex items-center gap-2 min-w-0 ${show.isMystery ? "blur-[2px]" : ""}`}>
                    <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${show.isMystery ? "bg-white/20" : "bg-secundario"}`} />
                    <span className="truncate">{show.venue} <span className="text-white/20">/</span> {show.city}</span>
                    </p>
                </div>

                {/* BOTON / STATUS - CAMBIO AQUÍ */}
                <div className="w-full md:w-1/4 flex justify-start md:justify-end items-center mt-3 md:mt-0">
                    {show.status === "sold out" ? (
                        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase border border-white/15 px-3 py-1 rounded-full bg-white/5">
                            Sold Out
                        </span>
                    ) : show.status === "soon" ? (
                        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/40 uppercase border border-white/10 px-3 py-1 rounded-full group-hover:text-white/70 group-hover:border-white/30 transition-colors">
                            Coming Soon
                        </span>
                    ) : (
                        /* CAMBIO 2: Cambiamos <button> por <a> manteniendo las clases IDÉNTICAS */
                        <a 
                            href={show.ticketLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-white text-black text-xs font-bold font-mono uppercase tracking-wider hover:bg-secundario transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        >
                            Tickets <ArrowUpRight size={14} className="transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" />
                        </a>
                    )}
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}