import { createContext, useContext, useRef, useState, useLayoutEffect, useEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import gsap from "gsap";

const PageTransitionContext = createContext();

export const usePageTransition = () => useContext(PageTransitionContext);

// LABELS DEL SISTEMA
const SYSTEM_LABELS = ["HOME", "ROSTER", "SOBRE NOSOTROS", "GALLERY", "MERCH", "GACETA", "CONTACTO", "ARTISTAS"];

const ROUTE_MAP = {
  "/": "HOME",
  "/artistas": "ROSTER",
  "/sobre-nosotros": "SOBRE NOSOTROS",
  "/gallery": "GALLERY",
  "/shop": "MERCH",
};

// FORMATEADOR
const formatArtistName = (slug) => {
  if (!slug) return "";
  if (slug.toLowerCase() === "ara") return "ARA";
  if (slug.toLowerCase() === "mvp") return "MVP";
  return slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
};

const getLabelForPath = (pathname) => {
  if (pathname === "/") return ROUTE_MAP["/"];
  const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (ROUTE_MAP[path]) return ROUTE_MAP[path];
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    if (path.includes("/artistas/")) return formatArtistName(lastSegment);
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
  const loaderRef = useRef(null);
  
  // FIX CLAVE: Referencia para detectar el primer montaje
  const isFirstMount = useRef(true); 
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [isArtistStyle, setIsArtistStyle] = useState(false);

  const toggleBodyScroll = (lock) => {
    if (lock) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
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

  // 1. BACK / SWIPE / INITIAL LOAD (POP)
  useLayoutEffect(() => {
    // >>> LÓGICA ANTI-ANIMACIÓN INICIAL <<<
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Forzamos que esté oculto inmediatamente
      gsap.set(curtainRef.current, { display: "none", yPercent: 100 }); 
      toggleBodyScroll(false);
      return; // <--- CORTAMOS AQUÍ PARA QUE NO ANIME
    }

    if (navType === "POP") {
      const label = getLabelForPath(location.pathname);
      prepareStyle(label);
      toggleBodyScroll(true);

      const tl = gsap.timeline({
        onComplete: () => {
            toggleBodyScroll(false);
            gsap.set(curtainRef.current, { display: "none" });
        }
      });
      
      tl.set(curtainRef.current, { yPercent: 0, display: "flex" })
        .set(textRef.current, { yPercent: 0 }) 
        .set(loaderRef.current, { opacity: 1 })
        .to(curtainRef.current, { duration: 0.3 }) 
        .to(textRef.current, { yPercent: 100, duration: 0.8, ease: "power3.inOut" })
        .to(curtainRef.current, { yPercent: 100, duration: 1.0, ease: "expo.inOut" }, "-=0.6");
    }
  }, [location.pathname, navType]);


  // 2. NAVEGACIÓN MANUAL (PUSH) - Esto sigue igual
  const navigateWithTransition = (to, customLabel = null) => {
    if (isAnimating || location.pathname === to) return;
    setIsAnimating(true);
    toggleBodyScroll(true);

    const label = customLabel || getLabelForPath(to);
    prepareStyle(label);

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(to);
        animateOutPush();
        window.scrollTo(0, 0); 
        setTimeout(() => {
            window.scrollTo(0, 0); // Doble check por si acaso (Safari a veces es rebelde)
            animateOutPush();
        }, 10);
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
        toggleBodyScroll(false);
        gsap.set(curtainRef.current, { display: "none" });
      }
    });

    tl.to(textRef.current, { yPercent: -100, duration: 0.6, ease: "power2.in", delay: 0.1 })
      .to(curtainRef.current, { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, "-=0.3");
  };

  const goBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleBodyScroll(true);
    prepareStyle("GACETA"); 
    const tl = gsap.timeline({ onComplete: () => { navigate(-1); toggleBodyScroll(false); } });
    tl.set(curtainRef.current, { yPercent: -100, display: "flex" })
      .set(textRef.current, { yPercent: -100 }) 
      .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
      .to(textRef.current, { yPercent: 0, duration: 0.8, ease: "power4.out" }, "-=0.3");
  };

  useEffect(() => () => toggleBodyScroll(false), []);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, goBack, isAnimating }}>
      {children}
      
      <div 
        ref={curtainRef}
        // IMPORTANTE: className 'hidden' asegura que por CSS no se vea hasta que GSAP lo active
        className="fixed inset-0 z-[9999] bg-[#0a0a0a] hidden flex-col items-center justify-center pointer-events-none"
      >
        <div className="relative overflow-hidden px-4 py-2 text-center w-full flex justify-center">
            <h2 
                ref={textRef}
                className={`will-change-transform text-center leading-none ${isArtistStyle ? "font-sans font-bold text-white tracking-tighter text-[15vw] md:text-[13rem]" : "font-serif italic text-[#dee5a0] mix-blend-screen tracking-tight text-[15vw] md:text-[10vw]"}`}
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