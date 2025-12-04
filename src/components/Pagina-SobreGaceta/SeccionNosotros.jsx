import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, useGSAP, ScrollTrigger);

export default function SeccionNosotros() {
  const container = useRef();
  const titleRef = useRef();
  const lineRef = useRef();
  
  useGSAP(() => {
    const split = new SplitText(titleRef.current, { type: "lines, words" });
    const tl = gsap.timeline();

    tl.from(split.words, {
      duration: 1.2, y: 40, opacity: 0, rotation: 5, stagger: 0.05, ease: "power3.out",
    }).from(".fade-in-text", {
        opacity: 0, y: 20, duration: 1, stagger: 0.2, ease: "power2.out"
    }, "-=0.8");

    // Animación línea
    gsap.fromTo(lineRef.current, 
      { scaleY: 0 },
      { 
        scaleY: 1, transformOrigin: "top", ease: "none",
        scrollTrigger: {
            trigger: container.current,
            start: "center center",
            end: "bottom center",
            scrub: true
        }
      }
    );
  }, { scope: container });

  return (
    <section ref={container} className="relative w-full h-[100vh] overflow-hidden bg-black">
      
      <div className="absolute inset-0 z-0"> 
         <video src="/assets/ara-perfil.mp4" autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </div>

      {/* Subimos un poco el contenido para dejar espacio a la línea abajo */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 lg:px-28 max-w-[1400px] mx-auto pb-20">
        <div className="mb-12">
          <h2 ref={titleRef} className="titulo text-5xl lg:text-8xl leading-[0.9] text-white">
            de la <span className="cursiva text-[#dee5a0]">esperanza</span>
            <br />
            al <span className="cursiva text-[#dee5a0]">primer paso</span>
          </h2>
        </div>

        <div className="flex flex-col gap-8 max-w-2xl fade-in-text">
          <p className="text-white/90 font-light text-lg lg:text-xl leading-relaxed text-pretty">
            Gaceta es un sello independiente y comunidad de artistas del Río de
            la Plata, especializado en el desarrollo integral de proyectos
            musicales. Acompañamos a los artistas desde la canción hasta la
            imagen: planificamos lanzamientos, distribuimos su música y
            producimos el contenido audiovisual que necesitan. Nos enfocamos en
            crear piezas que conecten con la audiencia, combinando creatividad,
            estrategia y producción de calidad para potenciar su alcance y
            construir carreras a largo plazo.
          </p>
          <div className="fade-in-text">
            <span className="block text-sm uppercase tracking-widest text-[#dee5a0] mb-2">Based in</span>
            <span className="text-2xl font-serif italic text-white">Argentina &amp; Uruguay</span>
          </div>
        </div>
      </div>

      {/* LÍNEA: Empieza mucho más abajo (top-[80%]) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-48 w-px z-20 overflow-hidden">
        <div ref={lineRef} className="w-full h-full bg-gradient-to-b from-transparent via-white/50 to-[#dee5a0]" />
      </div>

    </section>
  );
}