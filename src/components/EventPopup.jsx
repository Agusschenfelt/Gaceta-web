import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react"; 
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Variable global de sesión: se reinicia al recargar la página (F5)
let hasSeenPopupSession = false;

export default function EventPopup() {
  const [shouldRender, setShouldRender] = useState(false);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Solo mostramos en Home ('/') si no se ha visto en esta sesión
    const isHome = location.pathname === "/";
    if (isHome && !hasSeenPopupSession) {
      // Delay de 1s para que no aparezca de golpe
      const timer = setTimeout(() => setShouldRender(true), 1000); 
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleClose = () => {
    hasSeenPopupSession = true; // Marcar como visto
    
    if (overlayRef.current && contentRef.current) {
        const tl = gsap.timeline({
            onComplete: () => setShouldRender(false)
        });
        tl.to(contentRef.current, { y: -20, opacity: 0, duration: 0.3, ease: "power2.in" })
          .to(overlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2");
    } else {
        setShouldRender(false);
    }
  };

  useGSAP(() => {
    if (shouldRender && overlayRef.current && contentRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })
        .fromTo(contentRef.current, { scale: 0.8, opacity: 0, rotationX: 10 }, { scale: 1, opacity: 1, rotationX: 0, duration: 0.8, ease: "elastic.out(1, 0.75)" }, "-=0.4");
    }
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md" onClick={handleClose}>
      <div ref={contentRef} className="relative w-full max-w-[420px] bg-black rounded-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-3 right-3 z-20 group p-2 rounded-full bg-black/10 hover:bg-black/80 backdrop-blur-sm transition-all duration-300 border border-black/5 hover:border-white/20">
             <X className="w-5 h-5 text-black group-hover:text-white transition-colors" />
        </button>
        <div className="relative aspect-[4/5] w-full bg-[#f0f0f0]">
            <img src="/assets/gacetazo.png" alt="Show Gratis" className="w-full h-full object-cover" draggable="false" />
            <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-lg" />
        </div>
        <div onClick={handleClose} className="w-full bg-[#0e0e0f] py-3 text-center cursor-pointer hover:bg-[#1a1a1a] transition-colors border-t border-white/10 group">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 group-hover:text-[#dee5a0] transition-colors">Cerrar e ir al sitio</span>
        </div>
      </div>
    </div>
  );
}