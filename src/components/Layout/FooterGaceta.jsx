import { useRef, useState } from "react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";
import TransitionLink from "../TransitionLink"; 
import gsap from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

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
          className="footer-letter inline-block cursor-default"
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
  
  // Estado para controlar si mostramos los créditos en móvil (toggle)
  const [creditsOpen, setCreditsOpen] = useState(false);

  // ANIMACIÓN DE ENTRADA DIVERTIDA
  useGSAP(() => {
    // Animación de las letras gigantes
    gsap.fromTo(".footer-letter",
      {
        y: 150,
        opacity: 0,
        rotate: 5,
        scale: 0.9,
      },
      {
        y: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        duration: 1.6,
        stagger: 0.08, // Más lento entre letras
        ease: "power3.out", // Más suave, menos rebote
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 70%", 
          toggleActions: "play none none reset" 
        }
      }
    );

    // Hover effect only on pointer-capable devices (not touch)
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const letterHandlers = [];

    if (canHover) {
      const letters = rootRef.current.querySelectorAll(".footer-letter");
      letters.forEach((letter) => {
          const onEnter = () => gsap.to(letter, { y: -60, color: "var(--color-secundario)", duration: 0.3, ease: "power2.out" });
          const onLeave = () => gsap.to(letter, { y: 0, color: "rgba(255,255,255,0.05)", duration: 0.4, ease: "power2.out" });
          letter.addEventListener("mouseenter", onEnter);
          letter.addEventListener("mouseleave", onLeave);
          letterHandlers.push({ letter, onEnter, onLeave });
      });
    }

    return () => {
      letterHandlers.forEach(({ letter, onEnter, onLeave }) => {
        letter.removeEventListener("mouseenter", onEnter);
        letter.removeEventListener("mouseleave", onLeave);
      });
    };

  }, { scope: rootRef });

  return (
    <footer
      ref={rootRef}
      className="relative bg-fondo text-white overflow-hidden pt-20 pb-32 md:pt-32 md:pb-40 border-t border-white/5"
    >

      <div className="relative z-20 max-w-[1400px] mx-auto w-full px-6 md:px-10 grid gap-16 lg:grid-cols-12">
        
        {/* 1. FRASE GIGANTE (Izquierda) */}
        <div className="lg:col-span-7 self-start">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[0.95] tracking-tight text-white/90">
            La escena, <br />
            en primera <br />
            <span className="font-serif italic text-secundario">plana.</span>
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
                const linkClasses = "group relative w-fit text-lg font-light text-white/80 hover:text-white transition-colors cursor-pointer py-2 block";
                const underline = (
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-secundario transition-[width] duration-300 group-hover:w-full" />
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
                  <a href="mailto:contacto@gacetaplay.com" className="hover:text-secundario transition-colors mt-2 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario rounded-sm">
                    contacto@gacetaplay.com
                  </a>
                </address>
            </div>

            <div className="flex gap-1 text-xl text-white/60">
                {[
                  { Icon: FaInstagram, url: "https://www.instagram.com/esgaceta", label: "Instagram de GACETA" },
                  { Icon: FaTwitter, url: "https://x.com/esgaceta", label: "Twitter / X de GACETA" },
                  { Icon: FaTiktok, url: "https://www.tiktok.com/@esgaceta", label: "TikTok de GACETA" },
                  { Icon: FaYoutube, url: "https://youtube.com/@esgaceta", label: "YouTube de GACETA" }
                ].map(({ Icon, url, label }, i) => (
                    <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="flex items-center justify-center w-11 h-11 hover:text-white hover:scale-110 transition-[color,transform] duration-300"
                    >
                        <Icon />
                    </a>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 max-w-[1400px] mx-auto px-6 md:px-10 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs uppercase tracking-widest font-mono">
          
          {/* Copyright */}
          <div className="flex gap-6 text-white/30">
            <p>© 2026 Gaceta Music.</p>
            <p className="hidden sm:block">All rights reserved.</p>
          </div>

          {/* EL GUIÑO INTERACTIVO (Tap to Reveal) */}
          <button
            type="button"
            aria-expanded={creditsOpen}
            onClick={() => setCreditsOpen(!creditsOpen)}
            className="group flex items-center py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-fondo rounded-sm"
          >
            
            <span className="text-white/30 transition-colors duration-500 group-hover:text-white/50">
              Made by Gaceta
            </span>

            <span
              className={`overflow-hidden whitespace-nowrap text-secundario transition-[max-width,opacity,margin-left] duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
                creditsOpen
                  ? "max-w-[200px] opacity-100 ml-2"
                  : "max-w-0 opacity-0 ml-0 md:group-hover:max-w-[300px] md:group-hover:opacity-100 md:group-hover:ml-3"
              }`}
            >
              x Aguss
            </span>

          </button>
      </div>

      {/* 4. GACETA GIGANTE (Contenedor ajustado) */}
      <div
        aria-hidden="true"
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
