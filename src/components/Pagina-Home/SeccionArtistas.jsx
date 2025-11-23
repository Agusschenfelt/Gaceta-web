import { useLayoutEffect, useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ArtistCardHover from "./ArtistCardHover";

gsap.registerPlugin(ScrollTrigger);

const ARTISTAS = [
  {
    slug: "ramma",
    nombre: "Ramma",
    rol: "Cantante",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ramma.webm",
  },
  {
    slug: "valuto",
    nombre: "Valuto",
    rol: "Productor",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/valuto-video.webm",
  },
  {
    slug: "ara",
    nombre: "ARA",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
  {
    slug: "tadu_vazquez",
    nombre: "Tadu Vazquez",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
  {
    slug: "fosse",
    nombre: "Fosse",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
  {
    slug: "barta",
    nombre: "Barta",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
  {
    slug: "dazen",
    nombre: "Dazen",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
  {
    slug: "lonzo",
    nombre: "Lonzo",
    rol: "Artista Gaceta",
    imgSrc: "/assets/ramma-perfil.jpg",
    videoSrc: "/assets/ara-saltando.mov",
  },
];

// Fila con marquee infinito + scroll horizontal manual
function Rail({ items, dir = 1, speed = 40 }) {
  const railRef = useRef(null);
  const trackRef = useRef(null);

  // Calcular duración de la animación según ancho
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const halfWidth = track.scrollWidth / 2; // porque duplicamos la lista
      const dur = Math.max(10, halfWidth / speed); // segundos
      track.style.setProperty("--marquee-dur", `${dur}s`);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);

    return () => ro.disconnect();
  }, [speed]);

  // Redirigir scroll vertical a la página
  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
    }
    // si hay deltaX, dejamos que haga scroll horizontal del carrusel
  };

  return (
    <div
      ref={railRef}
      onWheel={handleWheel}
      className="
        group relative
        overflow-x-auto overflow-y-hidden
        no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]
        [webkit-overflow-scrolling:touch]
        px-1 sm:px-1.5 md:px-2
        [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]
      "
    >
      <div
        ref={trackRef}
        className="
          flex gap-2 sm:gap-3 md:gap-4
          will-change-transform
          [animation:marqueeX_var(--marquee-dur)_linear_infinite]
          group-hover:[animation-play-state:paused]
        "
        style={{
          animationDirection: dir < 0 ? "reverse" : "normal",
        }}
      >
        {items.map((a, i) => (
          <ArtistCardHover key={`R1-${i}-${a.slug}`} {...a} />
        ))}
        {items.map((a, i) => (
          <ArtistCardHover key={`R2-${i}-${a.slug}`} {...a} />
        ))}
      </div>
    </div>
  );
}

export default function SeccionArtistas({ rows = 2 }) {
  const sectionRef = useRef(null);

  const [rowA, rowB] = useMemo(() => {
    const A = [];
    const B = [];
    ARTISTAS.forEach((a, i) => (i % 2 === 0 ? A : B).push(a));
    return [A, B];
  }, []);

  // Fade-in de las cards
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const cards = section.querySelectorAll("[data-artist-card]");
      gsap.set(cards, { opacity: 0, y: 24, willChange: "transform,opacity" });

      gsap.to(cards, {
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          once: true,
        },
        opacity: 1,
        y: 0,
        ease: "power3.out",
        duration: 0.55,
        stagger: { each: 0.06, from: "random" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Refresh ScrollTrigger por las medidas dinámicas
  useEffect(() => {
    requestAnimationFrame(() => {
      try {
        ScrollTrigger.refresh();
      } catch {}
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="artistas"
      className="relative px-5 md:px-10 lg:px-16 xl:px-24 pt-10 md:pt-12 pb-20 md:pb-24 -mt-4 md:-mt-6 [content-visibility:auto]"
    >
      {/* keyframes para el marquee */}
      <style>{`
        @keyframes marqueeX {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto relative">
        <Rail items={rowA} dir={1} speed={65} />
        {rows > 1 && (
          <>
            <div className="h-5 md:h-4" />
            <Rail items={rowB} dir={-1} speed={60} />
          </>
        )}
      </div>
    </section>
  );
}
