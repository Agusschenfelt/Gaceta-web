import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";


export default function SeccionNosotros() {
  const container = useRef();
  const titleRef = useRef();
  const lineRef = useRef();
  
  useGSAP(() => {
    const split = new SplitText(titleRef.current, { type: "lines, words" });
    // delay: coordina con el curtain de page transition
    const tl = gsap.timeline({ delay: 0.55 });

    tl.from(".eyebrow-hero", { opacity: 0, y: 10, duration: 0.5, ease: "power2.out" })
      .from(split.words, {
        duration: 1.2, y: 40, opacity: 0, rotation: 5, stagger: 0.05, ease: "power3.out",
      }, "-=0.2")
      .from(".fade-in-text", {
        opacity: 0, y: 20, duration: 1, stagger: 0.15, ease: "power2.out"
      }, "-=0.8");

    // Línea: se completa en bottom:55% — punto exacto donde empieza la línea del Timeline
    gsap.fromTo(lineRef.current,
      { scaleY: 0 },
      {
        scaleY: 1, transformOrigin: "top", ease: "none",
        scrollTrigger: {
          trigger: container.current,
          start: "bottom 75%",
          end: "bottom 55%",
          scrub: true,
        }
      }
    );
  }, { scope: container });

  return (
    <section ref={container} className="relative w-full min-h-[100svh] overflow-hidden bg-fondo">

      <div className="absolute inset-0 z-0">
         <video src="/assets/reel-sobre-nosotross.mp4" autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-b from-fondo/60 via-transparent to-fondo" />
         {/* Gradiente de transición hacia el Timeline — dentro de z-0 para no tapar el contenido */}
         <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-b from-transparent to-fondo pointer-events-none" />
      </div>

      {/* pt-24/28 compensa la Navbar fija; min-h centra verticalmente */}
      <div className="relative z-10 min-h-[100svh] flex flex-col justify-center px-6 md:px-14 lg:px-28 max-w-[1400px] mx-auto pt-24 md:pt-28 pb-28">

        <span className="eyebrow-hero block text-xs font-mono uppercase tracking-[0.4em] text-secundario/60 mb-8">
          Sello Independiente — Desde 2021
        </span>

        <div className="mb-12">
          <h2 ref={titleRef} className="titulo text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-white">
            de la <span className="cursiva text-secundario">esperanza</span>
            <br />
            al <span className="cursiva text-secundario">primer paso</span>
          </h2>
        </div>

        <div className="flex flex-col gap-8 max-w-2xl">

          {/* Bloque principal de texto */}
          <div className="fade-in-text border-l-2 border-secundario/30 pl-5 flex flex-col gap-4">
            <p className="text-white/90 font-light text-xl md:text-2xl leading-snug">
              Sello independiente y comunidad de artistas del Río de la Plata,
              especializado en el desarrollo integral de proyectos musicales.
            </p>
            <p className="text-white/60 font-light text-base md:text-lg leading-relaxed text-pretty">
              Acompañamos a los artistas desde la canción hasta la imagen:
              planificamos lanzamientos, distribuimos su música y producimos el
              contenido audiovisual que necesitan. Nos enfocamos en crear piezas
              que conecten con la audiencia, combinando creatividad, estrategia
              y producción de calidad para potenciar su alcance y construir
              carreras a largo plazo.
            </p>
          </div>

          {/* Based in */}
          <div className="fade-in-text">
            <span className="block text-sm uppercase tracking-widest text-secundario mb-2">Based in</span>
            <span className="text-2xl font-serif italic text-white">Argentina &amp; Uruguay</span>
          </div>

        </div>
      </div>

      {/* Línea conectora hacia el Timeline */}
      <div className="absolute bottom-0 h-28 w-px z-20 left-[33px] md:left-[calc(50vw_-_0.5px)]">
        <div ref={lineRef} className="w-full h-full bg-gradient-to-b from-transparent via-secundario/60 to-secundario shadow-[0_0_10px_var(--color-secundario)]" />
      </div>

    </section>
  );
}