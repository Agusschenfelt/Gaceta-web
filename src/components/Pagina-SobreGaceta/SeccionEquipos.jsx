import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";


const DEFAULT_AREAS = [
  {
    titulo: "Gaceta Audiovisual",
    descripcion: "Narrativa visual y estética. Cubrimos shows, producimos videoclips y creamos el universo visual que acompaña a cada artista.",
    imagen: "/assets/equipos/GAV_v4.png"
  },
  {
    titulo: "Gaceta Marketing",
    descripcion: "Estrategia y comunidad. Conectamos los lanzamientos con su audiencia real a través de campañas digitales y gestión de identidad.",
    imagen: "/assets/equipos/GAM_v2.png"
  },
  {
    titulo: "Piece Of Music",
    descripcion: "Espacios de encuentro. Una iniciativa junto a Indutop para potenciar la industria y el talento emergente en Uruguay.",
    imagen: "/assets/equipos/POM.jpg"
  }
];

export default function SeccionEquipos({ areas = DEFAULT_AREAS }) {
  const sectionRef = useRef(null);
  const connectorRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(connectorRef.current,
      { scaleY: 0 },
      {
        scaleY: 1, duration: 1.2, ease: "power3.inOut", transformOrigin: "top",
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%", once: true }
      }
    );

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
      className="relative w-full bg-fondo text-white py-32 px-6 md:px-10 z-30"
    >
      {/* Fade de entrada desde Timeline */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-fondo to-transparent pointer-events-none z-10" />

      {/* Línea conectora desde Timeline */}
      <div aria-hidden="true" className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-[1px] z-20 origin-top">
        <div
          ref={connectorRef}
          className="w-full h-full bg-gradient-to-b from-secundario via-secundario/40 to-transparent"
          style={{ boxShadow: "0 0 10px rgba(222,229,160,0.3)" }}
        />
      </div>
      <div className="mx-auto max-w-[1400px]">
        
        {/* HEADER CORREGIDO */}
        {/* items-start en móvil (izquierda), md:items-end en desktop (alineado abajo) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6 border-b border-white/10 pb-8">
          <div className="team-header-item">
            <h2 className="text-5xl md:text-7xl tracking-tighter leading-[0.8]">
              <span className="block font-serif italic text-secundario">Áreas</span>
              <span className="block font-bold">Creativas</span>
            </h2>
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
            <article key={i} className="team-card group relative aspect-[3/4] overflow-hidden rounded-lg bg-white/5 border border-white/5 focus-within:ring-2 focus-within:ring-secundario focus-within:ring-offset-2 focus-within:ring-offset-fondo">
              <img 
                src={a.imagen} 
                alt={a.titulo} 
                className="absolute inset-0 h-full w-full object-cover transition-[filter,opacity,transform] duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100" 
                loading="lazy" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-500" />
              <span className="absolute top-5 left-5 font-mono text-xs text-secundario/40 z-10 group-hover:text-secundario/80 transition-colors">0{i + 1}</span>
              
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                <h3 className="text-2xl font-serif italic text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-2">
                    {a.titulo}
                </h3>
                {/* Descripción: siempre visible en mobile, reveal en desktop */}
                <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
                    <div className="overflow-hidden">
                        <p className="text-sm text-white/70 leading-relaxed pt-3 border-t border-secundario/30">
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