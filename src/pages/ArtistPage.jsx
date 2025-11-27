import { useRef, useLayoutEffect, useMemo, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
// Borramos la importación directa de Helmet porque ya la maneja el componente SEO
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
// IMPORTANTE: Asegúrate de que la ruta sea correcta según tu estructura
import SEO from "../SEO"; 

gsap.registerPlugin(ScrollTrigger);

export default function ArtistPage({ artistsData = [] }) {
  const { id } = useParams();
  const norm = (s) => s?.toLowerCase().trim().replace(/\s+/g, "-");

  // ===== 1. LOGICA DE ARTISTA =====
  const currentIndex = useMemo(
    () => artistsData.findIndex((a) => (a.slug ?? norm(a.nombre)) === id),
    [artistsData, id]
  );

  const artist = artistsData[currentIndex];
  
  // Siguiente artista (Loop infinito)
  const nextArtist = artistsData[(currentIndex + 1) % artistsData.length];

  if (!artist) return <Navigate to="/" replace />;

  // ===== REFS =====
  const overlayRef = useRef(null);
  const titleRef = useRef(null);
  const heroRef = useRef(null);
  const bioContainerRef = useRef(null); 
  const fotosRef = useRef(null);
  
  const [activeIndex, setActiveIndex] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // ... (Toda tu lógica de animación GSAP se mantiene IGUAL) ...
      // Para ahorrar espacio en la respuesta, asumo que el código de animación
      // sigue aquí intacto tal cual me lo pasaste.
      
      const BASE = 0.5;
      const PEAK = 0.85;
      const QUICK = 100;

      gsap.fromTo(overlayRef.current, { opacity: 0 }, {
          opacity: BASE, ease: "none",
          scrollTrigger: { trigger: document.documentElement, start: "top top", end: `+=${QUICK}`, scrub: true }
      });
      gsap.to(overlayRef.current, {
        opacity: PEAK, ease: "none",
        scrollTrigger: { trigger: document.documentElement, start: `+=${QUICK}`, end: "60%", scrub: true }
      });

      const splitTitle = new SplitType(titleRef.current, { types: "lines" });
      gsap.from(splitTitle.lines, {
        yPercent: 120, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1,
      });

      if (heroRef.current) {
        gsap.fromTo(heroRef.current.querySelectorAll("[data-hero-anim]"),
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.06, delay: 0.2 }
        );
      }

      const paragraphs = bioContainerRef.current?.querySelectorAll("p");
      if (paragraphs) {
        gsap.fromTo(paragraphs,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1,
              scrollTrigger: { trigger: bioContainerRef.current, start: "top 85%", toggleActions: "play none none reverse" }
            }
        );
      }

      const fotos = fotosRef.current?.querySelectorAll("[data-foto]");
      gsap.fromTo(fotos,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.12,
          scrollTrigger: { trigger: fotosRef.current, start: "top 80%" }
        }
      );
      
      fotos?.forEach((f, i) =>
        gsap.to(f, {
          yPercent: i % 2 ? -8 : -12, ease: "none",
          scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true }
        })
      );

    }, heroRef);

    return () => ctx.revert();
  }, [id]);

  // Video Background logic
  const video = artist.videoFondo;
  const sources = Array.isArray(video)
    ? video
    : [{ src: video, type: video?.endsWith(".webm") ? "video/webm" : "video/mp4" }];

  const temas = (artist.temas ?? artist.proyectos ?? []).slice(0, 5);

  // --- PREPARAR DATOS SEO ---
  // Cortamos la bio para que no sea infinita en Google (160 caracteres es el estándar)
  const bioExcerpt = artist.biografia 
    ? artist.biografia.split(".")[0] + "." // Primera oración o...
    : `Perfil oficial de ${artist.nombre} en Gaceta.`;

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden text-white bg-transparent selection:bg-white/20 selection:text-white">
      
      {/* 2. SEO IMPLEMENTADO CORRECTAMENTE */}
      <SEO 
        title={artist.nombre}
        description={bioExcerpt}
        image={artist.fotos?.[0]} // La primera foto será la que salga en WhatsApp/Twitter
        url={`/${id}`} // Link canónico
        keywords={`Gaceta, ${artist.nombre}, Música Urbana, Trap, ${artist.rol || "Artista"}`}
      />

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
          className={`bg-video transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay muted loop playsInline preload="auto"
          poster={artist.poster ?? artist.fotos?.[0]}
          onCanPlay={() => setVideoReady(true)}
          key={artist.videoFondo} 
        >
          {sources.map((s, i) => (
            <source key={i} src={s.src} type={s.type ?? "video/mp4"} />
          ))}
        </video>
        <div ref={overlayRef} className="absolute inset-0 bg-black opacity-0 pointer-events-none" />
      </div>

      {/* === HERO === */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col items-center justify-center text-center px-6 pt-10">
        <h1 ref={titleRef} className="text-[14vw] leading-[0.85] md:text-[9rem] font-bold tracking-tighter drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          {artist.nombre}
        </h1>
        <p data-hero-anim className="uppercase text-xs md:text-sm tracking-[0.25em] font-medium opacity-90 mt-6">
          {artist.rol}
        </p>
        <div data-hero-anim className="flex gap-6 mt-10 text-sm md:text-base font-light">
          {Object.entries(artist.redes || {}).map(([network, url]) => (
             url && (
                <a key={network} className="hover:text-[#dee5a0] transition-colors duration-300 capitalize" href={url} target="_blank" rel="noreferrer">
                  {network} ↗
                </a>
             )
          ))}
        </div>
      </section>

      {/* === BIO + FOTOS === */}
      <section className="relative z-10 max-w-[1300px] mx-auto px-6 md:px-12 py-24 md:py-32">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[120%] h-[80%] bg-black/40 blur-[80px] -z-10 rounded-full pointer-events-none" />

        <div className="relative mb-24 md:mb-32">
            <div ref={bioContainerRef} className="md:columns-2 gap-12 lg:gap-20 text-[1.1rem] md:text-[1.25rem] leading-[1.6] text-neutral-200/90 font-light text-pretty">
                {artist.biografia.split('\n').filter(Boolean).map((paragraph, i) => (
                    <p key={i} className={`mb-6 break-inside-avoid ${i===0 ? "first-letter:float-left first-letter:text-6xl first-letter:pr-3 first-letter:font-serif first-letter:text-white first-letter:leading-[0.8]" : ""}`}>
                        {paragraph}
                    </p>
                ))}
            </div>
        </div>

        <div ref={fotosRef} className="relative grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 justify-center">
          {artist.fotos?.slice(0, 6).map((f, i) => (
            <figure data-foto key={i} className={`relative overflow-hidden rounded-xl shadow-2xl aspect-[3/4] bg-white/5 ${i % 5 === 0 ? "col-span-2 row-span-2 aspect-[3/3.5]" : ""}`}>
              <img src={f} alt={`Foto ${i + 1} de ${artist.nombre}`} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </section>

      {/* === CATÁLOGO === */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
        <h2 className="text-sm md:text-base uppercase tracking-[0.2em] text-neutral-400 mb-12 border-b border-white/10 pb-4">
          Catálogo Selecto
        </h2>
        <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start md:items-center relative">
          <ul className="flex-1 w-full space-y-0 relative z-20">
            {temas.map((t, i) => (
              <li key={i} className="group border-b border-white/10 last:border-none" onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                <a href={t.spotify || "#"} target={t.spotify ? "_blank" : undefined} rel="noopener noreferrer" className={`block py-6 md:py-8 transition-all duration-300 ${t.spotify ? "cursor-pointer" : "cursor-default"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl md:text-4xl lg:text-5xl font-serif italic text-neutral-400 group-hover:text-white group-hover:translate-x-4 transition-all duration-300">
                      {t.nombre}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300 text-xs tracking-widest uppercase">
                      {t.spotify ? "Spotify ↗" : "Próximamente"}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <div className="hidden md:block w-[400px] h-[400px] relative pointer-events-none perspective-[1000px]">
             {temas.map((t, i) => (
                <div key={i} className={`absolute inset-0 transition-all duration-500 ease-out will-change-transform ${activeIndex === i ? "opacity-100 translate-y-0 rotate-0 scale-100" : "opacity-0 translate-y-12 rotate-2 scale-95"}`}>
                    <img src={t.imagen || artist.fotos?.[0]} alt={t.nombre} className="w-full h-full object-cover rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* === NEXT ARTIST === */}
      {nextArtist && (
          <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden group border-t border-white/5">
            <Link to={`/${nextArtist.slug ?? norm(nextArtist.nombre)}`} className="absolute inset-0 z-20 block cursor-pointer" aria-label={`Ir al siguiente artista: ${nextArtist.nombre}`} />
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <img src={nextArtist.fotos?.[0] || "/assets/placeholder.jpg"} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-1000 group-hover:scale-[1.03] grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-700" />
            </div>
            <div className="text-center z-10 text-white pointer-events-none mix-blend-screen">
                <span className="block text-xs md:text-sm tracking-[0.4em] uppercase mb-6 text-neutral-400 group-hover:text-white transition-colors">
                    Siguiente Artista
                </span>
                <h2 className="text-[12vw] md:text-[8rem] leading-[0.8] font-serif italic tracking-tighter group-hover:-translate-y-2 transition-transform duration-700">
                    {nextArtist.nombre}
                </h2>
                <div className="mt-8 opacity-0 translate-y-6 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                    <span className="inline-flex items-center gap-2 border-b border-white/50 pb-1 text-xs md:text-sm tracking-widest uppercase">
                        Ver Perfil
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </span>
                </div>
            </div>
          </section>
      )}
    </main>
  );
}