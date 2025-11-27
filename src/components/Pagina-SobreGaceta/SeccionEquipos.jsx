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
    imagen: "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?auto=format&fit=crop&w=800"
  },
  {
    titulo: "Piece Of Music",
    descripcion: "Espacios de encuentro. Una iniciativa junto a Indutop para potenciar la industria y el talento emergente en Uruguay.",
    imagen: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800"
  }
];

export default function SeccionEquipos({ areas = DEFAULT_AREAS }) {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Animación Header
    gsap.from(".team-header-item", {
      y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" }
    });

    // Animación Cards
    gsap.from(".team-card", {
      y: 60, opacity: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
      scrollTrigger: { trigger: ".team-grid", start: "top 80%" }
    });
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef}
      // z-30: Mantiene la jerarquía
      // bg-[#0a0a0a]: Fondo negro sólido coherente
      className="relative w-full bg-[#0a0a0a] text-white py-32 px-6 md:px-10 z-30"
    >
      <div className="mx-auto max-w-[1400px]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6 border-b border-white/10 pb-8">
          <div className="team-header-item">
            <h2 className="text-5xl md:text-7xl font-serif italic text-[#dee5a0]">Áreas</h2>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.8]">Creativas</h2>
          </div>
          <p className="team-header-item text-sm md:text-base text-white/50 max-w-md font-light leading-relaxed text-pretty md:text-right">
            Estructura integral para el desarrollo de artistas. 
            Desde la producción sonora hasta la identidad visual.
          </p>
        </div>

        {/* GRID */}
        <div className="team-grid grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {areas.map((a, i) => (
            <article key={i} className="team-card group relative aspect-[3/4] overflow-hidden rounded-lg bg-white/5">
              <img 
                src={a.imagen} 
                alt={a.titulo} 
                // CAMBIOS: grayscale por defecto, grayscale-0 en hover. 
                // Aumentamos la opacidad base para que se vean un poco más oscuras.
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100" 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                <h3 className="text-2xl font-serif italic text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-2">{a.titulo}</h3>
                <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-500 ease-out">
                    <p className="text-sm text-gray-300 leading-relaxed pt-2 border-t border-[#dee5a0]/30">{a.descripcion}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}