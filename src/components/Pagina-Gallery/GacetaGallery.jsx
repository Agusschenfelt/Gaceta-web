  // GacetaGallery.jsx — autoplay + loop robusto para videos en grid y lightbox
import React, { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const clsx = (...xs) => xs.filter(Boolean).join(" ");

/* =========================
   Helpers
   ========================= */

function getDownloadUrl(it) {
  if (!it) return undefined;
  if (it.type === "video") return it.srcMp4 || it.src || it.download;
  if (it.downloadJpg) return it.downloadJpg;
  return it.src;
}

function getDownloadFilename(it, idx) {
  const base = it?.filename || it?.base || `gaceta_${it?.id ?? idx}`;
  if (it.type === "video") return `${base}.mp4`;
  const src = it.downloadJpg ?? it.src;
  const ext = (() => {
    try {
      const url = new URL(src, window.location.origin);
      const parts = url.pathname.split(".");
      return parts.length > 1 ? parts.pop() : "jpg";
    } catch {
      return "jpg";
    }
  })();
  return `${base}.${ext}`;
}

/** Imagen responsiva con fallback */
function SmartImage({
  base,
  alt = "",
  className = "",
  sizes = "(max-width: 768px) 88vw, (max-width: 1280px) 34vw, 24vw",
  fallbackSrc,
  fetchPriority,
  loading = "lazy",
}) {
  const imgRef = useRef(null);
  const handleError = useCallback(() => {
    if (!imgRef.current) return;
    if (fallbackSrc && imgRef.current.src !== fallbackSrc) {
      imgRef.current.src = fallbackSrc;
    }
  }, [fallbackSrc]);

  if (!base) {
    return (
      <img
        ref={imgRef}
        src={fallbackSrc}
        alt={alt}
        loading={loading}
        fetchpriority={fetchPriority}
        className={className}
      />
    );
  }

  const buildSrcSet = (ext) =>
    [320, 560, 840, 1120, 1440].map((w) => `/media/img/${base}-${w}.${ext} ${w}w`).join(", ");

  return (
    <picture>
      <source type="image/avif" srcSet={buildSrcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={buildSrcSet("webp")} sizes={sizes} />
      <img
        ref={imgRef}
        src={`/media/img/${base}-dl.jpg`}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        className={className}
        onError={handleError}
      />
    </picture>
  );
}

/* =========================
   Hooks util
   ========================= */

function useKey(key, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => e.key.toLowerCase() === key.toLowerCase() && handler(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key, handler, enabled]);
}

function useLockScroll(lock) {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.overflow;
    if (lock) root.style.overflow = "hidden";
    return () => (root.style.overflow = prev);
  }, [lock]);
}

/* =========================
   Card
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
}) {
  const mediaRef = useRef(null);

  const SPAN = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
  };
  const spanCls = SPAN[span] || "md:col-span-3";
  const sideCls =
    side === "left" ? "justify-start" : side === "right" ? "justify-end" : "justify-center";

  return (
    <div className={clsx("relative col-span-12 gallery-img", spanCls, rowSpanClass, zClass, randomOffset)} data-card>
      <div className={clsx("flex", sideCls)}>
        <button onClick={() => onOpen(i)} className="relative group block z-0">
          <div
            className={clsx(
              "card-inner",
              "rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl shadow-black/30",
              "transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)]",
              "w-full mx-auto inline-block",
              cardMaxClass,
              "flex items-center justify-center",
              cardHClass,
              "origin-top will-change-transform"
            )}
          >
            {item.type === "video" ? (
              <video
                data-gridvideo
                ref={mediaRef}
                preload="metadata"
                playsInline
                muted
                loop
                poster={item.poster}
                className="block w-auto h-auto max-h-[85vh] md:max-h-full object-contain mx-auto"
                onEnded={(e) => {
                  // fallback por si loop no se respeta en algún navegador
                  try {
                    e.currentTarget.currentTime = 0;
                    e.currentTarget.play().catch(() => {});
                  } catch {}
                }}
              >
                {item.srcWebm && <source src={item.srcWebm} type="video/webm" />}
                <source src={item.srcMp4 || item.src} type="video/mp4" />
              </video>
            ) : item.base ? (
              <SmartImage
                base={item.base}
                fallbackSrc={item.src}
                alt={item.alt || ""}
                className="block w-auto h-auto max-h-[85vh] md:max-h-full object-contain mx-auto"
              />
            ) : (
              <img
                ref={mediaRef}
                src={item.src}
                alt={item.alt || ""}
                loading="lazy"
                decoding="async"
                className="block w-auto h-auto max-h-[85vh] md:max-h-full object-contain mx-auto"
              />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

/* =========================
   Focus / Lightbox
   ========================= */

