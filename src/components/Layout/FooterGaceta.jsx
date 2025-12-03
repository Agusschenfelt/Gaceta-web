import { useRef } from "react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import TransitionLink from "../TransitionLink"; 
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const FOOTER_LINKS = [
  { label: "Sobre Nosotros", href: "/sobre-nosotros" },
  { label: "Artistas", href: "/artistas" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contacto", href: "mailto:contacto@gacetaplay.com" },
];

// Componente de Letras (Modificado para GSAP)
function AnimatedWord({ word, lift = "14vh", className = "" }) {
  return (
    <div className={`flex gap-[0.02em] pointer-events-auto ${className}`}>
      {word.split("").map((ch, i) => (
        <span
          key={i}
          // Agregamos la clase "footer-letter" para targetearla con GSAP
          className="footer-letter inline-block will-change-transform cursor-default"
          style={{ "--lift": lift }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </div>
  );
}

export default function FooterGaceta() {
  const rootRef = useRef(null);

  // ANIMACIÓN DE ENTRADA DIVERTIDA
  useGSAP(() => {
    // Animación de las letras gigantes
    gsap.fromTo(".footer-letter", 
      { 
        y: 200,      // Empiezan muy abajo (escondidas)
        opacity: 0,  
        rotate: 15,  // Un poco rotadas para dar sensación de movimiento orgánico
        scale: 0.8   
      },
      {
        y: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        duration: 1.2,
        stagger: 0.05, // Efecto de ola (una por una)
        ease: "back.out(1.7)", // EL SECRETO: Este 'ease' hace que reboten al final (divertido)
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 75%", // Empieza cuando el footer asoma el 25%
          // "play none none reset" -> Significa: 
          // Al entrar: PLAY. 
          // Al salir por arriba: RESET (para que se anime de nuevo al bajar).
          toggleActions: "play none none reset" 
        }
      }
    );

    // Animación extra para el hover (efecto de levantar)
    // Mantenemos esto separado para no interferir con el scroll
    const letters = document.querySelectorAll(".footer-letter");
    letters.forEach((letter) => {
        letter.addEventListener("mouseenter", () => {
            gsap.to(letter, { y: -60, color: "#dee5a0", duration: 0.3, ease: "power2.out" });
        });
        letter.addEventListener("mouseleave", () => {
            gsap.to(letter, { y: 0, color: "rgba(255,255,255,0.05)", duration: 0.4, ease: "power2.out" });
        });
    });

  }, { scope: rootRef });

  return (
    <footer
      ref={rootRef}
      className="relative bg-[#0a0a0a] text-white overflow-hidden pt-20 pb-32 md:pt-32 md:pb-40 border-t border-white/5"
    >
      {/* Glow Sutil de Fondo */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_center,rgba(145,30,30,0.15),transparent_70%)]" />

      <div className="relative z-20 max-w-[1400px] mx-auto w-full px-6 md:px-10 grid gap-16 lg:grid-cols-12">
        
        {/* 1. FRASE GIGANTE (Izquierda) */}
        <div className="lg:col-span-7 self-start">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[0.95] tracking-tight text-white/90">
            Creando <br />
            experiencias <br />
            <span className="font-serif italic text-[#dee5a0]">únicas.</span>
          </h2>
        </div>

        {/* 2. COLUMNAS DE ENLACES (Derecha) */}
        <div className="lg:col-span-5 flex flex-col md:flex-row gap-12 md:gap-20 lg:justify-end">
          
          {/* Navegación Dinámica */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">Explorar</h3>
            <nav className="flex flex-col gap-3">
              {FOOTER_LINKS.map((item) => {
                const isExternal = item.href.startsWith("mailto") || item.href.startsWith("http");
                const linkClasses = "group relative w-fit text-lg font-light text-white/80 hover:text-white transition-colors cursor-pointer";
                const underline = (
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#dee5a0] transition-all duration-300 group-hover:w-full" />
                );

                return isExternal ? (
                  <a key={item.label} href={item.href} className={linkClasses}>
                    {item.label}
                    {underline}
                  </a>
                ) : (
                  <TransitionLink key={item.label} to={item.href} className={linkClasses}>
                    {item.label}
                    {underline}
                  </TransitionLink>
                );
              })}
            </nav>
          </div>

          {/* Contacto & Redes */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">Contacto</h3>
                <address className="not-italic text-lg font-light text-white/80 leading-relaxed">
                  Buenos Aires, AR <br />
                  Montevideo, UY <br />
                  <a href="mailto:contacto@gacetaplay.com" className="hover:text-[#dee5a0] transition-colors mt-2 block">
                    contacto@gacetaplay.com
                  </a>
                </address>
            </div>

            <div className="flex gap-4 text-xl text-white/60">
                {[
                  { Icon: FaInstagram, url: "https://instagram.com/gacetaplay" },
                  { Icon: FaTwitter, url: "https://x.com/gacetaplay" },
                  { Icon: FaTiktok, url: "https://tiktok.com/@gaceta.play" },
                  { Icon: FaYoutube, url: "https://youtube.com/@gacetaplay" }
                ].map(({ Icon, url }, i) => (
                    <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-white hover:scale-110 transition-all duration-300"
                    >
                        <Icon />
                    </a>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOOTER BOTTOM */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-6 md:px-10 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 uppercase tracking-widest font-mono">
          <div className="flex gap-6">
            <p>© 2025 Gaceta Music.</p>
            <p className="hidden sm:block">All rights reserved.</p>
          </div>
          <p className="hover:text-white/60 transition-colors cursor-default">
            Made by Gaceta
          </p>
      </div>

      {/* 4. GACETA GIGANTE (Contenedor ajustado) */}
      <div
        aria-hidden
        className="
          absolute left-0 right-0 bottom-[-2vw] z-10
          flex justify-center pointer-events-auto select-none
        "
      >
        <AnimatedWord
          word="GACETA"
          className="
            font-black tracking-[-0.05em] 
            text-[28vw] leading-[0.7]
            text-white/5  
            select-none
          "
        />
      </div>
    </footer>
  );
}