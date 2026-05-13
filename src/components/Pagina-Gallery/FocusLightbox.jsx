import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const clsx = (...xs) => xs.filter(Boolean).join(" ");

/* =========================
   Helpers Internos
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
    } catch { return "jpg"; }
  })();
  return `${base}.${ext}`;
}

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

// Versión simplificada de SmartImage para el Lightbox (Prioridad Alta)
function LightboxImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full flex items-center justify-center">
       {!loaded && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
       <img
          src={src}
          alt={alt}
          className={clsx(
            "block w-full h-full object-contain shadow-2xl transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading="eager" // En lightbox queremos carga inmediata
          onLoad={() => setLoaded(true)}
       />
    </div>
  );
}

/* =========================
   Componente Principal (Exportado)
   ========================= */

export default function FocusLightbox({ open, index, items, onClose, setIndex }) {
  useLockScroll(open);
  const swiperRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Guardar foco anterior, mover a close button al abrir, restaurar al cerrar
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    return () => { previousFocus?.focus(); };
  }, []);

  // Tab trap — confina el foco dentro del modal
  useEffect(() => {
    const handleTab = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, []);

  const handleClose = useCallback(() => {
    try {
        const vids = swiperRef.current?.el?.querySelectorAll("video") ?? [];
        vids.forEach((v) => v.pause());
    } catch {}
    onClose();
    // Refrescamos ScrollTrigger al cerrar por si el scroll se desajustó
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 0);
  }, [onClose]);

  useKey("Escape", () => { if (open) handleClose(); }, open);

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
      vid.play().catch(() => {});
    }
  };

  if (!open) return null;

  const activeIdx = swiperRef.current?.activeIndex ?? index;
  const activeItem = items[activeIdx];
  const downloadHref = getDownloadUrl(activeItem);
  const filename = getDownloadFilename(activeItem, activeIdx);
  const onBackdropMouseDown = (e) => { if (e.target === e.currentTarget) handleClose(); };

  return createPortal(
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label="Galería — imagen ampliada"
      className="fixed inset-0 z-[100] bg-black/95 lightbox-enter"
      onMouseDown={onBackdropMouseDown}
    >
      
      {/* Controles Superiores */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-50" onMouseDown={(e) => e.stopPropagation()}>
        {downloadHref && (
          <a href={downloadHref} download={filename} title="Descargar" aria-label={activeItem?.type === "video" ? "Descargar video" : "Descargar imagen"} className="grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-[background-color,transform] hover:scale-105 border border-white/5">
            <Download className="h-5 w-5" />
          </a>
        )}
        {isVideoActive && (
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Activar sonido" : "Silenciar"} className="grid place-items-center h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-[background-color,transform] hover:scale-105 border border-white/5">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        <button ref={closeButtonRef} onClick={handleClose} aria-label="Cerrar galería" className="grid place-items-center h-12 w-12 rounded-full bg-white text-black transition-[transform] hover:scale-105 hover:rotate-90">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Flechas Navegación */}
      <button aria-label="Imagen anterior" aria-hidden="true" className="gaceta-prev group hidden md:grid place-items-center absolute left-6 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white z-50 border border-white/5 transition-colors" onMouseDown={(e) => e.stopPropagation()} tabIndex={-1}>
        <ChevronLeft className="h-7 w-7 opacity-80 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
      </button>

      <button aria-label="Imagen siguiente" aria-hidden="true" className="gaceta-next group hidden md:grid place-items-center absolute right-6 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white z-50 border border-white/5 transition-colors" onMouseDown={(e) => e.stopPropagation()} tabIndex={-1}>
        <ChevronRight className="h-7 w-7 opacity-80 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </button>

      {/* Slider */}
      <div className="h-full w-full flex items-center justify-center px-4 md:px-8 pointer-events-none">
        <div className="relative w-full max-w-[min(100vw,1400px)] h-[70svh] md:h-[85svh] overflow-hidden rounded-md pointer-events-auto bg-transparent flex items-center justify-center" onMouseDown={(e) => e.stopPropagation()}>
          <Swiper
            modules={[Navigation, Keyboard]} 
            initialSlide={index} 
            keyboard={{ enabled: true }} 
            speed={500} 
            spaceBetween={40}
            navigation={{ prevEl: ".gaceta-prev", nextEl: ".gaceta-next" }}
            onSwiper={(sw) => { swiperRef.current = sw; setTimeout(() => playCurrentPauseOthers(sw), 0); }}
            onSlideChange={(sw) => { setIndex?.(sw.activeIndex); setTimeout(() => playCurrentPauseOthers(sw), 0); }}
            className="w-full h-full"
          >
            {items.map((it, i) => (
              <SwiperSlide key={it.id ?? i} className="!flex items-center justify-center relative">
                {it.type === "video" ? (
                  <video src={it.srcMp4 || it.src} poster={it.poster} controls={false} playsInline muted={muted} loop autoPlay preload="metadata" className="block w-full h-full object-contain shadow-2xl" />
                ) : (
                  <LightboxImage src={it.src} alt={it.alt || ""} />
                )}
                
                {/* Caption / Descripción */}
                {(it.title || it.description) && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center bg-black/80 px-6 py-3 rounded-full border border-white/10 max-w-[90%]">
                    {it.title && <p className="text-sm md:text-base font-semibold text-white leading-tight">{it.title}</p>}
                    {it.description && <p className="text-xs md:text-sm text-white/70 leading-tight mt-1">{it.description}</p>}
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