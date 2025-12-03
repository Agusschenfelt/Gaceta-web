import { createContext, useContext, useRef, useState, useLayoutEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import gsap from "gsap";

const PageTransitionContext = createContext();

export const usePageTransition = () => useContext(PageTransitionContext);

// 1. PÁGINAS DEL SISTEMA (Usarán estilo Editorial: Serif + Amarillo)
const SYSTEM_LABELS = ["HOME", "ROSTER", "SOBRE NOSOTROS", "GALLERY", "MERCH", "GACETA", "CONTACTO", "GALLERY", "ARTISTAS"];

const ROUTE_MAP = {
  "/": "HOME",
  "/artistas": "ROSTER",
  "/sobre-nosotros": "SOBRE NOSOTROS",
  "/gallery": "GALLERY",
  "/shop": "MERCH",
};

// 2. FORMATEADOR DE NOMBRES (Para que coincida con el Header del Artista)
const formatArtistName = (slug) => {
  if (!slug) return "";
  
  // A) EXCEPCIONES (Siglas o nombres especiales)
  if (slug.toLowerCase() === "ara") return "ARA";
  if (slug.toLowerCase() === "mvp") return "MVP";
  
  // B) STANDARD (Title Case: "tadu-vazquez" -> "Tadu Vazquez")
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getLabelForPath = (pathname) => {
  if (pathname === "/") return ROUTE_MAP["/"];

  // Limpieza básica
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  
  // Si es ruta exacta del sistema
  if (ROUTE_MAP[path]) return ROUTE_MAP[path];

  // Si es ruta profunda (ej: /artistas/valuto)
  const segments = path.split("/").filter(Boolean);
  
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    
    // Si estamos dentro de artistas, formateamos el nombre bonito
    if (path.includes("/artistas/")) {
        return formatArtistName(lastSegment);
    }
    
    // Fallback genérico
    return lastSegment.replace(/-/g, " ").toUpperCase();
  }

  return "GACETA";
};

export default function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  
  const curtainRef = useRef(null);
  const textRef = useRef(null);
  const textWrapperRef = useRef(null);
  const loaderRef = useRef(null);
  
  const isFirstMount = useRef(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // ESTADOS VISUALES
  const [transitionText, setTransitionText] = useState("");
  const [isArtistStyle, setIsArtistStyle] = useState(false);

  // Helper para configurar el estilo antes de animar
  const prepareStyle = (label) => {
    setTransitionText(label);
    // Si el label NO está en la lista de sistema, es un Artista (o página desconocida)
    // SYSTEM_LABELS debe estar en mayúsculas para comparar, pero el label visual puede ser "Valuto"
    const isSystem = SYSTEM_LABELS.includes(label.toUpperCase());
    setIsArtistStyle(!isSystem);
  };

  // 1. BACK / SWIPE (POP)
  useLayoutEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }

    if (navType === "POP") {
      const label = getLabelForPath(location.pathname);
      prepareStyle(label);

      const tl = gsap.timeline();
      
      tl.set(curtainRef.current, { yPercent: 0, display: "flex" })
        .set(textRef.current, { yPercent: 0 }) 
        .set(loaderRef.current, { opacity: 1 })
        
        // Pausa de lectura
        .to(curtainRef.current, { duration: 0.3 }) 

        // Texto se esconde
        .to(textRef.current, { yPercent: 100, duration: 0.8, ease: "power3.inOut" })
        
        // Cortina baja
        .to(curtainRef.current, { yPercent: 100, duration: 1.0, ease: "expo.inOut" }, "-=0.6")
        .set(curtainRef.current, { display: "none" });
    }
  }, [location.pathname, navType]);


  // 2. NAVEGACIÓN MANUAL (PUSH)
  const navigateWithTransition = (to, customLabel = null) => {
    if (isAnimating || location.pathname === to) return;
    setIsAnimating(true);

    const label = customLabel || getLabelForPath(to);
    prepareStyle(label);

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(to);
        animateOutPush();
      }
    });

    // SETUP
    tl.set(curtainRef.current, { yPercent: 100, display: "flex" })
      .set(textRef.current, { yPercent: 100 }) // Empieza abajo
      .set(loaderRef.current, { opacity: 0 })

      // 1. Cortina sube
      .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
      
      // 2. Texto sube (Reveal)
      .to(textRef.current, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.3")
      .to(loaderRef.current, { opacity: 1, duration: 0.3 }, "<");
  };

  const animateOutPush = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        gsap.set(curtainRef.current, { display: "none" });
      }
    });

    tl.to(textRef.current, { yPercent: -100, duration: 0.6, ease: "power2.in", delay: 0.1 })
      .to(curtainRef.current, { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, "-=0.3");
  };

  const goBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Back manual -> Asumimos GACETA neutral
    prepareStyle("GACETA"); 

    const tl = gsap.timeline({ onComplete: () => navigate(-1) });
    tl.set(curtainRef.current, { yPercent: -100, display: "flex" })
      .set(textRef.current, { yPercent: -100 }) 
      .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
      .to(textRef.current, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.3");
  };

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, goBack, isAnimating }}>
      {children}
      
      <div 
        ref={curtainRef}
        className="fixed inset-0 z-[9999] bg-[#0a0a0a] hidden flex-col items-center justify-center pointer-events-none"
      >
        <div ref={textWrapperRef} className="relative overflow-hidden px-4 py-2 text-center w-full flex justify-center">
            
            {/* === AQUÍ OCURRE EL CAMBIO VISUAL === */}
            <h2 
                ref={textRef}
                className={`
                    will-change-transform text-center leading-none
                    ${isArtistStyle 
                        // ESTILO ARTISTA: Sans-Serif, Bold, Blanco (Casi igual al header real)
                        ? "font-sans font-bold text-white tracking-tighter text-[15vw] md:text-[13rem]" 
                        
                        // ESTILO GACETA: Serif, Italic, Amarillo
                        : "font-serif italic text-[#dee5a0] mix-blend-screen tracking-tight text-[15vw] md:text-[10vw]"
                    }
                `}
            >
                {transitionText}
            </h2>

        </div>

        {/* El Loader pequeño también cambia de color para hacer juego */}
        <div ref={loaderRef} className="absolute bottom-10 right-10 flex items-center gap-3 opacity-0">
             <div className={`w-2 h-2 animate-pulse rounded-full ${isArtistStyle ? 'bg-white' : 'bg-[#dee5a0]'}`} />
             <span className={`font-mono text-xs uppercase tracking-widest ${isArtistStyle ? 'text-white/50' : 'text-[#dee5a0]/50'}`}>
                {isArtistStyle ? 'Loading Artist' : 'Loading System'}
             </span>
        </div>

      </div>
    </PageTransitionContext.Provider>
  );
}