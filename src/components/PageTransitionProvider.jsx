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
  if (slug.toLowerCase() === "ara") return "ARA";
  if (slug.toLowerCase() === "mvp") return "MVP";
  return slug
    .replace(/[_]/g, " ")
    .replace(/[-]/g, " ")
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
  const goldRef    = useRef(null);
  const textRef    = useRef(null);
  const lineRef    = useRef(null);

  const isReady = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [isArtistStyle, setIsArtistStyle] = useState(false);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const toggleBodyScroll = (lock) => {
    if (lock) {
      document.body.style.overflow = "hidden";
      document.body.style.height   = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height   = "";
    }
  };

  const prepareStyle = (label) => {
    setTransitionText(label);
    const isSystem = SYSTEM_LABELS.includes(label.toUpperCase());
    setIsArtistStyle(!isSystem);
  };

  // isReady becomes true after the Strict Mode double-invoke cycle completes.
  // Its cleanup resets the flag so the second Strict Mode run still skips POP.
  useEffect(() => {
    isReady.current = true;
    return () => { isReady.current = false; };
  }, []);

  // ─── POP (browser back / swipe) ──────────────────────────────────────────
  useLayoutEffect(() => {
    if (!isReady.current) {
      // Initial mount OR Strict Mode re-mount — just initialize, never animate
      gsap.set(curtainRef.current, { display: "none" });
      gsap.set(goldRef.current,    { display: "none" });
      toggleBodyScroll(false);
      return;
    }

    if (navType === "POP") {
      const label = getLabelForPath(location.pathname);
      prepareStyle(label);
      toggleBodyScroll(true);

      // Curtain is already covering (assumed from before POP). Just exit it.
      const tl = gsap.timeline({
        onComplete: () => {
          toggleBodyScroll(false);
          gsap.set(curtainRef.current, { display: "none" });
          gsap.set(goldRef.current,    { display: "none" });
          gsap.set(textRef.current,    { y: 0, opacity: 1 });
        }
      });

      tl.set(curtainRef.current, { yPercent: 0, display: "flex" })
        .set(goldRef.current,    { yPercent: 0, display: "block" })
        .set(textRef.current,    { y: 0, opacity: 1 })
        .set(lineRef.current,    { width: "100%" })
        .to({}, { duration: 0.12 })
        .to(textRef.current,    { y: -50, opacity: 0, duration: 0.22, ease: "power3.in" })
        .to(curtainRef.current, { yPercent: -100, duration: 0.65, ease: "expo.inOut" }, "-=0.12")
        .to(goldRef.current,    { yPercent: -100, duration: 0.55, ease: "expo.inOut" }, "-=0.5");
    }
  }, [location.pathname, navType]);


  // ─── PUSH (manual navigation) ────────────────────────────────────────────
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

    // ── Initial state ──
    gsap.set(curtainRef.current, { yPercent: 100, display: "flex" });
    gsap.set(goldRef.current,    { yPercent: 100, display: "block" });
    gsap.set(textRef.current,    { y: 80, opacity: 1 });
    gsap.set(lineRef.current,    { width: 0 });

    // ── Enter sequence ──
    tl.to(goldRef.current,    { yPercent: 0, duration: 0.5,  ease: "expo.out" })
      .to(curtainRef.current, { yPercent: 0, duration: 0.55, ease: "expo.out" }, "-=0.45")
      .to(textRef.current,    { y: 0,        duration: 0.45, ease: "power4.out" }, "-=0.2")
      .to(lineRef.current,    { width: "100%", duration: 0.5, ease: "none" },      "-=0.3")
      .to({}, { duration: 0.05 });
  };

  const animateOutPush = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        toggleBodyScroll(false);
        gsap.set(curtainRef.current, { display: "none" });
        gsap.set(goldRef.current,    { display: "none" });
        gsap.set(textRef.current,    { y: 0, opacity: 1 }); // reset para siguiente transición
      }
    });

    tl.to(textRef.current,    { y: -50, opacity: 0, duration: 0.2,  ease: "power3.in" })
      .to(curtainRef.current, { yPercent: -100, duration: 0.65, ease: "expo.inOut" }, "-=0.1")
      .to(goldRef.current,    { yPercent: -100, duration: 0.55, ease: "expo.inOut" }, "-=0.5");
  };


  // ─── BACK (manual goBack button) ─────────────────────────────────────────
  const goBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleBodyScroll(true);

    prepareStyle("GACETA");

    gsap.set(curtainRef.current, { yPercent: 100, display: "flex" });
    gsap.set(goldRef.current,    { yPercent: 100, display: "block" });
    gsap.set(textRef.current,    { y: 80, opacity: 1 });
    gsap.set(lineRef.current,    { width: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        navigate(-1);
        toggleBodyScroll(false);
      }
    });

    tl.to(goldRef.current,    { yPercent: 0, duration: 0.45, ease: "expo.out" })
      .to(curtainRef.current, { yPercent: 0, duration: 0.5,  ease: "expo.out" }, "-=0.4")
      .to(textRef.current,    { y: 0,        duration: 0.4,  ease: "power4.out" }, "-=0.18")
      .to(lineRef.current,    { width: "100%", duration: 0.35, ease: "none" }, "-=0.25")
      .to({}, { duration: 0.05 });
  };

  useEffect(() => {
    return () => toggleBodyScroll(false);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ navigateWithTransition, goBack, isAnimating }}>
      {children}

      {/* GOLD STRIP — primer layer */}
      <div
        ref={goldRef}
        aria-hidden="true"
        className="fixed inset-0 z-[10000] bg-secundario hidden pointer-events-none"
      />

      {/* BLACK CURTAIN — segundo layer */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="fixed inset-0 z-[10001] bg-fondo hidden flex-col items-center justify-center pointer-events-none"
      >
        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none noise-texture" />

        {/* Etiqueta esquina — editorial */}
        <span className="absolute top-6 left-6 md:top-8 md:left-10 font-mono text-[9px] tracking-[0.35em] text-secundario/50 uppercase z-10 select-none">
          GACETA
        </span>

        {/* Destino — slide-up dentro de overflow:hidden */}
        <div className="relative overflow-hidden px-6 py-2 text-center w-full flex justify-center z-10">
          <h2
            ref={textRef}
            className={`leading-none tracking-tighter mix-blend-difference
              ${isArtistStyle
                ? "font-serif italic text-white text-[clamp(3rem,14vw,9rem)]"
                : "font-bold text-white text-[clamp(2rem,10vw,7rem)]"
              }`}
          >
            {transitionText || "GACETA"}
          </h2>
        </div>

        {/* Línea de progreso — barre de izquierda a derecha */}
        <div
          ref={lineRef}
          className="absolute bottom-0 left-0 h-[2px] bg-secundario z-10 pointer-events-none"
          style={{ width: 0 }}
        />
      </div>
    </PageTransitionContext.Provider>
  );
}
