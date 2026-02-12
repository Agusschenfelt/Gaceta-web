import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // IMPORTANTE: Solo reseteamos al top (0,0) si NO hay un hash en la URL.
    // Si la URL es "/#shows", no tocamos nada y dejamos que ScrollToAnchor se encargue.
    if (!window.location.hash) {
      window.scrollTo(0, 0);
      
      // Forzar recalculo de GSAP para evitar bugs visuales
      requestAnimationFrame(() => {
         try { ScrollTrigger.refresh(); } catch {}
      });
    }
  }, [pathname]);

  return null;
}