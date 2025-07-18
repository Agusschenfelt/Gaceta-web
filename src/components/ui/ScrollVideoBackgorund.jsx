import { useRef, useEffect } from "react";

export default function ScrollVideoBackground({ children }) {
  const vidRef = useRef(null);

  useEffect(() => {
  const vid = vidRef.current;
  const handleScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    window.requestAnimationFrame(() => {
      vid.currentTime = ratio * vid.duration;
    });
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  return (
    <div className="relative min-h-screen overflow-hidden ">
      {/* Vídeo de fondo */}
      <video
        ref={vidRef}
        src="src/assets/ara-saltando.mov"
        muted
        playsInline
        preload="metadata"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/70 pointer-events-none" />  
      {/* Aquí va todo tu contenido encima */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}