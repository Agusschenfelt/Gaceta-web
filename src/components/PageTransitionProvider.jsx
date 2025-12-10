import { createContext, useContext, useRef, useState, useLayoutEffect, useEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import gsap from "gsap";

const PageTransitionContext = createContext();

export const usePageTransition = () => useContext(PageTransitionContext);

// 1. PÁGINAS DEL SISTEMA (Estilo Editorial)
const SYSTEM_LABELS = ["HOME", "ROSTER", "SOBRE NOSOTROS", "GALLERY", "MERCH", "GACETA", "CONTACTO", "ARTISTAS"];

const ROUTE_MAP = {
  "/": "HOME",
  "/artistas": "ROSTER",
  "/sobre-nosotros": "SOBRE NOSOTROS",
  "/gallery": "GALLERY",
  "/shop": "MERCH",
};

// 2. FORMATEADOR DE NOMBRES
const formatArtistName = (slug) => {
  if (!slug) return "";
  if (slug.toLowerCase() === "ara") return "ARA";
  if (slug.toLowerCase() === "mvp") return "MVP";
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getLabelForPath = (pathname) => {
  if (pathname === "/") return ROUTE_MAP["/"];
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  
  if (ROUTE_MAP[path]) return ROUTE_MAP[path];

  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    if (path.includes("/artistas/")) {
        return formatArtistName(lastSegment);
    }
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
  const [transitionText, setTransitionText] = useState("");
  const [isArtistStyle, setIsArtistStyle] = useState(false);

  // === HELPER: BLOQUEO DE SCROLL ===
  // Evita que el usuario scrollee mientras la cortina está activa
  const toggleBodyScroll = (lock) => {
    if (lock) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh"; // Previene saltos en móviles
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
  };

  const prepareStyle = (label) => {
    setTransitionText(label);
    const isSystem = SYSTEM_LABELS.includes(label.toUpperCase());
    setIsArtistStyle(!isSystem);
  };

  // 1. BACK / SWIPE (POP)
  useLayoutEffect(() => {
    // FIX: FIRST LOAD
    // Si es el primer montaje, marcamos flag, aseguramos scroll desbloqueado y salimos.
    if (isFirstMount.current) {
      isFirstMount.current = false;
      gsap.set(curtainRef.current, { display: "none" }); // Asegura que esté oculto
      toggleBodyScroll(false);
      return;
    }

    if (navType === "POP") {
      const label = getLabelForPath(location.pathname);
      prepareStyle(label);
      
      // Bloqueamos scroll al iniciar la transición POP
      toggleBodyScroll(true);

      const tl = gsap.timeline({
        onComplete: () => {
            toggleBodyScroll(false); // Liberamos al terminar
            gsap.set(curtainRef.current, { display: "none" });
        }
      });
      
      tl.set(curtainRef.current, { yPercent: 0, display: "flex" })
        .set(textRef.current, { yPercent: 0 }) 
        .set(loaderRef.current, { opacity: 1 })
        
        .to(curtainRef.current, { duration: 0.3 }) // Pausa breve
        .to(textRef.current, { yPercent: 100, duration: 0.8, ease: "power3.inOut" })
        .to(curtainRef.current, { yPercent: 100, duration: 1.0, ease: "expo.inOut" }, "-=0.6");
    }
  }, [location.pathname, navType]);


  // 2. NAVEGACIÓN MANUAL (PUSH)
  const navigateWithTransition = (to, customLabel = null) => {
    if (isAnimating || location.pathname === to) return;
    setIsAnimating(true);
    toggleBodyScroll(true); // LOCK

    const label = customLabel || getLabelForPath(to);
    prepareStyle(label);

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(to);
        animateOutPush();
      }
    });

    tl.set(curtainRef.current, { yPercent: 100, display: "flex" })
      .set(textRef.current, { yPercent: 100 })
      .set(loaderRef.current, { opacity: 0 })
      
      .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
      .to(textRef.current, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.3")
      .to(loaderRef.current, { opacity: 1, duration: 0.3 }, "<");
  };

  const animateOutPush = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        toggleBodyScroll(false); // UNLOCK
        gsap.set(curtainRef.current, { display: "none" });
      }
    });

    tl.to(textRef.current, { yPercent: -100, duration: 0.6, ease: "power2.in", delay: 0.1 })
      .to(curtainRef.current, { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, "-=0.3");
  };

  // 3. BACK MANUAL
  const goBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleBodyScroll(true); // LOCK
    
    prepareStyle("GACETA"); 

    const tl = gsap.timeline({ 
        onComplete: () => {
            navigate(-1);
            // El useEffect de POP se encargará de la animación de entrada
            // pero por seguridad liberamos scroll aquí momentáneamente
            // aunque el POP lo volverá a bloquear casi instantáneamente.
            toggleBodyScroll(false); 
        } 
    });

    tl.set(curtainRef.current, { yPercent: -100, display: "flex" })
      .set(textRef.current, { yPercent: -100 }) 
      .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
      .to(textRef.current, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.3");
  };

  // Limpieza de seguridad al desmontar
  useEffect(() => {
    return () => toggleBodyScroll(false);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, goBack, isAnimating }}>
      {children}
      
      <div 
        ref={curtainRef}
        // Agregamos 'hidden' explícitamente y nos aseguramos que empiece oculto
        className="fixed inset-0 z-[9999] bg-[#0a0a0a] hidden flex-col items-center justify-center pointer-events-none"
      >
        <div ref={textWrapperRef} className="relative overflow-hidden px-4 py-2 text-center w-full flex justify-center">
            
            <h2 
                ref={textRef}
                className={`
                    will-change-transform text-center leading-none
                    ${isArtistStyle 
                        ? "font-sans font-bold text-white tracking-tighter text-[15vw] md:text-[13rem]" 
                        : "font-serif italic text-[#dee5a0] mix-blend-screen tracking-tight text-[15vw] md:text-[10vw]"
                    }
                `}
            >
                {transitionText}
            </h2>

        </div>

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