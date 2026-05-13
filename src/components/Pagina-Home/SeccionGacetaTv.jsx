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

  useEffect(() => {
    const cached = sessionStorage.getItem("gaceta_latest_video");
    if (cached) { setVideoId(cached); return; }

    fetch("/api/latest-video")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setVideoId(data.videoId);
        sessionStorage.setItem("gaceta_latest_video", data.videoId);
      })
      .catch(() => setVideoId(FALLBACK_ID));
  }, []);

  useGSAP(() => {
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
        {/* Loading */}
        {!videoId && (
          <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.2em] text-white/30 uppercase">
            Cargando...
          </div>
        )}

        {/* Thumbnail facade */}
        {videoId && !isPlaying && (
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
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 border border-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-[background-color,transform] duration-300">
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
        className="mt-10 text-center text-white/90 font-semibold tracking-widest uppercase text-xs z-20 opacity-0"
      >
        GACE<span className="text-secundario">TV</span>
      </h2>

      {/* Fade hacia Shop */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-fondo to-transparent pointer-events-none z-30" />
    </section>
  );
}
