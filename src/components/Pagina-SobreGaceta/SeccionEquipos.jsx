import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEFAULT_AREAS = [
  {
    titulo: "Gaceta Audiovisual",
    descripcion: "Narrativa visual y estética. Cubrimos shows, producimos videoclips y creamos el universo visual que acompaña a cada artista.",
    imagen: "/assets/equipoGAV.JPG"
  },
  {
    titulo: "Gaceta Marketing",
    descripcion: "Estrategia y comunidad. Conectamos los lanzamientos con su audiencia real a través de campañas digitales y gestión de identidad.",
    imagen: "/assets/equipoGAV.JPG"
  },
  {
    titulo: "Piece Of Music",
    descripcion: "Espacios de encuentro. Una iniciativa junto a Indutop para potenciar la industria y el talento emergente en Uruguay.",
    imagen: "/assets/equipoGAV.JPG"
  }
];

export default function SeccionEquipos({ areas = DEFAULT_AREAS }) {
  const sectionRef = useRef(null);

  useGSAP(() => {
    gsap.from(".team-header-item", {
      y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
    });

    gsap.from(".team-card", {
      y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
      scrollTrigger: { trigger: ".team-grid", start: "top 80%" }
    });
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef}
      className="relative w-full bg-[#0a0a0a] text-white py-32 px-6 md:px-10 z-30"
    >
      <div className="mx-auto max-w-[1400px]">
        
        {/* HEADER CORREGIDO */}
        {/* items-start en móvil (izquierda), md:items-end en desktop (alineado abajo) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6 border-b border-white/10 pb-8">
          <div className="team-header-item">
            <h2 className="text-5xl md:text-7xl font-serif italic text-[#dee5a0]">Áreas</h2>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.8]">Creativas</h2>
          </div>
          {/* Texto alineado a la izquierda en móvil, derecha en desktop */}
          <p className="team-header-item text-sm md:text-base text-white/50 max-w-md font-light leading-relaxed text-pretty text-left md:text-right">
            Estructura integral para el desarrollo de artistas. 
            Desde la producción sonora hasta la identidad visual.
          </p>
        </div>

        {/* GRID */}
        <div className="team-grid grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {areas.map((a, i) => (
            <article key={i} className="team-card group relative aspect-[3/4] overflow-hidden rounded-lg bg-white/5 border border-white/5">
              <img 
                src={a.imagen} 
                alt={a.titulo} 
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100" 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-500" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                <h3 className="text-2xl font-serif italic text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-2">
                    {a.titulo}
                </h3>
                {/* Descripción desplegable */}
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-out">
                    <div className="overflow-hidden">
                        <p className="text-sm text-gray-300 leading-relaxed pt-3 border-t border-[#dee5a0]/30">
                            {a.descripcion}
                        </p>
                    </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}