import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const FALLBACK_ID = "nVIm2-qJzYA";

export default function SeccionGacetaTv() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const labelRef = useRef(null);

  const [videoId, setVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("gaceta_latest_video");
    if (cached) { setVideoId(cached); return; }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    fetch("/api/latest-video", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        clearTimeout(timeout);
        setVideoId(data.videoId);
        sessionStorage.setItem("gaceta_latest_video", data.videoId);
      })
      .catch(() => setVideoId(FALLBACK_ID));
  }, []);

  useGSAP(() => {
    // Estado inicial en GSAP, no en DOM — evita flash si JS tarda en cargar
    if (labelRef.current) gsap.set(labelRef.current, { opacity: 0 });

    gsap.fromTo(
      cardRef.current,
      { y: 100, opacity: 0.6, scale: 0.95 },
      {
        y: 0, opacity: 1, scale: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          end: "top 40%",
          scrub: 1,
        },
      }
    );

    if (labelRef.current) {
      gsap.fromTo(
        labelRef.current,
        { y: 10, opacity: 0, letterSpacing: "0.05em" },
        {
          y: 0, opacity: 1, letterSpacing: "0.2em",
          duration: 0.7, ease: "power3.out",
          scrollTrigger: {
            trigger: labelRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="gacetatv"
      className="relative z-40 w-full pt-24 pb-32 flex flex-col items-center pointer-events-none"
    >
      {/* Fondo gradiente */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent via-fondo to-fondo -z-20" />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-20 w-[92%] max-w-[1100px] aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black shadow-2xl pointer-events-auto"
      >
        {/* Loading skeleton */}
        {!videoId && (
          <div
            className="absolute inset-0 bg-white/[0.04] animate-pulse"
            role="status"
            aria-label="Cargando video"
          />
        )}

        {/* Thumbnail facade */}
        {videoId && !isPlaying && !imgFailed && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full group"
            aria-label="Reproducir último video de GacetaTV"
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="GacetaTV — último video"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                if (e.currentTarget.src.includes("maxresdefault")) {
                  e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                } else {
                  setImgFailed(true);
                }
              }}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-[background-color,transform,border-color] duration-300">
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-white translate-x-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Fallback — YouTube inaccesible o thumbnail rota */}
        {videoId && !isPlaying && imgFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">No se pudo cargar el video</p>
            <a
              href="https://youtube.com/@esgaceta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition-colors font-mono text-xs uppercase tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario rounded-sm"
            >
              Ver en YouTube ↗
            </a>
          </div>
        )}

        {/* Iframe — solo al hacer play */}
        {videoId && isPlaying && (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1&autoplay=1`}
            title="GacetaTV"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <h2
        ref={labelRef}
        className="mt-10 text-center text-white/90 font-semibold tracking-widest uppercase text-xs z-20"
      >
        GACE<span className="text-secundario">TV</span>
      </h2>

      {/* Fade hacia Shop */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-fondo to-transparent pointer-events-none z-30" />
    </section>
  );
}
