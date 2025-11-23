import { useRef, useLayoutEffect, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import SeccionArtistas from "../components/Pagina-Home/SeccionArtistas";

gsap.registerPlugin(ScrollTrigger);

export default function ArtistPage({ artistsData = [] }) {
  const { id } = useParams();
  const norm = (s) => s?.toLowerCase().trim().replace(/\s+/g, "-");
  const artist = useMemo(
    () => artistsData.find((a) => (a.slug ?? norm(a.nombre)) === id),
    [artistsData, id]
  );
  if (!artist) return <Navigate to="/" replace />;

  // ===== REFS =====
  const overlayRef = useRef(null);
  const titleRef = useRef(null);
  const heroRef = useRef(null);
  const bioTextRefEl = useRef(null);
  const fotosRef = useRef(null);
  const proyectosRef = useRef(null);

  // Temas (CSS-only reveal usa solo este estado)
  const [activeIndex, setActiveIndex] = useState(null);

  const [videoReady, setVideoReady] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // === OSCURECER VIDEO ===
      const BASE = 0.5;
      const PEAK = 0.85;
      const QUICK = 100;

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        {
          opacity: BASE,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: `+=${QUICK}`,
            scrub: true,
          },
        }
      );
      gsap.to(overlayRef.current, {
        opacity: PEAK,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: `+=${QUICK}`,
          end: "60%",
          scrub: true,
        },
      });

      // === TÍTULO SPLIT ===
      const splitTitle = new SplitType(titleRef.current, { types: "lines" });
      gsap.from(splitTitle.lines, {
        yPercent: 120,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
      });

      // === REDES (entradita) ===
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll("[data-hero-anim]"),
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            delay: 0.2,
          }
        );
      }

      // === BIO SPLIT (repetible al subir/bajar) ===
      let splitBio = new SplitType(bioTextRefEl.current, { types: "lines" });
      gsap.set(splitBio.lines, { overflow: "hidden" });

      const tlBio = gsap.timeline({ paused: true }).fromTo(
        splitBio.lines,
        { yPercent: 20, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.04,
        }
      );

      const st = ScrollTrigger.create({
        trigger: bioTextRefEl.current,
        start: "top 80%",
        end: "bottom 60%",
        onEnter: () => tlBio.restart(),
        onEnterBack: () => tlBio.restart(),
        onLeave: () => tlBio.progress(1).pause(),
        onLeaveBack: () => tlBio.progress(0).pause(),
        invalidateOnRefresh: true,
      });

      // Resplit en refresh (por cambios de layout/line-wrap)
      const onRefresh = () => {
        tlBio.progress(0).clear();
        splitBio.revert();
        splitBio = new SplitType(bioTextRefEl.current, { types: "lines" });
        gsap.set(splitBio.lines, { overflow: "hidden" });
        tlBio.fromTo(
          splitBio.lines,
          { yPercent: 20, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.04,
          }
        );
        st.refresh();
      };
      ScrollTrigger.addEventListener("refresh", onRefresh);

      // === FOTOS ===
      const fotos = fotosRef.current?.querySelectorAll("[data-foto]");
      gsap.fromTo(
        fotos,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: fotosRef.current,
            start: "top 80%",
          },
        }
      );
      fotos?.forEach((f, i) =>
        gsap.to(f, {
          yPercent: i % 2 ? -8 : -12,
          ease: "none",
          scrollTrigger: {
            trigger: f,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        })
      );

      // (dejamos el grid de proyectos por si lo usás en otro momento)
      if (proyectosRef.current) {
        gsap.fromTo(
          proyectosRef.current.querySelectorAll("[data-proyecto]"),
          { y: 22, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: proyectosRef.current,
              start: "top 85%",
            },
          }
        );
      }

      return () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        st.kill();
        splitBio.revert();
      };
    });

    return () => ctx.revert();
  }, []);

  // Fuentes de video
  const video = artist.videoFondo;
  const sources = Array.isArray(video)
    ? video
    : [{ src: video, type: video?.endsWith(".webm") ? "video/webm" : "video/mp4" }];

  // Temas (preferir artist.temas; fallback a proyectos)
  const temas = (artist.temas ?? artist.proyectos ?? []).slice(0, 5);

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden text-white bg-transparent">
      <style>{`
        html, body, main { background: transparent !important; }
        video.bg-video {
          position: fixed; inset: 0; z-index: -10;
          width: 100%; height: 100%; object-fit: cover; display:block;
        }
      `}</style>

      {/* === VIDEO DE FONDO === */}
      <div className="fixed inset-0 -z-10">
        <video
          className={`bg-video transition-opacity duration-500 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={artist.poster ?? artist.fotos?.[0]}
          onCanPlay={() => setVideoReady(true)}
        >
          {sources.map((s, i) => (
            <source key={i} src={s.src} type={s.type ?? "video/mp4"} />
          ))}
        </video>
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black opacity-0 pointer-events-none"
        />
      </div>

      {/* === HERO === */}
      <section
        ref={heroRef}
        className="relative min-h-[100vh] flex flex-col items-center justify-center text-center px-6 pt-10"
      >
        <h1
          ref={titleRef}
          className="text-[12vw] leading-none md:text-7xl font-bold tracking-tight drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]"
        >
          {artist.nombre}
        </h1>
        <p
          data-hero-anim
          className="uppercase text-xs md:text-sm tracking-[0.2em] opacity-90 mt-4"
        >
          {artist.rol}
        </p>
        <div
          data-hero-anim
          className="flex gap-6 mt-8 text-sm md:text-base"
        >
          {artist.redes?.instagram && (
            <a
              className="hover:underline underline-offset-4 decoration-1"
              href={artist.redes.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram ↗
            </a>
          )}
          {artist.redes?.spotify && (
            <a
              className="hover:underline underline-offset-4 decoration-1"
              href={artist.redes.spotify}
              target="_blank"
              rel="noreferrer"
            >
              Spotify ↗
            </a>
          )}
          {artist.redes?.youtube && (
            <a
              className="hover:underline underline-offset-4 decoration-1"
              href={artist.redes.youtube}
              target="_blank"
              rel="noreferrer"
            >
              YouTube ↗
            </a>
          )}
          {artist.redes?.x && (
            <a
              className="hover:underline underline-offset-4 decoration-1"
              href={artist.redes.x}
              target="_blank"
              rel="noreferrer"
            >
              X ↗
            </a>
          )}
        </div>
      </section>

      {/* === BIO + FOTOS === */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-6 md:px-8 py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/20 rounded-[2rem] blur-3xl opacity-70 pointer-events-none" />
        <div className="relative text-center mb-20">
          <p
            ref={bioTextRefEl}
            id="bioText"
            className="text-[clamp(18px,1.6vw,20px)] leading-[1.55] font-normal tracking-normal
                       text-neutral-100/95 max-w-[780px] mx-auto text-center
                       drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]"
          >
            {artist.biografia}
          </p>
        </div>

        <div
          ref={fotosRef}
          className="relative grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center"
        >
          {artist.fotos?.slice(0, 6).map((f, i) => (
            <figure
              data-foto
              key={i}
              className={`relative overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] 
                transition-transform duration-700 hover:scale-[1.05]
                ${i % 5 === 0 ? "col-span-2 row-span-2" : ""}
              `}
            >
              <img
                src={f}
                alt={`Foto ${i + 1} de ${artist.nombre}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/50 opacity-0 hover:opacity-100 transition-opacity" />
            </figure>
          ))}
        </div>
      </section>

      {/* === TEMAS DEL ARTISTA (CSS-only) === */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-24 md:py-32">
        <h2 className="text-3xl md:text-4xl font-semibold mb-14 text-center">
          Catálogo del artista
        </h2>

        <div className="flex flex-col md:flex-row gap-12 items-start md:items-stretch">
          {/* Lista de temas (link a Spotify) */}
          <ul className="flex-1 space-y-6 md:space-y-8 text-lg md:text-2xl font-medium tracking-tight">
            {temas.map((t, i) => (
              <li
                key={i}
                className="group cursor-pointer transition-all duration-300"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => setActiveIndex(null)}
              >
                {t.spotify ? (
                  <a
                    href={t.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4"
                  >
                    <span
                      className={`transition-colors duration-300 ${
                        activeIndex === i ? "text-white" : "text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {t.nombre}
                    </span>
                    <span className="text-xs md:text-sm uppercase tracking-wider opacity-60">
                      Escuchar ↗
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`transition-colors duration-300 ${
                        activeIndex === i ? "text-white" : "text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {t.nombre}
                    </span>
                    <span className="text-xs md:text-sm uppercase tracking-wider opacity-40">
                      Sin link
                    </span>
                  </div>
                )}
                <div className="h-[1px] w-0 bg-white/50 transition-all duration-500 group-hover:w-full" />
              </li>
            ))}
          </ul>

          {/* Preview derecha (reveal desde abajo con CSS) */}
          <div className="hidden md:block w-[45%] relative overflow-hidden rounded-2xl">
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              {temas.map((t, i) => (
                <img
                  key={i}
                  src={t.imagen}
                  alt={t.nombre}
                  className={`absolute inset-0 w-full h-full object-cover rounded-2xl will-change-transform
                    transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                    transition-opacity ${activeIndex === i ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
                  draggable="false"
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* === CTA + RAIL === */}
      <section className="relative z-10 py-24 md:py-32">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-semibold mb-3">
            Conocé más artistas de Gaceta
          </h3>
          <p className="opacity-80">
            Seguí explorando productores y voces del sello.
          </p>
        </div>
        <SeccionArtistas rows={1} />
      </section>
    </main>
  );
}
