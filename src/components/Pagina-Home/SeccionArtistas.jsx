import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import ArtistCardHover from './ArtistCardHover';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function SeccionArtistas({ artistsData }) {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from(".artist-grid-card", {
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".artist-grid",
        start: "top 85%",
      }
    });
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      // pt-0: Eliminamos el padding top para que la sección se pegue a la línea conectora
      className="relative w-full bg-black pt-0 pb-72 px-4 md:px-10 z-30"
    >
       {/* GRADIENTE SUPERIOR: Recibe la línea de luz suavemente */}
       <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black via-black/90 to-transparent z-10 -mt-20 pointer-events-none" />

       {/* GRID LIMPIO */}
       <div className="artist-grid max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 relative z-20">
         {artistsData.map((artist, index) => (
           <div key={artist.id || index} className="artist-grid-card will-change-transform">
              <ArtistCardHover artist={artist} />
           </div>
         ))}
       </div>
    </section>
  );
}