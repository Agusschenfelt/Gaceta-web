// FooterGaceta.jsx
import { useEffect, useRef, useState } from "react";
import { FaInstagram, FaTwitter, FaTiktok, FaYoutube } from "react-icons/fa";

function AnimatedWord({ word, lift = "14vh", className = "" }) {
  return (
    <div className={`flex gap-[0.02em] pointer-events-auto ${className}`}>
      {word.split("").map((ch, i) => (
        <span
          key={i}
          className="inline-block will-change-transform transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[var(--lift)]"
          style={{ ["--lift"]: lift }}
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
      className="
        relative bg-neutral-950 text-white overflow-hidden
        pt-10 pb-32 md:pt-12 md:pb-28
      "
    >
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(80%_60%_at_50%_85%,rgba(255,255,255,0.12),rgba(255,255,255,0.06)_40%,transparent_80%)]" />

      {/* Línea arriba */}
      <div className="hidden md:block relative z-20 border-t border-white/10" />

      {/* Cuerpo */}
      <div
        className="
          relative z-20 max-w-6xl mx-auto w-full
          px-6 pt-10 md:pt-12
          grid gap-10
          md:grid-cols-12
        "
      >
        {/* Izquierda: frase grande */}
        <div className="md:col-span-6 lg:col-span-7 self-start text-left">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light leading-tight font-inter text-white/90">
            {/* siempre legible, sin trucos raros */}
            Creando experiencias
            <br />
            <span className="cursiva">únicas</span>
          </h2>
        </div>

        {/* Derecha: enlaces / contacto / redes */}
        <div
          className="
            md:col-span-6 lg:col-span-5 self-start
            md:border-l md:border-white/10 md:pl-8
          "
        >
          <div
            className="
              grid gap-8
              md:grid-rows-[auto_auto_auto_1fr_auto]
              text-left md:text-right
              justify-items-start md:justify-items-end
              h-full
            "
          >
            {/* Enlaces */}
            <nav className="w-full">
              <h3 className="text-sm font-semibold mb-2">Enlaces</h3>
              <ul className="space-y-2 text-[0.95rem]">
                <li>
                  <a className="hover:underline" href="/sobre-nosotros">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/contacto">
                    Contacto
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="/terminos">
                    Términos y privacidad
                  </a>
                </li>
              </ul>
            </nav>

            {/* Contacto */}
            <address className="not-italic w-full">
              <h3 className="text-sm font-semibold mb-2">Contacto</h3>
              <div className="text-[0.95rem]">
                  Buenos Aires, AR
                <br />
                  Montevideo, UY <br />
                <a className="hover:underline" href="mailto:contacto@gacetaplay.com">
                  contacto@gacetaplay.com
                </a>
                <br />
              </div>
            </address>

            {/* Seguinos */}
            <div className="w-full">
              <h3 className="text-sm font-semibold mb-2">Seguinos</h3>
              <div className="flex justify-start md:justify-end items-center gap-4 text-xl">
                <a
                  href="https://www.instagram.com/gacetaplay/"
                  target="_blank"
                  aria-label="Instagram"
                  className="hover:scale-110 transition"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://x.com/gacetaplay"
                  target="_blank"
                  aria-label="Twitter"
                  className="hover:scale-110 transition"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://www.tiktok.com/@gaceta.play"
                  target="_blank"
                  aria-label="TikTok"
                  className="hover:scale-110 transition"
                >
                  <FaTiktok />
                </a>
                <a
                  href="https://www.youtube.com/@gacetaplay"
                  target="_blank"
                  aria-label="YouTube"
                  className="hover:scale-110 transition"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>

            {/* Espaciador desktop */}
            <div className="hidden md:block" />

            {/* Créditos */}
            <div className="text-xs uppercase tracking-wider text-white/50 flex-col flex gap-1">
              <div className="font-semibold">@GACETA2025</div>
              <div className="opacity-70">Made by gaceta</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIGANTE GACETA */}
      <div
        aria-hidden
        className={`
          absolute inset-x-0 bottom-[-3.5rem] md:bottom-[-5rem] z-30
          flex justify-center px-4
          transition-all duration-700 ease-out will-change-transform
          ${showBig ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        <AnimatedWord
          word="GACETA"
          lift="12vh"
          className="
            uppercase font-black tracking-[-0.03em]
            text-[32vw] md:text-[20vw] lg:text-[18vw]
            leading-[0.8] opacity-[0.07]
          "
        />
      </div>
    </footer>
  );
}
