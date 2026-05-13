import React, { useState, useCallback, useLayoutEffect, useMemo, useRef, Suspense, useEffect, lazy } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const FocusLightbox = lazy(() => import("./FocusLightbox"));

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
    <div className={clsx("relative overflow-hidden bg-black", className)}>
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
            "block w-full h-full object-cover transition-[opacity,filter] duration-700 ease-out",
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

  // Play/pause video based on viewport visibility
  useEffect(() => {
    if (item.type !== "video" || !mediaRef.current) return;
    const video = mediaRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [item.type]);

  // Entrance animation — reveal when card enters viewport
  const cardRef = useRef(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -4% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const SPAN = {
    1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4",
    5: "md:col-span-5", 6: "md:col-span-6", 7: "md:col-span-7", 8: "md:col-span-8",
    9: "md:col-span-9", 10: "md:col-span-10", 11: "md:col-span-11", 12: "md:col-span-12",
  };
  const spanCls = SPAN[span] || "md:col-span-3";

  return (
    <div
        ref={cardRef}
        className={clsx("relative col-span-12 gallery-img", spanCls, zClass)}
        style={customStyle}
        data-card
    >
      <div className={clsx("gallery-card-body flex w-full", sideClass)}>
        <button 
          onClick={() => onOpen(i)} 
          className="relative group block z-0 w-full outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          aria-label={item.alt || item.title || `Ver imagen ${i + 1} de la galería`}
        >
          <div
            className={clsx(
              "card-inner",
              // ESTILO CARDS
              "relative rounded-sm overflow-hidden border border-white/5 bg-fondo",
              "transform transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
              // HOVER: Lift up + Glow + Rotate slightly opposite to random rotation? No, resets rotation to 0 maybe?
              "group-hover:scale-[1.05] group-hover:rotate-0 group-hover:z-[50] group-hover:border-secundario/40 group-hover:shadow-[0_20px_50px_-10px_rgba(222,229,160,0.15)]",
              "w-full mx-auto inline-block",
              "flex items-center justify-center",
              cardMaxClass,
              cardHClass,
              "origin-center"
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
                alt={item.alt || item.title || `Fotografía GACETA`}
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

    return () => {
      observer.disconnect();
      trigger.remove();
    };
  }, [items.length]);

  // Slice items for rendering
  const visibleItems = items.slice(0, visibleCount);

  return (
    // min-h-[100svh] para estabilidad en móviles
    <section ref={galleryRef} className="relative w-full min-h-[100svh] bg-fondo text-white overflow-hidden">
      

      {/* 2. VIÑETA OSCURA */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-[5] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_90%)]" />

      {/* HEADER TÍTULO */}
      <div
        ref={titleRef}
        className={clsx(
          "fixed inset-0 grid place-items-center z-[0] pointer-events-none opacity-20"
        )}
      >
        <h2 className="select-none text-center leading-none">
          <span className="block font-serif italic text-2xl md:text-5xl text-secundario/50 mb-4 md:mb-6">GACETA</span>
          <span className="block font-black text-[18vw] md:text-[15vw] text-secundario/30 tracking-tight">
            {title}
          </span>
        </h2>
      </div>


      {/* GRID */}
{/* MINI LABEL */}
      {!open && (
        <div className="relative z-[20] pt-28 md:pt-36 pb-8 md:pb-10 px-6 md:px-10 max-w-[1800px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
            <span className="text-white/60">{items.length}</span>
            {" "}fotos · abrí cualquiera para descargar
          </p>
        </div>
      )}

      <div
        ref={gridRef}
        className={clsx(
          "relative mx-auto max-w-[1800px] 2xl:max-w-[2400px] px-4 md:px-10 z-[10]",
          open ? "invisible" : "mt-0"
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
                customStyle={{ ...layoutProps.style, '--card-delay': `${(i % 5) * 40}ms` }}
                zClass="z-[10] hover:z-[50]" // Ensure hover lifts
                cardMaxClass="max-w-[68vw] md:max-w-[min(20vw,380px)]" // Slightly smaller max-width
                cardHClass="max-h-[45vh] md:max-h-[40vh]" // Slightly shorter max-height
                priority={isPriority}
              />
            );
          })}
        </div>
      </div>

      {/* LIGHTBOX */}
      {open && (
        <Suspense fallback={<div role="status" aria-busy="true" className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center text-white">Cargando...</div>}>
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