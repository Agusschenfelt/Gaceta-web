import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function ArtistCardHover({ artist }) {
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const [isMobile, setIsMobile] = useState(true); // Empezamos asumiendo móvil por seguridad

  const norm = (s) => s?.toLowerCase().trim().replace(/\s+/g, '-') || 'artista';
  const slug = artist.slug ?? norm(artist.nombre);

  // Detección de dispositivo para optimización
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    checkMobile(); // Chequeo inicial
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    // En desktop, reproducimos video y mostramos texto
    videoRef.current?.play().catch(() => {});
    gsap.to(contentRef.current, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    // En desktop, pausamos video y ocultamos texto
    videoRef.current?.pause();
    gsap.to(contentRef.current, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.in' });
  };

  return (
    <Link
      to={`artistas/${slug}`}
      className="group relative block w-full aspect-[3/4] overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-white/5 transition-all duration-500 hover:ring-[#dee5a0]/30 hover:shadow-2xl hover:-translate-y-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. IMAGEN BASE (B&N -> Color) */}
      <img
        src={artist.foto}
        alt={artist.nombre}
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter grayscale group-hover:grayscale-0 opacity-90 group-hover:opacity-100"
        loading="lazy"
        decoding="async"
      />

      {/* 2. VIDEO (Solo Desktop, carga al hover) */}
      {!isMobile && artist.video && (
        <video
          ref={videoRef}
          src={artist.video}
          loop
          muted
          playsInline
          preload="none" // CLAVE PARA PERFORMANCE: No carga hasta que pasas el mouse
          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
      )}

      {/* 3. GRADIENTE PARA LEER TEXTO */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 ${isMobile ? 'opacity-80' : 'opacity-60 group-hover:opacity-90'}`} />

      {/* 4. CONTENIDO (Nombre) */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
        {/* En móvil siempre visible, en desktop aparece al hover */}
        <div 
            ref={contentRef}
            className={`transition-all duration-200 ${isMobile ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'}`}
        >
            {/* Línea decorativa */}
            <div className={`h-1 w-8 bg-[#dee5a0] mb-3 transition-all duration-500 ${!isMobile && 'w-0 group-hover:w-16'}`} />
            
            <h3 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider leading-none">
            {artist.nombre}
            </h3>
            
            {!isMobile && (
                <span className="inline-block mt-3 text-xs text-[#dee5a0] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                    Ver Perfil →
                </span>
            )}
        </div>
      </div>
    </Link>
  );
}