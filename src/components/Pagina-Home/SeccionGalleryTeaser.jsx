import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SeccionGalleryTeaser({
  images = [],
  eyebrow = "GACETA",
  title = "Gallery",
  ctaText = "Visitar nuestra galería",
  ctaHref = "/gallery",
}) {
  const wrapRef = useRef(null);
  const stickyRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
  
      if (isMobile) {
        // --------- MOBILE ----------
        // ... tu código mobile ...
      } else {
        // --------- DESKTOP / TABLET ----------
        const desktopCards = gsap.utils.toArray("[data-teaser-desktop]");
        if (!desktopCards.length) return;
  
        gsap.set(desktopCards, { y: 120, opacity: 0, scale: 0.92 });
  
        gsap
          .timeline({
            scrollTrigger: {
              trigger: wrapRef.current,
              start: "10% 60%",
              end: "35% 40%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(
            desktopCards[0],
            {
              y: 0,
              x: -400,
              opacity: 1,
              rotate: -12,
              scale: 0.92,
              duration: 2,
              ease: "power3.out",
            },
            0
          )
          .to(
            desktopCards[1],
            {
              y: 0,
              x: 0,
              opacity: 1,
              rotate: 0,
              scale: 0.92,
              duration: 2,
              ease: "power3.out",
            },
            0.1
          )
          .to(
            desktopCards[2],
            {
              y: 0,
              x: 400,
              opacity: 1,
              rotate: 12,
              scale: 0.92,
              duration: 2,
              ease: "power3.out",
            },
            0.2
          );
      } // 👈 cierre del else
  
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }, wrapRef); // 👈 segundo parámetro de gsap.context
  
    return () => ctx.revert();
  }, []);
  

  // Fallback por si vienen menos de 3 imágenes
  const [left, center, right] = [
    images[0] || "/assets/gallery/placeholder-1.jpg",
    images[1] || "/assets/gallery/placeholder-2.jpg",
    images[2] || "/assets/gallery/placeholder-3.jpg",
  ];

  return (
    <section
      id="gallery-teaser"
      ref={wrapRef}
      className="relative w-full text-[#f5d7e2] overflow-hidden -mt-px bg-page"
    >
      <div className="relative h-[140vh] md:h-[170vh]">
        <div
          ref={stickyRef}
          className="sticky top-0 h-screen flex items-center justify-center mt-8"
        >
          <div className="relative w-full max-w-6xl mx-auto px-4 md:px-8">
            {/* ------------- IMÁGENES: MOBILE (slider en un marco) ------------- */}
            <div className="pointer-events-none absolute inset-0 mt-80 flex items-center justify-center z-0 md:hidden">
              <div className="relative max-w-[75vw] aspect-[3/2] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 bg-black/20">
                {[left, center, right].map((src, idx) => (
                  <img
                    key={idx}
                    data-teaser-mobile
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ))}
              </div>
            </div>

            {/* ------------- IMÁGENES: DESKTOP (abanico original) ------------- */}
            <div className="pointer-events-none absolute inset-0 mt-96 hidden md:flex items-center justify-center z-0">
              <img
                data-teaser-desktop
                src={left}
                alt=""
                className="absolute max-w-[30vw] rounded-2xl shadow-2xl object-cover
                           ring-1 ring-white/10 select-none opacity-0 translate-y-24"
                style={{ transformOrigin: "50% 80%", rotate: "-10deg" }}
              />
              <img
                data-teaser-desktop
                src={center}
                alt=""
                className="absolute max-w-[36vw] rounded-2xl shadow-2xl object-cover
                           ring-1 ring-white/10 select-none opacity-0 translate-y-24"
                style={{ transformOrigin: "50% 80%", rotate: "0deg" }}
              />
              <img
                data-teaser-desktop
                src={right}
                alt=""
                className="absolute max-w-[30vw] rounded-2xl shadow-2xl object-cover
                           ring-1 ring-white/10 select-none opacity-0 translate-y-24"
                style={{ transformOrigin: "50% 80%", rotate: "10deg" }}
              />
            </div>

            {/* ------------- TÍTULO + CTA ------------- */}
            <div className="relative z-10 text-center select-none">
              <span className="block font-serif italic text-2xl md:text-4xl text-[#dee5a0]/80">
                {eyebrow}
              </span>
              <h2
                className="mt-2 font-black leading-none text-[17vw] md:text-[10vw]
                           bg-gradient-to-t from-[#dee5a0] to-[#eaeec3] bg-clip-text text-transparent
                           drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
              >
                {title}
              </h2>

              <div className="mt-6 md:mt-8 flex items-center justify-center gap-4">
                <a
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-[#4e2940]
                             hover:bg-white/90 px-6 py-3 md:px-7 md:py-3.5 text-sm md:text-base font-semibold
                             transition-colors"
                >
                  {ctaText}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="opacity-80"
                  >
                    <path
                      fill="currentColor"
                      d="M13 5l7 7-7 7v-4H4v-6h9V5z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
