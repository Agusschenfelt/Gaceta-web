import { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function SeccionGacetaTv() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  const videoIds = ["nVIm2-qJzYA", "yXEHvgxi3MI", "uIByPBurV5g", "MKFDGc5f_5s"];
  const [videoId] = useState(() => videoIds[Math.floor(Math.random() * videoIds.length)]);
  const [isIframeActive, setIsIframeActive] = useState(false);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsIframeActive(true); observer.disconnect(); } },
      { root: null, threshold: 0.1 }
    );
    observer.observe(sec);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
        // Entrada del Video
        gsap.fromTo(cardRef.current, 
          { y: 100, opacity: 0.6, scale: 0.95 }, 
          {
            y: 0, opacity: 1, scale: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 85%", 
                end: "top 40%",
                scrub: 1, 
            }
        });

        // Glow Pulsante
        gsap.to(glowRef.current, { opacity: 0.5, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gacetatv"
      // z-40: Mantenemos alto para tapar el final de Artistas.
      // pb-32: Espacio suficiente para que termine el componente visualmente.
      className="relative z-40 w-full -mt-32 pb-32 flex flex-col items-center pointer-events-none" 
    >
      
      {/* 1. FONDO GRADIENTE (Capa más baja: -z-20) */}
      {/* Usamos un gradiente que va de transparente a negro y se mantiene negro abajo */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-[#0a0a0a] -z-20" />

      {/* 2. GLOW ROJO (Capa media: -z-10) */}
      {/* Al ponerlo en -z-10, queda POR ENCIMA del fondo negro (-z-20) pero DETRÁS del video */}
      <div 
        ref={glowRef} 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[40svw] bg-[#8d1e1e] blur-[180px] rounded-full opacity-0 -z-10 mix-blend-screen" 
      />

      {/* 3. CONTENEDOR DE VIDEO (Capa superior implícita) */}
      <div
        ref={cardRef}
        className="relative z-20 w-[92%] max-w-[1100px] aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black shadow-2xl pointer-events-auto mt-24"
      >
        {!isIframeActive && (
          <div className="w-full h-full flex items-center justify-center text-xs tracking-[0.2em] text-white/40 uppercase">
            Cargando Stream...
          </div>
        )}

        {isIframeActive && videoId && (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1`}
            title="GacetaTV"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      <h2 className="mt-10 text-center text-white/90 font-semibold tracking-widest uppercase text-xs z-20">
        GACE<span className="text-[#8d1e1e]">TV</span>
      </h2>
    </section>
  );
}