import React, { useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SEO from "../SEO";
import SeccionArtistas from "../components/Pagina-Home/SeccionArtistas"; 
import { ARTISTS_DATA } from "../data/artistsData"; 

// Componente Marquee (Texto Infinito)
const InfiniteMarquee = () => (
  <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden pointer-events-none opacity-[0.03] select-none z-0">
    <div className="whitespace-nowrap animate-marquee">
      {[...Array(4)].map((_, i) => (
        <span key={i} className="text-[15vw] font-black uppercase tracking-tighter leading-none mx-4">
          Gaceta Roster — 2025 — Talent & Culture —
        </span>
      ))}
    </div>
  </div>
);

export default function RosterPage() {
  const container = useRef(null);
  const [filter, setFilter] = useState("all"); // 'all', 'cantante', 'productor'

  // Lógica de Filtrado
  const filteredArtists = useMemo(() => {
    if (filter === "all") return ARTISTS_DATA;
    // Filtro simple buscando la palabra clave en el rol (ej: "Cantante / Productor")
    return ARTISTS_DATA.filter((artist) => 
        artist.rol.toLowerCase().includes(filter)
    );
  }, [filter]);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.from(".roster-anim", {
      y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
    });
  }, { scope: container });

  return (
    <>
      <SEO 
        title="Roster" 
        description="Archivo de talentos de Gaceta. Artistas y productores que definen la escena."
        url="/artistas"
      />

      {/* Agregamos esto en tu CSS global o aquí mismo para el Marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
      `}</style>

      <main ref={container} className="min-h-screen bg-[#0a0a0a] pt-32 pb-20 relative overflow-hidden">
        
        {/* 1. MARQUEE DE FONDO (Da textura y movimiento) */}
        <InfiniteMarquee />

        {/* 2. HEADER INTERACTIVO */}
        <div className="relative z-10 px-6 md:px-10 mb-16 max-w-[1400px] mx-auto">
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/10 pb-8">
                
                {/* Título */}
                <div className="roster-anim">
                    <span className="block text-xs font-mono text-[#dee5a0] tracking-[0.2em] mb-2 uppercase">
                        Archivo Gaceta
                    </span>
                    <h1 className="text-6xl md:text-8xl font-serif italic text-white tracking-tighter leading-[0.9]">
                        Roster
                    </h1>
                </div>

                {/* Filtros y Contador */}
                <div className="roster-anim flex flex-col items-end gap-4">
                    {/* Contador Técnico */}
                    <span className="font-mono text-xs text-white/30 tracking-widest">
                        [{filteredArtists.length.toString().padStart(2, '0')}] TALENTOS
                    </span>

                    {/* Botones de Filtro (Estilo Pill) */}
                    <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
                        {['all', 'cantante', 'productor'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`
                                    px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                                    ${filter === f 
                                        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                                        : "text-white/50 hover:text-white hover:bg-white/5"}
                                `}
                            >
                                {f === 'all' ? 'Todos' : f + 's'}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>

        {/* 3. GRID (Usamos key para que React re-renderice la animación al filtrar) */}
        {/* Usamos un div con key para forzar la re-entrada suave al cambiar filtros */}
        <div key={filter} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SeccionArtistas artistsData={filteredArtists} showAll={true} />
        </div>

      </main>
    </>
  );
}