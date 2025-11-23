// ScrollToTopOnRouteChange.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollToTopOnRouteChange() {
  const location = useLocation();
  const { pathname, hash } = location;

  const scrollToY = (y) => {
    // Si usás Lenis a nivel global, lo aprovechamos
    if (typeof window !== "undefined" && window.lenis && typeof window.lenis.scrollTo === "function") {
      window.lenis.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    }
  };

  // 1) Cambio de página (pathname) sin hash => subir al top
  useEffect(() => {
    // Si la ruta nueva NO tiene hash, se considera "página nueva normal"
    if (!hash) {
      scrollToY(0);

      requestAnimationFrame(() => {
        try {
          ScrollTrigger.refresh();
        } catch {}
      });
    }
  }, [pathname]); // sólo cuando cambia la ruta base

  // 2) Cambio de hash (#artistas, #shows, etc.) => ir a la sección
  useEffect(() => {
    if (!hash) return;

    const id = hash.replace("#", "");

    const scrollToTarget = () => {
      const el = document.getElementById(id);
      if (!el) return false;

      el.scrollIntoView({ behavior: "auto", block: "start" });

      requestAnimationFrame(() => {
        try {
          ScrollTrigger.refresh();
        } catch {}
      });

      return true;
    };

    let attempts = 0;
    const maxAttempts = 8;

    const interval = window.setInterval(() => {
      attempts += 1;
      const done = scrollToTarget();
      if (done || attempts >= maxAttempts) {
        window.clearInterval(interval);
      }
    }, 160); // ~1.2s de reintentos en total

    return () => window.clearInterval(interval);
  }, [hash, pathname]);

  return null;
}