function FocusLightbox({ open, index, items, onClose, setIndex }) {
  useLockScroll(open);
  const swiperRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);

  const resumeVisibleGridVideos = () => {
    try {
      const gridVids = document.querySelectorAll("video[data-gridvideo]");
      gridVids.forEach((v) => {
        const card = v.closest("[data-card]") || v;
        const visible =
          ScrollTrigger.isInViewport(card, 0.25) ||
          ScrollTrigger.isInViewport(v, 0.25);
        if (visible) {
          v.muted = true;
          v.playsInline = true;
          v.setAttribute("muted", "");
          v.setAttribute("playsinline", "");
          v.loop = true;
          v.play().catch(() => {});
        }
      });
    } catch {}
  };

  const handleClose = useCallback(() => {
    try {
      const vids = swiperRef.current?.el?.querySelectorAll("video") ?? [];
      vids.forEach((v) => v.pause());
    } catch {}
    onClose();

    // Al volver a la galería, reanudar lo visible
    setTimeout(() => {
      resumeVisibleGridVideos();
      ScrollTrigger.refresh(); // revalida visibilidad
    }, 0);
  }, [onClose]);

  useKey("Escape", () => {
    if (open) handleClose();
  }, open);

  const playCurrentPauseOthers = (sw) => {
    const allVideos = sw?.el?.querySelectorAll("video") ?? [];
    allVideos.forEach((v) => v.pause());
    const active = sw?.slides?.[sw.activeIndex];
    const vid = active?.querySelector("video");
    const hasVideo = !!vid;
    setIsVideoActive(hasVideo);
    if (hasVideo) {
      vid.muted = muted;
      vid.playsInline = true;
      vid.loop = true;
      vid.setAttribute("playsinline", "");
      vid.play().catch(() => {});
    }
  };

  if (!open) return null;

  const activeIdx = swiperRef.current?.activeIndex ?? index;
  const activeItem = items[activeIdx];
  const downloadHref = getDownloadUrl(activeItem);
  const filename = getDownloadFilename(activeItem, activeIdx);

  const onBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80" onMouseDown={onBackdropMouseDown}>
      {/* Controles */}
      <div
        className="absolute top-5 right-5 flex items-center gap-3 z-50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {downloadHref && (
          <a
            href={downloadHref}
            download={filename}
            title="Descargar"
            className="grid place-items-center h-14 w-14 rounded-full bg-white/10 text-white transition-transform duration-200 hover:scale-110 hover:rotate-6 active:scale-95"
          >
            <Download className="h-6 w-6" />
          </a>
        )}
        {isVideoActive && (
          <button
            onClick={() => setMuted((m) => !m)}
            title="Mute/Unmute (M)"
            className="grid place-items-center h-14 w-14 rounded-full bg-white/10 text-white transition-transform duration-200 hover:scale-110 hover:-rotate-6 active:scale-95"
          >
            {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
        )}
        <button
          onClick={handleClose}
          title="Cerrar (Esc)"
          className="grid place-items-center h-14 w-14 rounded-full bg-white text-black transition-transform duration-200 hover:scale-110 hover:rotate-6 active:scale-95"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navegación */}
      <button
        className="gaceta-prev hidden md:grid place-items-center absolute left-6 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white z-50 transition-transform duration-200 hover:scale-110 hover:-translate-x-1 hover:rotate-6 active:scale-95"
        title="Anterior (→)"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ChevronLeft className="h-7 w-7" />
      </button>

      <button
        className="gaceta-next hidden md:grid place-items-center absolute right-6 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 text-white z-50 transition-transform duration-200 hover:scale-110 hover:translate-x-1 hover:-rotate-6 active:scale-95"
        title="Siguiente (←)"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ChevronRight className="h-7 w-7" />
      </button>

      {/* Stage */}
      <div className="h-full w-full flex items-center justify-center px-4 md:px-8 pointer-events-none">
        <div
          className="relative w-full max-w-[min(100vw,1400px)] h-[70vh] md:h-[80vh] overflow-hidden rounded-2xl pointer-events-auto bg-transparent flex items-center justify-center"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Swiper
            modules={[Navigation, Keyboard]}
            initialSlide={index}
            keyboard={{ enabled: true }}
            speed={450}
            navigation={{ prevEl: ".gaceta-prev", nextEl: ".gaceta-next" }}
            observer
            observeParents
            resizeObserver
            updateOnWindowResize
            onSwiper={(sw) => {
              swiperRef.current = sw;
              setTimeout(() => playCurrentPauseOthers(sw), 0);
            }}
            onSlideChange={(sw) => {
              setIndex?.(sw.activeIndex);
              setTimeout(() => playCurrentPauseOthers(sw), 0);
            }}
            className="w-full h-full"
          >
            {items.map((it, i) => (
              <SwiperSlide key={it.id ?? i} className="!flex items-center justify-center relative">
                {/* Imagen o video */}
                {it.type === "video" ? (
                  <video
                    src={it.srcMp4 || it.src}
                    poster={it.poster}
                    controls={false}
                    playsInline
                    muted={muted}
                    loop
                    autoPlay
                    preload="metadata"
                    className="block w-full h-auto max-h-full object-contain"
                    onEnded={(e) => {
                      try {
                        e.currentTarget.currentTime = 0;
                        e.currentTarget.play().catch(() => {});
                      } catch {}
                    }}
                  />
                ) : it.base ? (
                  <SmartImage
                    base={it.base}
                    fallbackSrc={it.src}
                    alt={it.alt || ""}
                    className="block w-full h-auto max-h-full object-contain"
                    sizes="(max-width: 1600px) 96vw, 1400px"
                    loading="eager"
                    fetchPriority="high"
                  />
                ) : (
                  <img
                    src={it.src}
                    alt={it.alt || ""}
                    className="block w-full h-auto max-h-full object-contain"
                    loading="eager"
                    fetchpriority="high"
                  />
                )}

                {/* Pie chico abajo a la derecha */}
                {(it.title || it.description) && (
                  <div className="absolute bottom-4 right-6 text-right bg-black/45 backdrop-blur-sm px-3 py-2 rounded-md max-w-[60%]">
                    {it.title && (
                      <p className="text-[13px] font-semibold text-white leading-tight">
                        {it.title}
                      </p>
                    )}
                    {it.description && (
                      <p className="text-[11px] text-white/80 leading-tight mt-[2px]">
                        {it.description}
                      </p>
                    )}
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =========================
   Main
   ========================= */

export default function GacetaGallery({
  title = "GALLERY",
  items = [],
  density = "tobacco",
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const openAt = useCallback((i) => {
    setIndex(i);
    setOpen(true);
  }, []);

  const DENSITY = {
    tobacco: {
      cardMax: "max-w-[min(22vw,420px)] md:max-w-[min(20vw,400px)]",
      cardH: "max-h-[42vh] md:max-h-[38vh]",
      gaps: "gap-y-[8vh] gap-x-10 md:gap-x-12",
      spans: [5, 5, 5, 6, 5, 5, 6, 5, 5],
      titleH: "h-[44vh] md:h-[40vh]",
    },
  };
  const cfg = DENSITY[density] ?? DENSITY.tobacco;

  const galleryRef = useRef(null);

  // helper: reanudar videos visibles del grid
  const resumeVisibleGridVideos = useCallback(() => {
    try {
      const vids = galleryRef.current?.querySelectorAll("video[data-gridvideo]") ?? [];
      vids.forEach((vid) => {
        const card = vid.closest("[data-card]") || vid;
        const visible =
          ScrollTrigger.isInViewport(card, 0.25) ||
          ScrollTrigger.isInViewport(vid, 0.25);
        if (visible) {
          vid.muted = true;
          vid.playsInline = true;
          vid.loop = true;
          vid.setAttribute("muted", "");
          vid.setAttribute("playsinline", "");
          // Si terminó, reiniciamos
          if (vid.ended || vid.currentTime >= (vid.duration || 0) - 0.05) {
            try { vid.currentTime = 0; } catch {}
          }
          vid.play().catch(() => {});
        }
      });
    } catch {}
  }, []);

  useLayoutEffect(() => {
    if (!galleryRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.getAll().forEach((st) => st.kill());

      const cards = gsap.utils.toArray("[data-card]");
      cards.forEach((el) => {
        const inner = el.querySelector(".card-inner");
        if (!inner) return;

        gsap.set(inner, { transformOrigin: "50% 0%", scale: 1.08, y: 0, opacity: 1, z: 0 });

        gsap.fromTo(
          inner,
          { scale: 1.08, y: 0, opacity: 1 },
          {
            scale: 0.5,
            y: -100,
            opacity: 0.9,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 20%",
              end: "top top",
              scrub: true,
              fastScrollEnd: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              once: false,
            },
          }
        );
      });

      // === Auto play/pause videos del GRID (robusto) ===
      const vids = gsap.utils.toArray("video[data-gridvideo]");
      vids.forEach((vid) => {
        vid.muted = true;
        vid.playsInline = true;
        vid.loop = true;
        vid.setAttribute("muted", "");
        vid.setAttribute("playsinline", "");
        // Fallback si loop falla
        const onEnded = () => {
          try {
            vid.currentTime = 0;
            vid.play().catch(() => {});
          } catch {}
        };
        vid.removeEventListener("ended", onEnded);
        vid.addEventListener("ended", onEnded);

        try { vid.pause(); } catch {}

        const st = ScrollTrigger.create({
          trigger: vid.closest("[data-card]") || vid,
          start: "top 90%",
          end: "bottom 10%",
          onEnter: () => vid.play().catch(() => {}),
          onEnterBack: () => vid.play().catch(() => {}),
          onLeave: () => { try { vid.pause(); } catch {} },
          onLeaveBack: () => { try { vid.pause(); } catch {} },
          // Si por alguna razón quedó pausado estando visible, reintenta
          onUpdate: (self) => {
            if (self.isActive && vid.paused) {
              vid.play().catch(() => {});
            }
          },
        });

        // Si ya está visible al montar
        if (st.isActive || ScrollTrigger.isInViewport(vid, 0.15)) {
          vid.play().catch(() => {});
        }
      });

      // Refrescar triggers una vez que todo haya cargado
      const doRefresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", doRefresh, { once: true });
      setTimeout(doRefresh, 300);
    }, galleryRef);

    // 🧹 Limpieza
    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [items]);

  // Pausar videos del grid al abrir lightbox
  useEffect(() => {
    if (!open) return;
    const vids = galleryRef.current?.querySelectorAll("video[data-gridvideo]") ?? [];
    vids.forEach((v) => {
      try {
        v.pause();
      } catch {}
    });
  }, [open]);

  // Visibilidad de la pestaña: pausa/reanuda lo visible en el grid
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        try {
          const vids = galleryRef.current?.querySelectorAll("video[data-gridvideo]") ?? [];
          vids.forEach((v) => v.pause());
        } catch {}
      } else {
        // si se vuelve a la pestaña y NO está el lightbox abierto, reanudar grid visible
        if (!open) {
          resumeVisibleGridVideos();
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [open, resumeVisibleGridVideos]);

  const gridLayout = useMemo(
    () =>
      items.map((_, i) => ({
        span: [5, 5, 5, 6, 5, 5, 6, 5, 5][i % 9],
        side: ["left", "center", "right", "left", "right", "center", "right", "left", "center"][i % 9],
      })),
    [items]
  );

  return (
    <section ref={galleryRef} className="relative w-full bg-[#911e1e] text-white">
      <div
        className={clsx(
          "sticky top-20 grid place-items-center z-[15] pointer-events-none",
          "h-[26vh] md:h-[40vh]"
        )}
      >
        <h2 className="select-none text-center leading-none mb-[6vh] md:mb-0">
          <span className="block font-serif italic text-3xl md:text-5xl text-[#dee5a0]/80">GACETA</span>
          <span className="block font-black text-[16vw] md:text-[12vw] text-[#dee5a0]">
            {title}
          </span>
        </h2>
      </div>

      {/* Grid */}
      <div
        className={clsx(
          "relative mx-auto max-w-[2000px] 2xl:max-w-[2400px] px-4 md:px-10",
          open ? "invisible" : "mt-0"
        )}
        aria-hidden={open}
      >
        <div
          className={clsx(
            "grid grid-cols-12 grid-flow-dense",
            "auto-rows-auto",
            "gap-y-[6vh] gap-x-4 md:gap-y-[14vh] md:gap-x-28",
            "pb-[20vh]"
          )}
        >
          {items.map((item, i) => {
            const above = i % 2 === 0 || i % 3 === 0;
            const zClass = above ? "z-[30]" : "z-[10]";
            const randomOffset =
              i % 2 === 0
                ? "-translate-y-[1vh] md:-translate-y-[2vh]"
                : "translate-y-[1vh] md:translate-y-[2vh]";

            return (
              <MediaCard
                key={item.id ?? i}
                item={item}
                i={i}
                onOpen={openAt}
                span={Math.min(12, Math.max(1, gridLayout[i].span))}
                side={gridLayout[i].side}
                cardMaxClass="max-w-[65vw] md:max-w-[min(17vw,340px)]"
                cardHClass="max-h-[26vh] md:max-h-[34vh]"
                zClass={zClass}
                randomOffset={randomOffset}
              />
            );
          })}
        </div>
      </div>

      <FocusLightbox
        open={open}
        index={index}
        items={items}
        onClose={() => setOpen(false)}
        setIndex={setIndex}
      />
    </section>
  );
}
