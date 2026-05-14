import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import TransitionLink from "../TransitionLink";

// Derives srcset entries for a given extension from a webp URL like "/media/img/foo-840.webp"
function buildSrcSet(webpUrl, ext) {
  const match = webpUrl.match(/^(.*)-\d+\.webp$/);
  if (!match) return undefined;
  const base = match[1];
  return [320, 560, 840].map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");
}

function TeaserImage({ src, alt }) {
  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet(src, "avif")} sizes="(max-width: 639px) 44vw, (max-width: 1023px) 280px, 340px" />
      <source type="image/webp" srcSet={buildSrcSet(src, "webp")} sizes="(max-width: 639px) 44vw, (max-width: 1023px) 280px, 340px" />
      <img src={src} alt={alt} width="320" height="427" loading="lazy" decoding="async" className="w-full h-full object-cover" />
    </picture>
  );
}

export default function SeccionGalleryTeaser({
  images = [],
  eyebrow = "",
  title = "GALLERY",
  ctaText = "VISITAR GALERÍA",
  ctaHref = "/gallery",
}) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const btnRef = useRef(null);

  const displayImages = [
    images[0] || "/media/img/_woc7020-840.webp",
    images[1] || "/media/img/pyketoph-6-840.webp",
    images[2] || "/media/img/_woc5860-840.webp",
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      const buildAnim = (xOffset, rot) => {
        const [left, center, right] = cardsRef.current;
        gsap.set([left, center, right], { y: 300, opacity: 0, scale: 0.8, rotation: 0, x: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 90%",
            scrub: 1,
          }
        });

        tl.fromTo(titleRef.current, { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0);
        tl.to(left,   { y: 40, x: -xOffset, rotation: -rot, opacity: 1, scale: 0.9,  duration: 1.5, ease: "power2.out" }, 0.1);
        tl.to(right,  { y: 40, x: xOffset,  rotation:  rot, opacity: 1, scale: 0.9,  duration: 1.5, ease: "power2.out" }, 0.1);
        tl.to(center, { y: 0,  x: 0,        rotation: 0,    opacity: 1, scale: 1.15, zIndex: 10, duration: 1.5, ease: "power2.out" }, 0.1);
        tl.fromTo(btnRef.current, { scale: 0.8, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.2);
      };

      mm.add("(max-width: 639px)",                         () => buildAnim(80,  5));
      mm.add("(min-width: 640px) and (max-width: 1023px)", () => buildAnim(160, 8));
      mm.add("(min-width: 1024px)",                        () => buildAnim(280, 12));
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[90svh] bg-transparent overflow-hidden flex flex-col items-center justify-center pb-32 pt-48 -mt-24 z-30"
    >
      {/* Fondo — gradiente emergente, no caja sólida */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-b from-transparent via-fondo/80 to-fondo" />

      {/* Fade de salida hacia CTASobreNosotros */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-fondo to-transparent pointer-events-none z-20" />

      {/* Texturas */}
      <div aria-hidden="true" className="noise-texture absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay -z-10" />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.3)_100%)] -z-10" />

      {/* Heading accesible para screen readers */}
      <h2 className="sr-only">Galería GACETA</h2>

      {/* EYEBROW */}
      {eyebrow && (
        <span className="relative z-30 block text-[10px] font-mono uppercase tracking-[0.3em] text-secundario/70 mb-6 text-center">
          {eyebrow}
        </span>
      )}

      {/* TÍTULO GIGANTE DE FONDO */}
      <h2
        ref={titleRef}
        aria-hidden="true"
        className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[24vw] font-black leading-none whitespace-nowrap pointer-events-none select-none z-0 tracking-tighter text-white/[0.15]"
      >
        {title}
      </h2>

      {/* Cartas */}
      <div className="relative w-full max-w-5xl h-[clamp(300px,70vh,550px)] flex items-center justify-center z-20 perspective-[1000px] mb-10">
          <div ref={el => cardsRef.current[0] = el} className="absolute w-[clamp(180px,40vw,280px)] md:w-[260px] lg:w-[320px] aspect-[3/4] rounded-xl shadow-2xl border-[8px] border-white/90 overflow-hidden origin-bottom-right bg-black">
              <TeaserImage src={displayImages[0]} alt="Foto de la galería GACETA 1" />
              <div className="absolute inset-0 bg-black/10" />
          </div>
          <div ref={el => cardsRef.current[2] = el} className="absolute w-[clamp(180px,40vw,280px)] md:w-[260px] lg:w-[320px] aspect-[3/4] rounded-xl shadow-2xl border-[8px] border-white/90 overflow-hidden origin-bottom-left bg-black">
              <TeaserImage src={displayImages[2]} alt="Foto de la galería GACETA 3" />
              <div className="absolute inset-0 bg-black/10" />
          </div>
          <div ref={el => cardsRef.current[1] = el} className="absolute w-[clamp(200px,44vw,300px)] md:w-[280px] lg:w-[340px] aspect-[3/4] rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.4)] border-[8px] border-white overflow-hidden z-20 bg-black">
              <TeaserImage src={displayImages[1]} alt="Foto de la galería GACETA 2" />
          </div>
      </div>

      {/* CTA — EDITORIAL FULL-WIDTH STRIP */}
      <div ref={btnRef} className="relative z-30 w-full max-w-4xl px-6 md:px-10 mt-8">
        <TransitionLink
          to={ctaHref}
          className="group flex items-center justify-between w-full py-5 md:py-6 border-t-2 border-b-2 border-white/25 hover:border-secundario transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-4 focus-visible:ring-offset-fondo"
        >
          <span className="font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tighter text-white group-hover:text-secundario transition-colors duration-300">
            {ctaText}
          </span>
          <div className="flex items-center gap-3 text-white/50 group-hover:text-secundario transition-colors duration-300 shrink-0">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase hidden sm:block">Archivo visual</span>
            <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </TransitionLink>
      </div>

    </section>
  );
}