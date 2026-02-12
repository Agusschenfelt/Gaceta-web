import React, { useState, useCallback, useLayoutEffect, useMemo, useRef, Suspense, lazy, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// IMPORTACIÓN STATIC PARA ESTABILIDAD
import FocusLightbox from "./FocusLightbox";

const clsx = (...xs) => xs.filter(Boolean).join(" ");

// --- UTILS: Seeded Random ---
// Simple linear congruential generator for reproducible "randomness"
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Generate style/layout props for an item based on seed + index
function generateRandomStyle(i, seed) {
    const r1 = seededRandom(seed + i * 10);
    const r2 = seededRandom(seed + i * 20);
    const r3 = seededRandom(seed + i * 30);
    const r4 = seededRandom(seed + i * 40);

    // Random Span: Mostly 3, 4, 5, rarely 6
    const possibleSpans = [3, 4, 5, 3, 4, 6]; 
    const span = possibleSpans[Math.floor(r1 * possibleSpans.length)];

    // Random Alignment: Left, Center, Right with slight bias
    // 0-0.3: start, 0.3-0.7: center, 0.7-1: end
    const side = r2 < 0.35 ? "justify-start" : r2 < 0.65 ? "justify-center" : "justify-end";

    // Random Offsets (Margins) to break the grid
    // marginTop: -4vh to 4vh (overlap vertically)
    // marginLeft: 0 to 20% (shift horizontally inside the col) or negative
    const marginTop = `${(r3 - 0.5) * 8}vh`; // Range +/- 4vh
    const translateX = `${(r4 - 0.5) * 4}vw`; // Range +/- 2vw

    // Random Rotation: -3deg to 3deg
    const rotate = (r1 - 0.5) * 4;

    return { span, side, style: { marginTop, transform: `translateX(${translateX}) rotate(${rotate}deg)` } };
}


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
  sideClass = "justify-center",
  customStyle = {},
  zClass = "z-[10]",
  cardMaxClass = "",
  cardHClass = "max-h-[46vh]",
  priority = false, // Keep lazy loading logic
}) {
  const mediaRef = useRef(null);

  const SPAN = {
    1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
    5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
    9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
  };
  const spanCls = SPAN[span] || "md:col-span-3";

  return (
    <div 
        className={clsx("relative col-span-12 gallery-img transition-all duration-500", spanCls, zClass)} 
        style={customStyle} // Apply random margins/offsets here
        data-card
    >
      <div className={clsx("flex w-full", sideClass)}>
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
              // HOVER: Lift up + Glow + Rotate slightly opposite to random rotation? No, resets rotation to 0 maybe?
              "group-hover:scale-[1.05] group-hover:rotate-0 group-hover:z-[50] group-hover:border-[#dee5a0]/40 group-hover:shadow-[0_20px_50px_-10px_rgba(222,229,160,0.15)]",
              "w-full mx-auto inline-block",
              "flex items-center justify-center",
              cardMaxClass,
              cardHClass,
              "origin-center will-change-[transform,opacity]"
            )}
          >
            {/* Overlay shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none" />

            {item.type === "video" ? (
              <video
                data-gridvideo
                ref={mediaRef}
                preload="none"
                playsInline
                muted
                loop
                poster={item.poster}
                className="block w-full h-full object-cover mx-auto opacity-90 group-hover:opacity-100 transition-opacity"
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
  seed = 20251011,
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const openAt = useCallback((i) => { setIndex(i); setOpen(true); }, []);

  const galleryRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);

  // Progressive Loading State
  const [visibleCount, setVisibleCount] = useState(12); // Initial chunk to ensure fast transition

  // Generamos el layout deterministicamente una sola vez
  const layout = useMemo(() => {
    return items.map((_, i) => generateRandomStyle(i, seed));
  }, [items, seed]);

  // Infinite Scroll Observer
  useEffect(() => {
    const trigger = document.createElement("div");
    trigger.id = "gallery-loader-trigger";
    trigger.style.height = "10px";
    trigger.style.width = "100%";
    
    if (gridRef.current) {
        gridRef.current.appendChild(trigger);
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + 12, items.length));
        }
    }, { rootMargin: "400px" });

    if (trigger) observer.observe(trigger);

    return () => observer.disconnect();
  }, [items.length]);

  /* 
    GSAP ANIMATIONS REMOVED BY USER REQUEST
    The gallery is now static for maximum stability.
  */
  // useLayoutEffect(() => { ... gsap logic removed ... }, []);

  // Slice items for rendering
  const visibleItems = items.slice(0, visibleCount);

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
        <div className="grid grid-cols-12 grid-flow-dense auto-rows-auto gap-y-[10vh] gap-x-4 md:gap-y-[12vh] md:gap-x-12 pb-[20vh]">
          {visibleItems.map((item, i) => {
            const layoutProps = layout[i];
            const isPriority = i < 4; 
            
            return (
              <MediaCard
                key={item.id ?? i}
                item={item}
                i={i}
                onOpen={openAt}
                span={layoutProps.span}
                sideClass={layoutProps.side}
                customStyle={layoutProps.style}
                zClass="z-[10] hover:z-[50]" // Ensure hover lifts
                cardMaxClass="max-w-[75vw] md:max-w-[min(20vw,380px)]" // Slightly smaller max-width
                cardHClass="max-h-[45vh] md:max-h-[40vh]" // Slightly shorter max-height
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