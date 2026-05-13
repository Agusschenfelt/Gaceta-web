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

        {/* TÍTULO — footnote weight */}
        <h2 className="reveal-element text-[10px] font-mono uppercase tracking-[0.35em] text-white/50">
          Contacto
        </h2>

        {/* TEXTO */}
        <p className="reveal-element text-white/50 text-sm font-light leading-relaxed max-w-xs mx-auto">
          ¿Querés ponerte en contacto? Escribinos.
        </p>

        {/* MAIL */}
        <div className="reveal-element pt-2">
          <a
            href="mailto:contacto@gacetaplay.com"
            className="text-xs font-mono text-white/50 hover:text-white/80 transition-colors duration-300"
          >
            contacto@gacetaplay.com
          </a>
        </div>

      </div>
    </section>
  );
}