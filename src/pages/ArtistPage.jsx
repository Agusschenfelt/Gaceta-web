import { useRef, useMemo, useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ARTISTS_DATA } from "../data/artistsData";
import { showsData } from "../data/showsData";
import SEO from "../SEO";

// ICONOS
import { 
  FaInstagram, 
  FaSpotify, 
  FaYoutube, 
  FaTiktok, 
  FaTwitter, 
  FaSoundcloud, 
  FaApple, 
  FaLink 
} from "react-icons/fa";
import TransitionLink from "../components/TransitionLink";

// MAPA DE REDES
const SOCIAL_ICONS = {
  instagram: FaInstagram,
  spotify: FaSpotify,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  twitter: FaTwitter,
  x: FaTwitter,
  soundcloud: FaSoundcloud,
  applemusic: FaApple,
  default: FaLink
};

const SafeImage = ({ src, className, alt = "" }) => {
  const [error, setError] = useState(false);
  if (error || !src) return null;
  return <img src={src} className={className} alt={alt} onError={() => setError(true)} loading="lazy" />;
};

export default function ArtistPage() {
  const artistsData = ARTISTS_DATA;
  const { id } = useParams();
  
  // Normalizador de slugs
  const norm = (s) => s?.toLowerCase().trim().replace(/\s+/g, "-");

  const currentIndex = useMemo(
    () => artistsData.findIndex((a) => (a.slug ?? norm(a.nombre)) === id),
    [artistsData, id]
  );

  const artist = artistsData[currentIndex];
  const nextArtist = artistsData.length > 0 
    ? artistsData[(currentIndex + 1) % artistsData.length] 
    : null;

  const artistShows = useMemo(() => {
    if (!artist) return [];
    return showsData
      .filter((s) => s.artist.toLowerCase() === artist.nombre.toLowerCase())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [artist]);

  const [activeIndex, setActiveIndex] = useState(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const heroRef = useRef(null);
  const bioRef = useRef(null);
  const lineRef = useRef(null);
  const videoRef = useRef(null);
  const bgRef = useRef(null);

  // FORCE PLAY VIDEO (Fix para móviles/safari)
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.play().catch(() => {});
    }
  }, [id, artist]);

  useGSAP(() => {
    if (!artist) return;

    let splitTitle;

    // 1. FONDO — fade cinemático desde negro
    if (bgRef.current) {
      gsap.fromTo(bgRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.6, ease: "power2.out" }
      );
    }

    // 2. TÍTULO — SplitText letra por letra
    if (titleRef.current) {
      splitTitle = new SplitText(titleRef.current, { type: "chars" });
      gsap.from(splitTitle.chars, {
        yPercent: 120, opacity: 0, duration: 1.2, ease: "power4.out", stagger: 0.03
      });
    }

    // 3. HERO ELEMENTS
    gsap.fromTo("[data-hero-anim]",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.35 }
    );

    // 4. LÍNEA DIVISORIA — scroll-driven
    if (lineRef.current) {
      gsap.set(lineRef.current, { scaleY: 0, transformOrigin: "top" });
      gsap.to(lineRef.current, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: bioRef.current, start: "top center", end: "bottom center", scrub: true }
      });
    }

    // 5. BIOGRAPHY PARAGRAPHS
    const fadeElements = gsap.utils.toArray(".fade-in-up");
    fadeElements.forEach((el) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 87%", once: true } }
      );
    });

    // 6. FOTOS — clip-path wipe editorial
    const photos = gsap.utils.toArray(".photo-reveal");
    photos.forEach((photo) => {
      gsap.fromTo(photo,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: photo, start: "top 90%", once: true } }
      );
    });

    // 7. CATÁLOGO — reveal orquestado
    const catalogItems = gsap.utils.toArray(".catalog-item-anim");
    catalogItems.forEach((item) => {
      const num = item.querySelector(".catalog-num");
      const title = item.querySelector(".catalog-title");
      const tl = gsap.timeline({
        scrollTrigger: { trigger: item, start: "top 93%", once: true }
      });
      if (num) tl.fromTo(num,
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 0);
      if (title) tl.fromTo(title,
        { x: -18, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.12);
    });

    // 8. NEXT ARTIST — clip-path reveal
    const nextText = containerRef.current?.querySelector(".next-artist-text");
    if (nextText) {
      gsap.fromTo(nextText,
        { clipPath: "inset(40% 0% 40% 0%)", opacity: 0 },
        { clipPath: "inset(0% 0% 0% 0%)", opacity: 1,
          duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: nextText, start: "top 85%", once: true } }
      );
    }

    return () => { splitTitle?.revert(); };
  }, { scope: containerRef, dependencies: [artist, id] });

  if (!artist) return <Navigate to="/" replace />;

  // === LÓGICA DE TAMAÑO DE TEXTO (FIX MOBILE) ===
  // Si el nombre es largo (> 8 letras), reducimos el tamaño en mobile para que no se corte.
  const isLongName = artist.nombre.length > 8;
  const titleSizeClass = isLongName
      ? "text-[12vw] md:text-[8rem] lg:text-[11rem]"  // Tamaño reducido para nombres largos
      : "text-[18vw] md:text-[9rem] lg:text-[13rem]"; // Tamaño original gigante

  // Datos del artista
  const video = artist.videoFondo;
  const sources = Array.isArray(video) ? video : [{ src: video, type: "video/mp4" }];
  const temas = (artist.proyectos ?? []).slice(0, 6);
  const paragraphs = artist.biografia ? artist.biografia.split('\n').filter(Boolean) : [];
  
  const sidePhotos = artist.fotos ? artist.fotos.slice(1, 4) : [];
  if(sidePhotos.length === 0 && artist.fotos?.[0]) sidePhotos.push(artist.fotos[0]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-transparent text-white selection:bg-secundario selection:text-black overflow-hidden">
      
      <SEO title={artist.nombre} description={paragraphs[0]} image={artist.fotos?.[0]} url={`/artistas/${id}`} type="profile" />

      {/* 1. FONDO FIXED */}
      <div ref={bgRef} className="fixed inset-0 z-0">
        
        {artist.videoFondo && (
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-100 mix-blend-lighten"
                autoPlay muted loop playsInline preload="metadata"
                key={artist.videoFondo}
            >
                {sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)}
            </video>
        )}

        {/* Gradientes de Lectura */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        <div className="noise-texture absolute inset-0 opacity-[0.06] z-10" />
      </div>

      <div className="relative z-20">
        
        {/* 2. HERO */}
        <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-4 md:px-6">

            {/* BACK TO ROSTER */}
            <TransitionLink
              to="/artistas"
              aria-label="Volver al roster"
              data-hero-anim
              className="absolute top-24 left-6 md:left-10 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-secundario transition-[color] duration-300 group z-10"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
              <span>Roster</span>
            </TransitionLink>

            {/* TÍTULO AJUSTADO */}
            <h1 
                ref={titleRef} 
                key={id} 
                className={`
                    ${titleSizeClass} 
                    leading-[0.9] 
                    font-bold 
                    tracking-tighter 
                    text-white 
                    mix-blend-overlay 
                    opacity-90
                    w-full 
                    break-words 
                    text-balance
                `}
            >
                {artist.nombre}
            </h1>
            
            <div className="mt-12 flex flex-col items-center gap-8" data-hero-anim>
                {/* ETIQUETA DE ROL */}
                <span className="
                    px-6 py-2 rounded-full
                    bg-black/40 border border-white/10
                    text-xs font-mono uppercase tracking-[0.3em] text-secundario
                    shadow-[0_0_20px_rgba(222,229,160,0.1)]
                    hover:bg-black/60 hover:scale-105 transition-[background-color,transform] duration-300
                ">
                    {artist.rol}
                </span>

                {/* SOCIAL DOCK */}
                <div className="flex flex-wrap justify-center mt-4 gap-3 sm:gap-4">
                {Object.entries(artist.redes || {}).map(([network, url]) => {
                    if (!url) return null;
                    const key = network.toLowerCase().replace(/\s/g, "");
                    const Icon = SOCIAL_ICONS[key] || SOCIAL_ICONS.default;

                    return (
                        <a
                            key={network}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-secundario hover:border-secundario hover:scale-110 transition-[background-color,border-color,transform] duration-300"
                            aria-label={`Seguir a ${artist.nombre} en ${network}`}
                        >
                            <Icon className="text-xl text-white group-hover:text-black transition-colors" />
                            <span className="absolute -top-8 text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-secundario pointer-events-none">
                                {network}
                            </span>
                        </a>
                    );
                })}
                </div>
            </div>
        </section>

        {/* 3. BIOGRAFÍA */}
        <section ref={bioRef} className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-20 md:py-32">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 lg:gap-24 relative">
                
                {/* LÍNEA DIVISORIA */}
                <div className="hidden md:block absolute top-0 bottom-0 left-[66%] w-px bg-white/5">
                    <div ref={lineRef} className="w-[1px] h-full bg-secundario shadow-[0_0_10px_rgba(222,229,160,0.5)]" />
                </div>

                {/* TEXTO */}
                <div className="md:col-span-8 flex flex-col gap-10 md:pr-12 lg:pr-16">
                    {paragraphs.map((text, i) => (
                        <div key={i} className="fade-in-up">
                            <p className={`text-xl md:text-2xl leading-relaxed font-normal text-white text-pretty drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]
                                ${i===0 ? "first-letter:text-5xl md:first-letter:text-7xl first-letter:font-serif first-letter:text-secundario first-letter:float-left first-letter:pr-3 md:first-letter:pr-4 first-letter:mt-[-4px] md:first-letter:mt-[-8px] first-letter:leading-none first-letter:drop-shadow-none" : ""}`}>
                                {text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* FOTOS LATERALES */}
                <div className="md:col-span-4 fade-in-up border-t border-white/5 pt-8 mt-4 md:border-t-0 md:pt-0 md:mt-0 md:pl-8 md:border-l md:border-white/5">
                    <div className="flex flex-col gap-12 md:sticky md:top-32">
                        {sidePhotos.map((photo, i) => (
                            <div key={i} className={`photo-reveal rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-black ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}>
                                <SafeImage src={photo} alt={`Foto de ${artist.nombre} ${i + 1}`} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>

        {/* 4. CATÁLOGO */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-40 pt-20">
            <div className="flex items-end justify-between mb-16 border-b border-white/20 pb-6 fade-in-up">
                <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-secundario">Catálogo Selecto</h2>
                <span className="text-xs font-mono text-white/30">[{temas.length}] RELEASES</span>
            </div>
            
            <ul className="space-y-4">
                {temas.map((t, i) => {
                    const Tag = t.spotify ? "a" : "div";
                    const tagProps = t.spotify
                        ? { href: t.spotify, target: "_blank", rel: "noopener noreferrer" }
                        : {};
                    return (
                    <li key={i} className="catalog-item-anim group relative border-b border-white/10 last:border-none" onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                        <Tag {...tagProps} className="block py-4 md:py-8 transition-transform duration-300 group-hover:translate-x-6 md:group-hover:translate-x-8">
                            <div className="flex items-center justify-between relative z-20">
                                <div className="flex items-baseline gap-8">
                                    <span className="catalog-num font-mono text-xs text-secundario/50 group-hover:text-secundario transition-colors duration-300">{(i + 1).toString().padStart(2, '0')}</span>
                                    <span className="catalog-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif italic text-white/90 group-hover:text-white transition-colors duration-300 drop-shadow-md">{t.nombre}</span>
                                </div>
                                {t.spotify && (
                                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-[opacity,transform] text-secundario group-hover:translate-x-0 -translate-x-2">
                                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="0,0 10,5 0,10"/></svg>
                                        Play
                                    </span>
                                )}
                            </div>
                            <div className={`hidden md:block absolute top-1/2 right-[20%] -translate-y-1/2 w-56 aspect-square rounded shadow-2xl pointer-events-none transition-[opacity,transform] duration-300 ${activeIndex === i ? "opacity-100 scale-100 rotate-6" : "opacity-0 scale-90 rotate-0"}`}>
                                <SafeImage src={t.imagen || artist.fotos?.[0]} alt={t.nombre} className="w-full h-full object-cover" />
                            </div>
                        </Tag>
                    </li>
                    );
                })}
            </ul>
        </section>

        {/* 5. SHOWS */}
        {artistShows.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 md:px-12 pb-20 pt-4 fade-in-up">
            <div className="flex items-end justify-between mb-10 border-b border-white/20 pb-6">
              <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-secundario">Shows</h2>
              <span className="text-xs font-mono text-white/30">[{artistShows.length}] FECHAS</span>
            </div>
            <ul className="space-y-0">
              {artistShows.map((show) => {
                const [y, m, d] = show.date.split("-");
                const dateStr = `${d}.${m}.${y}`;
                const isUpcoming = new Date(show.date) >= new Date();
                const Tag = show.ticketLink && isUpcoming ? "a" : "div";
                const tagProps = show.ticketLink && isUpcoming
                  ? { href: show.ticketLink, target: "_blank", rel: "noopener noreferrer" }
                  : {};
                return (
                  <li key={show.id} className="group border-b border-white/5 last:border-none">
                    <Tag {...tagProps} className="flex items-center justify-between py-4 md:py-5 gap-4 transition-[background-color] duration-200 hover:bg-white/[0.02] rounded-sm px-2 -mx-2">
                      <span className="font-mono text-[10px] text-white/30 tracking-widest shrink-0 w-24">{dateStr}</span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm text-white/80 group-hover:text-white transition-[color] duration-200 truncate">{show.venue}</span>
                        <span className="block text-[10px] font-mono text-white/30 mt-0.5">{show.city}, {show.country}</span>
                      </div>
                      {show.soldOut ? (
                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-white/20 border border-white/10 rounded-full px-2.5 py-1">Sold Out</span>
                      ) : isUpcoming && show.ticketLink ? (
                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-secundario border border-secundario/30 rounded-full px-2.5 py-1 group-hover:bg-secundario/10 transition-[background-color] duration-200">Entradas</span>
                      ) : null}
                    </Tag>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 6. NEXT ARTIST */}
        {nextArtist && (
          <section className="relative w-full min-h-[40svh] md:h-[80vh] flex items-center justify-center overflow-hidden group border-t border-white/10 bg-fondo z-20">
            <TransitionLink to={`/artistas/${nextArtist.slug ?? norm(nextArtist.nombre)}`} aria-label={`Ver ${nextArtist.nombre}`} className="absolute inset-0 z-30 block cursor-pointer" />
            <div className="absolute inset-0 -z-10">
                <SafeImage src={nextArtist.fotos?.[0] || "/assets/placeholder.jpg"} alt={nextArtist.nombre} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-[opacity,transform] duration-1000 group-hover:scale-[1.03] grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            <div className="text-center z-20 relative mix-blend-screen px-4">
                <p className="text-xs font-mono tracking-[0.3em] uppercase text-secundario mb-6 opacity-70 group-hover:opacity-100 transition-opacity">Siguiente Artista</p>
                <h2 className="next-artist-text text-7xl md:text-[8rem] lg:text-[12rem] font-serif italic text-white leading-none tracking-tighter group-hover:scale-105 transition-transform duration-700">{nextArtist.nombre}</h2>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}