import React, { useRef } from "react";

export default function SeccionEquipos({
  areas = DEFAULT_AREAS,
  titulo = "Áreas de Gaceta",
  claseSeccion = ""
}) {
  const sectionRef = useRef(null);
  const [expanded, setExpanded] = React.useState({}); // estado por-card para mobile

  // ===== Tilt + Parallax (sin libs) =====
  const handleTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width; // 0..1
    const py = y / rect.height; // 0..1
    const rx = (py - 0.5) * -3; // rot X (suave)
    const ry = (px - 0.5) * 6;  // rot Y (un toque más)
    const tx = (px - 0.5) * 6;  // translate X parallax (px)
    const ty = (py - 0.5) * 6;  // translate Y parallax (px)
    card.style.setProperty("--rx", `${rx}deg`);
    card.style.setProperty("--ry", `${ry}deg`);
    card.style.setProperty("--tx", `${tx}px`);
    card.style.setProperty("--ty", `${ty}px`);
    card.style.setProperty("--shine-x", `${px * 100}%`); // brillo
  };
  const resetTilt = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rx", `0deg`);
    card.style.setProperty("--ry", `0deg`);
    card.style.setProperty("--tx", `0px`);
    card.style.setProperty("--ty", `0px`);
    card.style.setProperty("--shine-x", `-40%`);
  };

  // ===== Stagger on view =====
  React.useEffect(() => {
    if (!sectionRef.current) return;
    const cards = Array.from(sectionRef.current.querySelectorAll('[data-card]'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
    );
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ===== Ripple en pointer down =====
  const handlePointerDown = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'gaceta-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const toggleExpand = (idx) => setExpanded((s) => ({ ...s, [idx]: !s[idx] }));

  return (
    <section
      ref={sectionRef}
      className={`relative py-16 md:py-24 ${claseSeccion}`}
      aria-label={titulo}
    >
      {/* título */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">
            {titulo}
          </h2>
        </div>

        {/* grid de cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {areas.map((a, i) => {
            const isOpen = !!expanded[i];
            return (
            <article
              key={a.id ?? i}
              data-card
              tabIndex={0}
              className="group relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition-transform will-change-transform outline-none focus:ring-2 focus:ring-white/40 min-h-[360px] md:min-h-[420px]"
              style={{
                transform: "perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0)) translate3d(var(--tx,0), var(--ty,0), 0)",
                transformStyle: "preserve-3d"
              }}
              onMouseMove={handleTilt}
              onMouseLeave={resetTilt}
              onPointerDown={handlePointerDown}
            >
              {/* imagen base (capa 1) */}
              <img
                src={a.imagen}
                alt={a.titulo}
                className="absolute inset-0 h-full w-full rounded-3xl object-cover object-center grayscale opacity-80 transition-all duration-500 group-hover:scale-[1.06] group-hover:grayscale-0 group-hover:opacity-100"
                style={{ transform: "translateZ(0)" }}
              />

              {/* capa textura/parallax (capa 2) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-3xl mix-blend-overlay opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                style={{
                  backgroundImage:
                    "radial-gradient(1200px_200px_at_var(--shine-x,-40%)_-20%, rgba(255,255,255,0.35), transparent 40%), url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><defs><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'1\'/><feColorMatrix type=\'saturate\' values=\'0\'/></filter></defs><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\' opacity=\'0.2\'/></svg>')",
                  backgroundRepeat: 'no-repeat, repeat',
                  backgroundSize: 'auto, 160px 160px',
                  transform: 'translate3d(calc(var(--tx,0) * 0.6), calc(var(--ty,0) * 0.6), 0)'
                }}
              />

              {/* overlay gradiente */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />

              {/* borde glow al hover */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10 group-hover:ring-white/30" />
              <div className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{
                     background: "radial-gradient(600px 60px at 50% 110%, rgba(255,255,255,0.18), transparent 60%)"
                   }}
              />

              {/* contenido */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold drop-shadow-md text-white">
                  {a.titulo}
                </h3>
                <div className="mt-2 h-px w-12 origin-left scale-x-50 bg-white/40 transition-transform duration-500 group-hover:scale-x-100" />

                {/* descripción expandible */}
                <p className={`mt-3 overflow-hidden text-sm text-white/80 transition-[max-height] duration-500 ease-out ${isOpen ? 'max-h-48' : 'max-h-0 md:group-hover:max-h-48'}`}>
                  {a.descripcion}
                </p>

                {/* CTA sutil (visible si hover o si está expandido en mobile) */}
                <div className={`mt-3 flex items-center gap-2 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                  <svg aria-hidden className="h-4 w-4 translate-x-0 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Botón Expandir (solo mobile) */}
                <div className="mt-3 md:hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(i)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[12px] uppercase tracking-wide ring-1 ring-white/20 backdrop-blur-sm active:scale-[0.98]"
                  >
                    <span>{isOpen ? "Cerrar" : "Expandir"}</span>
                    <svg
                      aria-hidden
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>

              </div>

              {/* Shine animado (fallback animación cuando no hay mousemove) */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100">
                <div className="absolute -inset-[20%] animate-[gacetaShine_1.6s_ease-in-out]" />
              </div>
            </article>
          );})}
        </div>
      </div>

      {/* estilos locales para ripple + shineline + reveal */}
      <style jsx>{`
        .gaceta-ripple {
          position: absolute;
          width: 12px; height: 12px;
          margin-left: -6px; margin-top: -6px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.35);
          box-shadow: 0 0 0 0 rgba(255,255,255,0.35);
          animation: gacetaRipple 0.6s ease-out forwards;
          pointer-events: none;
        }
        @keyframes gacetaRipple {
          to { transform: scale(18); opacity: 0; box-shadow: 0 0 0 24px rgba(255,255,255,0.0); }
        }
        @keyframes gacetaShine {
          0% { background: radial-gradient(1200px 200px at -40% -20%, rgba(255,255,255,0.25), transparent 40%); }
          100% { background: radial-gradient(1200px 200px at 140% 120%, rgba(255,255,255,0.0), transparent 40%); }
        }
        [data-card] { opacity: 0; transform: translateY(12px) scale(0.98); transition: opacity .5s ease, transform .6s cubic-bezier(.2,.8,.2,1); }
        [data-card].is-visible { opacity: 1; transform: none; }
      `}</style>
    </section>
  );
}

const DEFAULT_AREAS = [
  {
    titulo: "Gaceta Audiovisual",
    descripcion:
      "GAV es el brazo audiovisual de Gaceta, especializado en la cobertura de shows en vivo, producción de videoclips, contenidos visuales y piezas creativas que acompañan a cada proyecto. Con un enfoque que une narrativa y estética, GAV busca transformar cada lanzamiento en una experiencia visual que potencie la identidad del artista.",
    imagen:
      "assets/equipoGAV.JPG"
  },
  {
    titulo: "Gaceta Marketing",
    descripcion:
      "GAM es el área de marketing de Gaceta, dedicada a potenciar el alcance de artistas y marcas a través de estrategias digitales, campañas de lanzamiento, contenido original y gestión de nuestra comunidad. Conectamos proyectos con su público, generando pertenencia.",
    imagen: 
      "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=2000&auto=format&fit=crop"
  },
  {
    titulo: "Piece Of Music",
    descripcion:
      "El proyecto Piece Of Music (POM) es una innovadora iniciativa generada desde la alianza estratégica de Indutop y Gaceta. Su objetivo es potenciar la industria musical uruguaya, con un enfoque especial en el impulso de la música urbana  y la creación de un espacio vibrante para el encuentro y desarrollo de talento femenino emergente.",
    imagen:
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=2000&auto=format&fit=crop"
  }
];

/**
 * Notas de integración:
 * - Las imágenes de DEFAULT_AREAS son placeholders (Unsplash). Reemplazalas por contenido de Gaceta.
 * - La expansión es 100% CSS (max-height) para mantenerlo liviano, y el tilt usa CSS vars sin dependencias.
 * - Si querés que las cards se "asomen" al scrollear desde el timeline, podés envolver el <article> con
 *   una clase de Tailwind animada (ej: motion-safe:animate-[fade-up_0.6s_ease_0.1s_both]) o agregar un IntersectionObserver.
 * - El layout es responsive: 1 col (mobile), 2 (sm), 3 (lg). Ajustá cortes según tu diseño.
 */
