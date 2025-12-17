import { useRef, useLayoutEffect, useMemo, useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
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

gsap.registerPlugin(ScrollTrigger);

const SafeImage = ({ src, className }) => {
  const [error, setError] = useState(false);
  if (error || !src) return null; 
  return <img src={src} className={className} alt="" onError={() => setError(true)} loading="lazy" />;
};

export default function ArtistPage({ artistsData = [] }) {
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

  const [activeIndex, setActiveIndex] = useState(null);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const heroRef = useRef(null);
  const bioRef = useRef(null); 
  const lineRef = useRef(null); 
  const videoRef = useRef(null);

  // FORCE PLAY VIDEO (Fix para móviles/safari)
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.play().catch(e => console.log("Autoplay prevented", e));
    }
  }, [id, artist]);

  useLayoutEffect(() => {
    if (!artist) return;
    
    let splitTitle;
    const ctx = gsap.context(() => {
      
      // Animación del Título
      if (titleRef.current) {
        // Usamos chars para animación letra por letra
        splitTitle = new SplitType(titleRef.current, { types: "chars" });
        gsap.from(splitTitle.chars, {
          yPercent: 120, opacity: 0, duration: 1.2, ease: "power4.out", stagger: 0.03
        });
      }

      // Animación elementos del Hero
      gsap.fromTo("[data-hero-anim]",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.1, delay: 0.5 }
      );

      // Línea divisoria vertical
      if (lineRef.current) {
        gsap.fromTo(lineRef.current, 
            { height: "0%" },
            { 
              height: "100%", 
              ease: "none", 
              scrollTrigger: {
                trigger: bioRef.current,
                start: "top center",
                end: "bottom center",
                scrub: true
              }
            }
        );
      }

      // Elementos Fade In generales
      const fadeElements = gsap.utils.toArray(".fade-in-up");
      fadeElements.forEach((el) => {
        gsap.fromTo(el, 
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } }
        );
      });

    }, containerRef);

    return () => { ctx.revert(); splitTitle?.revert(); };
  }, [artist, id]);

  if (!artist) return <Navigate to="/" replace />;

  // === LÓGICA DE TAMAÑO DE TEXTO (FIX MOBILE) ===
  // Si el nombre es largo (> 8 letras), reducimos el tamaño en mobile para que no se corte.
  const isLongName = artist.nombre.length > 8;
  const titleSizeClass = isLongName 
      ? "text-[12vw] md:text-[11rem]"  // Tamaño reducido para nombres largos
      : "text-[18vw] md:text-[13rem]"; // Tamaño original gigante

  // Datos del artista
  const video = artist.videoFondo;
  const sources = Array.isArray(video) ? video : [{ src: video, type: "video/mp4" }];
  const temas = (artist.proyectos ?? []).slice(0, 6);
  const paragraphs = artist.biografia ? artist.biografia.split('\n').filter(Boolean) : [];
  
  const sidePhotos = artist.fotos ? artist.fotos.slice(1, 4) : [];
  if(sidePhotos.length === 0 && artist.fotos?.[0]) sidePhotos.push(artist.fotos[0]);

  return (
    <main ref={containerRef} className="relative w-full min-h-screen bg-transparent text-white selection:bg-[#dee5a0] selection:text-black overflow-hidden">
      
      <SEO title={artist.nombre} description={paragraphs[0]} image={artist.fotos?.[0]} url={`/artistas/${id}`} type="profile" />

      {/* 1. FONDO FIXED */}
      <div className="fixed inset-0 z-0">
        
        {artist.videoFondo && (
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover opacity-100 mix-blend-lighten"
                autoPlay muted loop playsInline
                key={artist.videoFondo}
            >
                {sources.map((s, i) => <source key={i} src={s.src} type={s.type} />)}
            </video>
        )}

        {/* Gradientes de Lectura */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10" />
      </div>

      <div className="relative z-20">
        
        {/* 2. HERO */}
        <section ref={heroRef} className="min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6">
            
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
                    bg-white/5 border border-white/10 backdrop-blur-md 
                    text-xs font-mono uppercase tracking-[0.3em] text-[#dee5a0] 
                    shadow-[0_0_20px_rgba(222,229,160,0.1)]
                    hover:bg-white/10 hover:scale-105 transition-all duration-300
                ">
                    {artist.rol}
                </span>

                {/* SOCIAL DOCK */}
                <div className="flex flex-wrap justify-center mt-4 gap-4">
                {Object.entries(artist.redes || {}).map(([network, url]) => {
                    if (!url) return null;
                    const key = network.toLowerCase().replace(/\s/g, "");
                    const Icon = SOCIAL_ICONS[key] || SOCIAL_ICONS.default;

                    return (
                        <a 
                            key={network} 
                            href={url} 
                            target="_blank" 
                            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 hover:bg-[#dee5a0] hover:border-[#dee5a0] hover:scale-110 transition-all duration-300"
                            aria-label={network}
                        >
                            <Icon className="text-xl text-white group-hover:text-black transition-colors" />
                            <span className="absolute -top-8 text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-[#dee5a0] pointer-events-none">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
                
                {/* LÍNEA DIVISORIA */}
                <div className="hidden lg:block absolute top-0 bottom-0 left-[66%] w-px bg-white/5">
                    <div ref={lineRef} className="w-[1px] bg-[#dee5a0] shadow-[0_0_10px_#dee5a0]" style={{ height: '0%' }} />
                </div>

                {/* TEXTO */}
                <div className="lg:col-span-8 flex flex-col gap-10 lg:pr-16">
                    {paragraphs.map((text, i) => (
                        <div key={i} className="fade-in-up">
                            <p className={`text-xl md:text-2xl leading-relaxed font-normal text-white text-pretty drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]
                                ${i===0 ? "first-letter:text-7xl first-letter:font-serif first-letter:text-[#dee5a0] first-letter:float-left first-letter:pr-4 first-letter:mt-[-8px] first-letter:leading-none first-letter:drop-shadow-none" : ""}`}>
                                {text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* FOTOS LATERALES */}
                <div className="lg:col-span-4 fade-in-up pl-8 border-l border-white/5 lg:border-none">
                    <div className="flex flex-col gap-12 lg:sticky lg:top-32">
                        {sidePhotos.map((photo, i) => (
                            <div key={i} className={`rounded-sm overflow-hidden border border-white/20 shadow-2xl bg-black ${i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}>
                                <SafeImage src={photo} className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>

        {/* 4. CATÁLOGO */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 pb-40 pt-20">
            <div className="flex items-end justify-between mb-16 border-b border-white/20 pb-6 fade-in-up">
                <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-[#dee5a0]">Catálogo Selecto</h2>
                <span className="text-xs font-mono text-white/30">[{temas.length}] RELEASES</span>
            </div>
            
            <ul className="space-y-4">
                {temas.map((t, i) => (
                    <li key={i} className="fade-in-up group relative border-b border-white/10 last:border-none" onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}>
                        <a href={t.spotify || "#"} target="_blank" className="block py-8 transition-all duration-300 group-hover:pl-8">
                            <div className="flex items-center justify-between relative z-20">
                                <div className="flex items-baseline gap-8">
                                    <span className="font-mono text-xs text-[#dee5a0]/50">{(i + 1).toString().padStart(2, '0')}</span>
                                    <span className="text-4xl md:text-6xl font-serif italic text-white/90 group-hover:text-white transition-colors duration-300 drop-shadow-md">{t.nombre}</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all text-[#dee5a0]">Play</span>
                            </div>
                            <div className={`hidden md:block absolute top-1/2 right-[20%] -translate-y-1/2 w-56 aspect-square rounded shadow-2xl pointer-events-none transition-all duration-300 ${activeIndex === i ? "opacity-100 scale-100 rotate-6" : "opacity-0 scale-90 rotate-0"}`}>
                                <SafeImage src={t.imagen || artist.fotos?.[0]} className="w-full h-full object-cover" />
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </section>

        {/* 5. NEXT ARTIST */}
        {nextArtist && (
          <section className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden group border-t border-white/10 bg-[#050505] z-20">
            <TransitionLink to={`/artistas/${nextArtist.slug ?? norm(nextArtist.nombre)}`} className="absolute inset-0 z-30 block cursor-pointer" />
            <div className="absolute inset-0 -z-10">
                <SafeImage src={nextArtist.fotos?.[0] || "/assets/placeholder.jpg"} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all duration-1000 group-hover:scale-[1.03] grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            <div className="text-center z-20 relative mix-blend-screen px-4">
                <p className="text-xs font-mono tracking-[0.3em] uppercase text-[#dee5a0] mb-6 opacity-70 group-hover:opacity-100 transition-opacity">Siguiente Artista</p>
                <h2 className="text-7xl md:text-[12rem] font-serif italic text-white leading-none tracking-tighter group-hover:scale-105 transition-transform duration-700">{nextArtist.nombre}</h2>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}