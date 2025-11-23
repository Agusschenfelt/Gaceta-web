// SeccionGacetaTv.jsx — versión optimizada rendimiento
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function SeccionGacetaTv() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const edgeRef = useRef(null);

  const videoIds = [
    "nVIm2-qJzYA",
    "yXEHvgxi3MI",
    "uIByPBurV5g",
    "MKFDGc5f_5s",
    "-_1lMtVJpAQ",
    "oHzDMW2RWvw",
    "R2BO2v6PTgY",
  ];

  // Elegimos el video una sola vez, sin render extra
  const [videoId] = useState(
    () => videoIds[Math.floor(Math.random() * videoIds.length)]
  );

  // Solo montamos el iframe cuando la sección está en viewport
  const [isIframeActive, setIsIframeActive] = useState(false);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIframeActive(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        threshold: 0.25, // cuando el 25% de la sección entra, activamos
      }
    );

    observer.observe(sec);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const sec = sectionRef.current;
    const card = cardRef.current;
    const glow = glowRef.current;
    const edge = edgeRef.current;
    if (!sec || !card || !glow || !edge) return;

    // Preparar para GPU (solo elementos que se animan)
    gsap.set([card, glow, edge], { willChange: "transform, opacity" });

    gsap.set(sec, { opacity: 0.65, y: 40 });
    gsap.set(card, { opacity: 0, y: 80, scale: 0.94, transformOrigin: "center" });
    gsap.set(glow, { opacity: 0, y: 30 });
    gsap.set(edge, { opacity: 0, y: 24 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec,
        start: "top 75%",
        end: "top 45%",
        scrub: 0.35,
        invalidateOnRefresh: true,
        markers: false,
      },
      defaults: { ease: "power2.out" },
    });

    tl.to(sec, { opacity: 1, y: 0, duration: 0.9 }, 0)
      .to(edge, { opacity: 1, y: 0, duration: 0.9 }, 0.05)
      .to(card, { opacity: 1, y: 0, scale: 1, duration: 1.0 }, "<0.05")
      .to(glow, { opacity: 1, y: 0, duration: 0.9 }, "<0.1");

    // Flotación sutil SOLO mientras está visible
    let floatTween = null;
    const startFloat = () => {
      if (floatTween) return;
      floatTween = gsap.to(card, {
        yPercent: 1.2,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        force3D: true,
      });
    };
    const stopFloat = () => {
      floatTween?.kill();
      floatTween = null;
      gsap.set(card, { yPercent: 0 });
    };

    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top 70%",
      end: "bottom top",
      onEnter: startFloat,
      onEnterBack: startFloat,
      onLeave: stopFloat,
      onLeaveBack: stopFloat,
    });

    const onWinLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onWinLoad);

    return () => {
      tl.kill();
      st.kill();
      stopFloat();
      window.removeEventListener("load", onWinLoad);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gacetatv"
      className="relative z-20 mt-10 flex flex-col items-center justify-center
                 py-28 lg:py-56 bg-[#0a0a0a] rounded-t-[2rem] lg:rounded-t-[2.5rem] overflow-hidden
                 shadow-[0_-60px_120px_-40px_rgba(0,0,0,0.85)]"
    >
      {/* Degradado superior que “muerde” la sección anterior */}
      <div
        ref={edgeRef}
        className="pointer-events-none absolute -top-10 left-0 right-0 h-48
                   bg-gradient-to-b from-black via-black/85 to-transparent
                   opacity-0 z-30"
      />

      {/* Glow de fondo */}
      <div
        ref={glowRef}
        className="absolute w-[80vw] max-w-[820px] aspect-square rounded-full
                   bg-[#8d1e1e]/40 blur-[120px] opacity-0 top-8 lg:top-0"
      />

      {/* Contenedor del video */}
      <div
        ref={cardRef}
        className="relative w-[88%] max-w-[1150px] aspect-video rounded-[1.8rem] overflow-hidden
                   ring-1 ring-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.6)] bg-black"
      >
        {/* Placeholder ligero mientras no montamos el iframe */}
        {!isIframeActive && (
          <div className="w-full h-full flex items-center justify-center text-xs tracking-[0.2em] text-white/40 uppercase">
            Cargando GACE TV...
          </div>
        )}

        {isIframeActive && videoId && (
          <iframe
            className="absolute inset-0 w-full h-full rounded-[1.8rem]"
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title="GacetaTV"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      <h2 className="mt-10 text-center text-white/90 font-semibold tracking-widest uppercase text-xs">
        GACE<span className="text-[#8d1e1e]">TV</span>
      </h2>
    </section>
  );
}
