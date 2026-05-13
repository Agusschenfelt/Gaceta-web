import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorWrapperRef = useRef(null);
  const cursorDotRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia("(max-width: 768px)").matches;
    const wrapper = cursorWrapperRef.current;
    const dot = cursorDotRef.current;
    const textEl = textRef.current;
    
    if (!wrapper || !dot || isTouchDevice) {
       if (wrapper) wrapper.style.display = 'none';
       return;
    }

    document.body.style.cursor = 'none';

    // Establecemos el centro del div interior con GSAP para que no choque con Tailwind
    gsap.set(dot, { xPercent: -50, yPercent: -50 });

    let mouseX = -100;
    let mouseY = -100;

    // Restaurar cursor nativo para usuarios de teclado
    const onMouseMoveRestore = () => { document.body.style.cursor = 'none'; };
    const onTabKey = (e) => {
      if (e.key === 'Tab') {
        document.body.style.cursor = 'auto';
        window.addEventListener("mousemove", onMouseMoveRestore, { passive: true, once: true });
      }
    };

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Bucle Vanilla JS ultra-optimizado conectado al refresco de la pantalla (144hz, 60hz, etc)
    let raf;
    const render = () => {
      wrapper.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onMouseOver = (e) => {
      const target = e.target.closest("a, button, [data-magnetic], [data-card]");
      if (target) {
        gsap.to(dot, { scale: 3.5, duration: 0.3, ease: "expo.out" });
        if (target.hasAttribute("data-card") && textEl) {
          textEl.innerText = "PLAY";
          textEl.style.opacity = "1";
        }
      }
    };

    const onMouseOut = (e) => {
      const target = e.target.closest("a, button, [data-magnetic], [data-card]");
      if (target) {
        gsap.to(dot, { scale: 1, duration: 0.3, ease: "expo.out" });
        if (textEl) textEl.style.opacity = "0";
      }
    };
    
    const onMouseLeaveWindow = () => gsap.to(dot, { opacity: 0, duration: 0.2 });
    const onMouseEnterWindow = () => gsap.to(dot, { opacity: 1, duration: 0.2 });

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("keydown", onTabKey);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("mouseleave", onMouseLeaveWindow);
    document.addEventListener("mouseenter", onMouseEnterWindow);

    return () => {
      document.body.style.cursor = 'auto';
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousemove", onMouseMoveRestore);
      window.removeEventListener("keydown", onTabKey); // safety: remove any pending once listener too
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("mouseleave", onMouseLeaveWindow);
      document.removeEventListener("mouseenter", onMouseEnterWindow);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={cursorWrapperRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
    >
      <div 
        ref={cursorDotRef}
        className="absolute w-4 h-4 rounded-full bg-secundario flex items-center justify-center text-fondo shadow-[0_0_10px_rgba(222,229,160,0.5)]"
      >
        <span ref={textRef} className="text-[5px] font-black tracking-[0.15em] opacity-0 transition-opacity duration-200 select-none" />
      </div>
    </div>
  );
}
