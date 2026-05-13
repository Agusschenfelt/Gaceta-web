import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ArtistCardHover from './ArtistCardHover';
import TransitionLink from '../TransitionLink';
import { ArrowUpRight } from 'lucide-react';


// Nombres exactos de los Headliners (debe coincidir con tu data)
const HEADLINERS = ["ARA", "RAMMA", "VALUTO"];

export default function SeccionArtistas({ artistsData, showAll = false }) {
  const containerRef = useRef(null);

  // Lógica de Filtrado:
  // Si showAll es true, muestra todos.
  // Si no, muestra solo los que están en la lista HEADLINERS.
  const displayArtists = showAll 
    ? artistsData 
    : artistsData.filter(a => HEADLINERS.includes(a.nombre.toUpperCase()));

  useGSAP(() => {
    // Animación de entrada escalonada
    gsap.from(".artist-card-anim", {
      y: 50,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
        once: true,
      }
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-black py-32 px-6 md:px-10 z-30"
    >
      {/* Fade de salida hacia Shows — mismo mecanismo que Shows → GacetaTV */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-56 bg-gradient-to-b from-transparent to-fondo pointer-events-none z-20" />
       <div className="max-w-[1400px] mx-auto">
         
         {/* HEADER SUTIL (Opcional, para dar contexto) */}
         {!showAll && (
            <div className="mb-16 flex items-end justify-between border-b border-white/10 pb-6 artist-card-anim">
                <div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif italic text-white leading-none">
                        Roster
                    </h2>
                </div>
            </div>
         )}

         {/* GRID DE ARTISTAS */}
         <div className={`grid gap-6 md:gap-10 relative 
            ${showAll
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" // Grid denso para "Todos"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" // Grid amplio para "Destacados"
            }`}
         >
           {displayArtists.map((artist, index) => (
             <div key={artist.id || index} className="artist-card-anim w-full">
                {/* Si son destacados, forzamos un aspect ratio más vertical (poster) 
                    para que se vean más imponentes.
                */}
                <div className={`${!showAll ? "aspect-[3/4.5]" : ""}`}>
                    <ArtistCardHover artist={artist} />
                </div>
             </div>
           ))}
         </div>

         {/* BOTÓN "VER TODOS" (Solo si no estamos mostrando todos) */}
         {!showAll && (
            <div className="mt-20 flex justify-center artist-card-anim">
                <TransitionLink
                    to="/artistas"
                    aria-label="Ver todos los artistas"
                    className="group relative inline-flex items-center gap-3 px-8 py-4 overflow-hidden rounded-full bg-white/5 border border-white/10 hover:border-secundario/50 transition-[border-color] duration-500"
                >
                    <span className="relative z-10 font-mono text-xs uppercase tracking-[0.2em] text-white group-hover:text-secundario transition-colors">
                        Ver Roster Completo
                    </span>
                    <ArrowUpRight className="relative z-10 w-4 h-4 text-white group-hover:text-secundario group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                    
                    {/* Hover Fill Effect */}
                    <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                </TransitionLink>
            </div>
         )}

       </div>
    </section>
  );
}