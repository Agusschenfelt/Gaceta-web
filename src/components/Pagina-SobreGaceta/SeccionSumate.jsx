import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
        className="relative w-full pt-20 pb-16 bg-fondo text-white flex flex-col items-center justify-center text-center px-6 overflow-hidden z-30"
    >
      <div className="relative z-10 max-w-lg mx-auto space-y-4">

        {/* TÍTULO */}
        <h2 className="reveal-element text-xs font-mono uppercase tracking-[0.35em] text-secundario/60">
          Contacto
        </h2>

        {/* TEXTO */}
        <p className="reveal-element text-white/60 text-sm font-light leading-relaxed max-w-xs mx-auto">
          ¿Querés trabajar con nosotros? Contanos tu proyecto — respondemos en 48hs.
        </p>

        {/* MAIL */}
        <div className="reveal-element pt-2">
          <a
            href="mailto:contacto@gacetaplay.com"
            className="group flex items-center justify-center gap-2 text-sm font-mono text-white/80 hover:text-secundario transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario rounded-sm"
          >
            contacto@gacetaplay.com
            <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] duration-300">↗</span>
          </a>
        </div>

      </div>
    </section>
  );
}