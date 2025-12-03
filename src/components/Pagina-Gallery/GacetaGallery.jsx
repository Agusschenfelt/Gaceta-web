import React, { useState, useCallback, useLayoutEffect, useMemo, useRef, Suspense, lazy } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// IMPORTACIÓN LAZY DEL LIGHTBOX
const FocusLightbox = lazy(() => import("./FocusLightbox"));

const clsx = (...xs) => xs.filter(Boolean).join(" ");

/* =========================
   SmartImage para Grid
   ========================= */
function SmartImage({
  base,
  src,
  alt = "",
  className = "",
  sizes = "(max-width: 768px) 88vw, (max-width: 1280px) 34vw, 24vw",
  fallbackSrc,
  fetchPriority = "auto",
  loading = "lazy",
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  const handleError = useCallback(() => {
    if (!imgRef.current) return;
    if (fallbackSrc && imgRef.current.src !== fallbackSrc) {
      imgRef.current.src = fallbackSrc;
    }
  }, [fallbackSrc]);

  const buildSrcSet = (ext) =>
    base 
      ? [320, 560, 840, 1120, 1440].map((w) => `/media/img/${base}-${w}.${ext} ${w}w`).join(", ")
      : undefined;

  const mainSrc = base ? `/media/img/${base}-dl.jpg` : (src || fallbackSrc);

  return (
    <div className={clsx("relative overflow-hidden bg-[#111]", className)}>
      <div 
        className={clsx(
          "absolute inset-0 bg-white/5 transition-opacity duration-700",
          loaded ? "opacity-0" : "opacity-100"
        )} 
      />
      <picture>
        {base && (
          <>
            <source type="image/avif" srcSet={buildSrcSet("avif")} sizes={sizes} />
            <source type="image/webp" srcSet={buildSrcSet("webp")} sizes={sizes} />
          </>
        )}
        <img
          ref={imgRef}
          src={mainSrc}
          alt={alt}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={clsx(
            "block w-full h-full object-cover transition-all duration-700 ease-out will-change-transform",
            loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
          )}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      </picture>
    </div>
  );
}

/* =========================
   Media Card (Grid Item)
   ========================= */
function MediaCard({
  item,
  i,
  onOpen,
  span = 4,
  side = "center",
  cardMaxClass = "",
  zClass = "z-[10]",
  cardHClass = "max-h-[46vh]",
  rowSpanClass = "",
  randomOffset = "",
  priority = false,
}) {
  const mediaRef = useRef(null);

  const SPAN = {
    1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
    5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
    9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
  };
  const spanCls = SPAN[span] || "md:col-span-3";
  const sideCls = side === "left" ? "justify-start" : side === "right" ? "justify-end" : "justify-center";

  return (
    <div className={clsx("relative col-span-12 gallery-img", spanCls, rowSpanClass, zClass, randomOffset)} data-card>
      <div className={clsx("flex", sideCls)}>
        <button 
          onClick={() => onOpen(i)} 
          className="relative group block z-0 w-full outline-none"
          aria-label={`Ver imagen ${i + 1}`}
        >
          <div
            className={clsx(
              "card-inner",
              // ESTILO CARDS
              "relative rounded-sm overflow-hidden border border-white/5 bg-[#0a0a0a]", 
              "transform transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
              "group-hover:scale-[1.02] group-hover:border-[#911e1e]/50 group-hover:shadow-[0_20px_40px_-10px_rgba(145,30,30,0.15)]",
              "w-full mx-auto inline-block",
              cardMaxClass,
              "flex items-center justify-center",
              cardHClass,
              "origin-top will-change-[transform,opacity]"
            )}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 z-20 pointer-events-none mix-blend-overlay" />

            {item.type === "video" ? (
              <video
                data-gridvideo
                ref={mediaRef}
                preload="none"
                playsInline
                muted
                loop
                poster={item.poster}
                className="block w-full h-full object-cover mx-auto opacity-90"
                onEnded={(e) => {
                  try { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); } catch {}
                }}
              >
                {item.srcWebm && <source src={item.srcWebm} type="video/webm" />}
                <source src={item.srcMp4 || item.src} type="video/mp4" />
              </video>
            ) : (
              <SmartImage
                base={item.base}
                src={item.src}
                fallbackSrc={item.src}
                alt={item.alt || `Galería Gaceta ${i}`}
                className="block w-full h-full object-cover mx-auto"
                fetchPriority={priority ? "high" : "auto"}
                loading={priority ? "eager" : "lazy"}
              />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

/* =========================
   Componente Principal
   ========================= */

export default function GacetaGallery({
  title = "GALLERY",
  items = [],
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const openAt = useCallback((i) => { setIndex(i); setOpen(true); }, []);

  const galleryRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);

  useLayoutEffect(() => {
    if (!galleryRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.getAll().forEach((st) => st.kill());

      // 1. TÍTULO WATERMARK
      if (titleRef.current) {
        gsap.to(titleRef.current, {
           opacity: 0.05,  
           scale: 0.95,  
           yPercent: 0,  
           ease: "power1.inOut",
           scrollTrigger: {
             trigger: galleryRef.current,
             start: "top top",
             end: "bottom bottom",
             scrub: true
           }
        });
      }

      // 2. EFECTO CARDS (CORREGIDO: Parallax sutil sin desaparecer)
      const cards = gsap.utils.toArray("[data-card]");
      cards.forEach((el) => {
        const inner = el.querySelector(".card-inner");
        if (!inner) return;

        // Estado inicial limpio
        gsap.set(inner, { y: 0, scale: 1, opacity: 1 });

        // Animación continua durante el scroll
        gsap.to(inner, {
          y: -30,         // Se mueve ligeramente hacia arriba (flota)
          scale: 0.98,    // Se aleja un poco para dar profundidad
          // opacity: 1,  // Mantenemos la opacidad al 100%
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom", // Empieza cuando entra por abajo
            end: "bottom top",   // Termina cuando sale por arriba
            scrub: 0.5,          // Suavizado para sensación de peso
          }
        });
      });

      // 3. VIDEOS AUTOPLAY
      const vids = gsap.utils.toArray("video[data-gridvideo]");
      vids.forEach((vid) => {
        vid.muted = true; vid.playsInline = true; vid.loop = true;
        vid.setAttribute("muted", ""); vid.setAttribute("playsinline", "");
        try { vid.pause(); } catch {}

        ScrollTrigger.create({
          trigger: vid.closest("[data-card]") || vid,
          start: "top 90%",
          end: "bottom 10%",
          onEnter: () => vid.play().catch(() => {}),
          onEnterBack: () => vid.play().catch(() => {}),
          onLeave: () => { try { vid.pause(); } catch {} },
          onLeaveBack: () => { try { vid.pause(); } catch {} },
        });
      });

    }, galleryRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [items]);

  const gridLayout = useMemo(() => items.map((_, i) => ({
      span: [5, 5, 5, 6, 5, 5, 6, 5, 5][i % 9],
      side: ["left", "center", "right", "left", "right", "center", "right", "left", "center"][i % 9],
  })), [items]);

  return (
    // min-h-[100svh] para estabilidad en móviles
    <section ref={galleryRef} className="relative w-full min-h-[100svh] bg-[#0a0a0a] text-white overflow-hidden">
      
      {/* 1. LUZ ROJA SUTIL */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-[radial-gradient(circle_at_center,rgba(145,30,30,0.12)_0%,transparent_60%)] pointer-events-none z-0" />
      
      {/* 2. VIÑETA OSCURA */}
      <div className="fixed inset-0 pointer-events-none z-[5] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_90%)]" />

      {/* HEADER TÍTULO */}
      <div
        ref={titleRef}
        className={clsx(
          "fixed inset-0 grid place-items-center z-[0] pointer-events-none opacity-20"
        )}
      >
        <h2 className="select-none text-center leading-none">
          <span className="block font-serif italic text-2xl md:text-5xl text-[#dee5a0]/50 mb-4 md:mb-6">GACETA</span>
          <span className="block font-black text-[18vw] md:text-[15vw] text-[#dee5a0]/30 tracking-tight">
            {title}
          </span>
        </h2>
      </div>

      {/* GRID */}
      <div
        ref={gridRef}
        className={clsx(
          "relative mx-auto max-w-[1800px] 2xl:max-w-[2400px] px-4 md:px-10 z-[10]",
          open ? "invisible" : "mt-[35vh] md:mt-[45vh]"
        )}
        aria-hidden={open}
      >
        <div className="grid grid-cols-12 grid-flow-dense auto-rows-auto gap-y-[8vh] gap-x-4 md:gap-y-[12vh] md:gap-x-16 pb-[20vh]">
          {items.map((item, i) => {
            const above = i % 2 === 0 || i % 3 === 0;
            const zClass = above ? "z-[30]" : "z-[10]";
            const randomOffset = i % 2 === 0 ? "md:-translate-y-8" : "md:translate-y-8";
            const isPriority = i < 4; 

            return (
              <MediaCard
                key={item.id ?? i}
                item={item}
                i={i}
                onOpen={openAt}
                span={Math.min(12, Math.max(1, gridLayout[i].span))}
                side={gridLayout[i].side}
                cardMaxClass="max-w-[85vw] md:max-w-[min(24vw,420px)]"
                cardHClass="max-h-[50vh] md:max-h-[45vh]" 
                zClass={zClass}
                randomOffset={randomOffset}
                priority={isPriority} 
              />
            );
          })}
        </div>
      </div>

      {/* LIGHTBOX */}
      {open && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center text-white">Cargando...</div>}>
          <FocusLightbox
            open={open}
            index={index}
            items={items}
            onClose={() => setOpen(false)}
            setIndex={setIndex}
          />
        </Suspense>
      )}
    </section>
  );
}