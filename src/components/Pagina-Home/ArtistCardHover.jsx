import { useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function ArtistCardHover({ slug, nombre, rol, imgSrc, videoSrc }) {
  const videoRef = useRef(null);
  const [hover, setHover] = useState(false);

  const handleEnter = () => {
    setHover(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };
  const handleLeave = () => {
    setHover(false);
    videoRef.current?.pause();
  };

  return (
    <article
      data-artist-card
      className="
        relative shrink-0 snap-start
        w-[48vw] sm:w-[36vw] md:w-[25vw] lg:w-[20vw] xl:w-[17.5vw]
        h-[68vw] sm:h-[48vw] md:h-[33vw] lg:h-[27vw] xl:h-[23vw]
        rounded-2xl overflow-hidden transition-transform duration-400
        hover:scale-[1.04]
        [contain:content]
      "
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
    >
      <Link to={`/${slug}`} className="block w-full h-full relative">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="none"
        />
        <img
          src={imgSrc}
          alt={`Preview de ${nombre}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-250 ${
            hover ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          decoding="async"
          draggable="false"
          fetchpriority="low"
        />

        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent md:to-black/70 to-black/80 transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute bottom-4 left-4 right-4 z-10 text-white transition-opacity duration-250 ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="block text-[11px] font-medium uppercase opacity-80">
            {rol}
          </span>
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
            {nombre}
          </h3>
        </div>
      </Link>
    </article>
  );
}
