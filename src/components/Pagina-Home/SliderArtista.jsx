// SliderArtista.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function SliderArtista({ slug, nombre, rol, imgSrc, videoSrc }) {
  const videoRef = useRef(null);
  const [hover, setHover] = useState(false);

  const handleEnter = () => {
    setHover(true);
    const v = videoRef.current;
    if (!v) return;
    try { v.currentTime = 0; v.play(); } catch {}
  };

  const handleLeave = () => {
    setHover(false);
    const v = videoRef.current;
    if (!v) return;
    try { v.pause(); } catch {}
  };

  return (
    <article
      data-artist-card
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
      className="
        group relative shrink-0
        w-[75vw] sm:w-[45vw] md:w-[32vw] lg:w-[25vw] xl:w-[20vw]
        h-[60vw] sm:h-[40vw] md:h-[34vw] lg:h-[28vw] xl:h-[24vw]
        rounded-3xl overflow-hidden
        transition-transform duration-400 will-change-transform
        hover:scale-[1.04]
      "
    >
      {/* HALO sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 rounded-[30px] opacity-0
                   group-hover:opacity-60 blur-2xl transition-opacity duration-300
                   bg-[radial-gradient(60%_60%_at_50%_70%,rgba(132,94,247,0.25),transparent_65%)]" />

      <Link to={`/${slug}`} className="block w-full h-full relative">
        {/* VIDEO */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* IMG */}
        <img
          src={imgSrc}
          alt={`Preview de ${nombre}`}
          draggable="false"
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-250 ${
            hover ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Gradiente + texto SOLO en hover */}
        <div
          className={`absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-black/25 to-black/80 transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute left-5 right-5 bottom-5 z-10 text-white transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="block text-[11px] font-medium uppercase opacity-80">{rol}</span>
          <h3 className="text-2xl font-semibold tracking-tight">{nombre}</h3>
        </div>
      </Link>
    </article>
  );
}
