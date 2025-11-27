import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SeccionSumate() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from(".reveal-element", {
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 60%",
      }
    });
  }, { scope: containerRef });

  return (
    <section 
        ref={containerRef} 
        // AJUSTES:
        // -mt-32: Mantenemos la superposición con Equipos.
        // pt-64: AUMENTADO. Bajamos el contenido para separarlo de la sección anterior.
        // pb-48: Espacio abajo.
        className="relative w-full pt-64 pb-48 bg-[#0a0a0a] text-white flex flex-col items-center justify-center text-center px-6 overflow-hidden z-30 -mt-32"
    >
      
      {/* === 1. PARCHE DE FUSIÓN (Tapa el corte) === */}
      {/* Este gradiente negro sólido arriba asegura que no se vea la línea de unión */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-transparent z-0 pointer-events-none" />

      {/* === 2. LUZ DE FONDO (Bajada) === */}
      {/* top-[70%]: La bajamos para que el brillo no llegue al borde superior */}
      <div className="absolute top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#dee5a0] opacity-[0.03] blur-[120px] rounded-full pointer-events-none animate-[pulse_6s_ease-in-out_infinite] -z-10" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        
        {/* LÍNEA CONECTORA */}
        <div className="w-px h-32 mx-auto bg-gradient-to-b from-transparent via-white/20 to-[#dee5a0] mb-10" />

        {/* TÍTULO */}
        <h2 className="reveal-element text-3xl md:text-5xl font-serif italic text-[#dee5a0] mb-2 drop-shadow-lg">
          Propuestas &amp; Contacto
        </h2>

        {/* TEXTO */}
        <p className="reveal-element text-white/60 text-base md:text-lg font-light leading-relaxed">
          Siempre estamos abiertos a escuchar nuevas ideas, ya sea para sumarte al equipo técnico 
          o presentar un proyecto innovador. Si creés que tu visión se alinea con Gaceta, escribinos.
        </p>

        {/* MAIL */}
        <div className="reveal-element pt-6">
            <a 
                href="mailto:contacto@gacetaplay.com" 
                className="group relative inline-block py-2 px-4"
            >
                <div className="absolute inset-0 bg-white/5 scale-75 opacity-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                <span className="relative z-10 text-xl md:text-2xl tracking-wide font-medium text-white/90 transition-colors duration-300 group-hover:text-[#dee5a0]">
                    contacto@gacetaplay.com
                </span>
                <span className="absolute bottom-2 left-1/2 w-0 h-px bg-[#dee5a0] transition-all duration-300 -translate-x-1/2 group-hover:w-[80%]" />
            </a>
        </div>

      </div>
    </section>
  );
}