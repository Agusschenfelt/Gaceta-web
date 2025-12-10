import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

export default function ScrollToAnchor() {
  const location = useLocation();
  const lastHash = useRef('');

  useEffect(() => {
    if (location.hash) {
      lastHash.current = location.hash.slice(1); // Guardamos "shows" sin el #
    }

    // Si hay un hash activo y acabamos de navegar...
    if (lastHash.current && location.hash) {
      const elementId = lastHash.current;

      // === CONFIGURACIÓN DE TIEMPOS ===
      // Tu transición de salida dura aprox 1.6s (texto + cortina).
      // Esperamos 1.8s para estar seguros de que el 'overflow: hidden' se quitó.
      const INITIAL_DELAY = 1800; 

      const attemptScroll = () => {
        const element = document.getElementById(elementId);
        
        if (element) {
          // Intentamos el scroll con GSAP para máxima suavidad
          gsap.to(window, {
            duration: 1.2,
            scrollTo: { 
                y: element, 
                offsetY: 80, // Ajuste para que el Navbar no tape el título
                autoKill: false // Evita que el usuario cancele el scroll accidentalmente
            },
            ease: "power3.inOut"
          });
          return true; // Éxito
        }
        return false; // Fallo (el elemento aún no está en el DOM)
      };

      // 1. Primer intento retardado (esperando a que la cortina suba)
      const timer = setTimeout(() => {
        const success = attemptScroll();
        
        // 2. Si falla (por lazy loading o retraso de render), reintentamos cada 100ms
        if (!success) {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (attemptScroll() || attempts > 20) { // Máximo 2 segundos extra de intentos
                    clearInterval(interval);
                }
            }, 100);
        }
      }, INITIAL_DELAY);

      return () => clearTimeout(timer);
    }
  }, [location]); // Se ejecuta cada vez que cambia la ruta o el hash

  return null;
}