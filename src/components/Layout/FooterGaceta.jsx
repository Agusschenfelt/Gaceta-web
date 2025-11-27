import { useEffect, useRef, useState } from "react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";

// Componente de Letras Saltarinas
function AnimatedWord({ word, lift = "14vh", className = "" }) {
  return (
    <div className={`flex gap-[0.02em] pointer-events-auto ${className}`}>
      {word.split("").map((ch, i) => (
        <span
          key={i}
          className="inline-block will-change-transform transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[var(--lift)] cursor-default"
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
  const [showBig, setShowBig] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setShowBig(true);
      },
      { root: null, threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
          
          {/* Navegación */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/40">Explorar</h3>
            <nav className="flex flex-col gap-3">
              {['Sobre Nosotros', 'Artistas', 'Contacto', 'Términos y Privacidad'].map((item) => (
                <a key={item} href="#" className="group relative w-fit text-lg font-light text-white/80 hover:text-white transition-colors">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#dee5a0] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
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
                {[FaInstagram, FaTwitter, FaTiktok, FaYoutube].map((Icon, i) => (
                    <a key={i} href="#" className="hover:text-white hover:scale-110 transition-all duration-300">
                        <Icon />
                    </a>
                ))}
            </div>

          </div>
        </div>
      </div>

      {/* 3. FOOTER BOTTOM (Créditos + Made By) */}
      <div className="relative z-20 max-w-[1400px] mx-auto px-6 md:px-10 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30 uppercase tracking-widest font-mono">
          <div className="flex gap-6">
            <p>© 2025 Gaceta Music.</p>
            <p className="hidden sm:block">All rights reserved.</p>
          </div>
          
          {/* AGREGADO: Made By */}
          <p className="hover:text-white/60 transition-colors cursor-default">
            Made by Gaceta
          </p>
      </div>

      {/* 4. GACETA GIGANTE (Fondo Fantasma) */}
      <div
        aria-hidden
        className={`
          absolute left-0 right-0 bottom-[-2vw] z-10
          flex justify-center pointer-events-auto select-none
          transition-opacity duration-1000 ease-out
          ${showBig ? "opacity-100" : "opacity-0"}
        `}
      >
        <AnimatedWord
          word="GACETA"
          lift="20vh"
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