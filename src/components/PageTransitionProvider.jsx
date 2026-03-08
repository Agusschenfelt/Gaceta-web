import { createContext, useContext, useRef, useState, useLayoutEffect, useEffect } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import gsap from "gsap";

const PageTransitionContext = createContext();

export const usePageTransition = () => useContext(PageTransitionContext);

const SYSTEM_LABELS = ["HOME", "ROSTER", "SOBRE NOSOTROS", "GALLERY", "MERCH", "GACETA", "CONTACTO", "ARTISTAS"];

const ROUTE_MAP = {
  "/": "HOME",
  "/artistas": "ROSTER",
  "/sobre-nosotros": "SOBRE NOSOTROS",
  "/gallery": "GALLERY",
  "/shop": "MERCH",
};

const formatArtistName = (slug) => {
  if (!slug) return "";
  // Excepciones de mayúsculas
  if (slug.toLowerCase() === "ara") return "ARA";
  if (slug.toLowerCase() === "mvp") return "MVP"; // Por si acaso

  return slug
    // 1. Reemplazamos guiones bajos Y medios por espacios
    .replace(/[_]/g, " ") 
    .replace(/[-]/g, " ")
    // 2. Dividimos por espacio
    .split(" ")
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
  const goldRef = useRef(null);
  const textRef = useRef(null);
  const loaderRef = useRef(null);
  
  const isFirstMount = useRef(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [isArtistStyle, setIsArtistStyle] = useState(false);

  // === FIX SCROLL 1: Desactivar memoria del navegador ===
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

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



  // 1. BACK / SWIPE (POP)
  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      gsap.set(curtainRef.current, { display: "none" }); 
      toggleBodyScroll(false);
      return;
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


  // 2. NAVEGACIÓN MANUAL (PUSH)
  const navigateWithTransition = (to, customLabel = null) => {
    if (isAnimating || location.pathname === to) return;
    setIsAnimating(true);
    toggleBodyScroll(true);

    const label = customLabel || getLabelForPath(to);
    prepareStyle(label);

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(to);
        window.scrollTo(0, 0); 
        animateOutPush();
      }
    });

    // START STATE
    gsap.set(curtainRef.current, { yPercent: 100, display: "flex" });
    gsap.set(goldRef.current, { yPercent: 100, display: "block" });
    gsap.set(textRef.current, { opacity: 0, scale: 0.8 });
    
    // SEQUENCE
    tl.to(goldRef.current, { yPercent: 0, duration: 0.8, ease: "expo.out" }) // Gold shoots up
      .to(curtainRef.current, { yPercent: 0, duration: 0.8, ease: "expo.out" }, "-=0.6") // Black follows
      .to(textRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }, "-=0.2") // Logo Pulse
      .to({}, { duration: 0.3 }); // Hold
  };

  const animateOutPush = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        toggleBodyScroll(false);
        gsap.set(curtainRef.current, { display: "none" });
        gsap.set(goldRef.current, { display: "none" });
      }
    });

    // EXIT SEQUENCE
    tl.to(curtainRef.current, { yPercent: -100, duration: 1.0, ease: "expo.inOut" })
      .to(goldRef.current, { yPercent: -100, duration: 0.8, ease: "expo.inOut" }, "-=0.8");
  };

  // 3. BACK MANUAL
  const goBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleBodyScroll(true); 
    
    prepareStyle("GACETA"); 

    const tl = gsap.timeline({ 
        onComplete: () => {
            navigate(-1);
            toggleBodyScroll(false); 
        } 
    });

    // Similar reverse logic or same wipe? Let's use same wipe for consistency but maybe faster
    gsap.set(curtainRef.current, { yPercent: 100, display: "flex" });
    gsap.set(goldRef.current, { yPercent: 100, display: "block" });
    
     tl.to(goldRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" })
       .to(curtainRef.current, { yPercent: 0, duration: 0.7, ease: "expo.out" }, "-=0.5")
       .to(curtainRef.current, { yPercent: -100, duration: 0.8, ease: "expo.inOut", delay: 0.2 })
       .to(goldRef.current, { yPercent: -100, duration: 0.8, ease: "expo.inOut" }, "-=0.7");
  };

  useEffect(() => {
    return () => toggleBodyScroll(false);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, goBack, isAnimating }}>
      {children}
      
      {/* GOLD STRIP LAYER */}
      <div 
        ref={goldRef}
        className="fixed inset-0 z-[10000] bg-[#dee5a0] hidden pointer-events-none"
      />

      {/* BLACK CURTAIN LAYER */}
      <div 
        ref={curtainRef}
        className="fixed inset-0 z-[10001] bg-[#0a0a0a] hidden flex-col items-center justify-center pointer-events-none"
      >
        {/* NOISE TEXTURE */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[url('data:image/svg+xml;base64,...')]" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")` }} 
        />

        <div className="relative overflow-hidden px-4 py-2 text-center w-full flex justify-center z-10">
            <h2 
                ref={textRef}
                className="font-serif italic text-white text-[15vw] md:text-[8vw] tracking-tighter mix-blend-difference"
            >
                {transitionText || "GACETA"}
            </h2>
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}