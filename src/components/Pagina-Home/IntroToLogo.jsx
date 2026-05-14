import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PitchTitles from "./PitchTitles";
import SeccionArtistas from "./SeccionArtistas";
import { ARTISTS_DATA } from "../../data/artistsData";

export default function IntroToLogo() {
  const wrapRef        = useRef(null);
  const introRef       = useRef(null);
  const logoRef        = useRef(null);
  const scrollIndRef   = useRef(null);
  const videoWrapRef   = useRef(null);
  const videoRef       = useRef(null);
  const overlayRef     = useRef(null);
  const blackBgRef     = useRef(null); // negro propio de la sección intro
  const flashRef       = useRef(null); // destello inicial
  const pitchRef       = useRef(null);
  const artistasRef    = useRef(null);
  const connectorLineRef = useRef(null);

  useEffect(() => {
    const video    = videoRef.current;
    if (video) { video.muted = true; video.playsInline = true; }

    const navLogoEl = document.querySelector('[data-logo="navbar-logo"]');

    const ctx = gsap.context(() => {

      // ─── 1. ESTADOS INICIALES ─────────────────────────────────────────────
      if (navLogoEl)       gsap.set(navLogoEl,           { autoAlpha: 0 });
      gsap.set(flashRef.current,    { opacity: 1 });          // flash cubre todo
      gsap.set(blackBgRef.current,  { opacity: 1 });          // negro de la sección
      gsap.set(overlayRef.current,  { opacity: 1 });          // negro sobre aftermovie
      gsap.set(videoWrapRef.current,{ opacity: 0 });          // aftermovie oculto
      gsap.set(logoRef.current,     { opacity: 1, scale: 1, filter: "blur(0px)" }); // logo visible desde el inicio
      if (scrollIndRef.current) gsap.set(scrollIndRef.current, { opacity: 0, y: 10 });

      // ─── 2. FLASH + ENTRADAS AUTOMÁTICAS (sin scroll) ─────────────────────
      // El flash se disipa en 180ms — impacto inmediato
      gsap.to(flashRef.current, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.out",
        onComplete: () => gsap.set(flashRef.current, { display: "none" }),
      });

      // Scroll indicator aparece poco después
      if (scrollIndRef.current) {
        gsap.to(scrollIndRef.current, {
          opacity: 1, y: 0,
          duration: 0.6, ease: "power2.out", delay: 0.4,
        });
      }

      // ─── 3. SECUENCIA SCROLL-DRIVEN ───────────────────────────────────────
      const tlIntro = gsap.timeline({
        scrollTrigger: {
          trigger: introRef.current,
          start: "top top",
          end: "+=130%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Scroll indicator: sale con el primer movimiento
      if (scrollIndRef.current) {
        tlIntro.to(scrollIndRef.current, { opacity: 0, duration: 0.2 }, 0);
      }

      // A) AFTERMOVIE — empieza a aparecer junto con la explosión del logo
      tlIntro.to(videoWrapRef.current, {
        opacity: 1, duration: 0.8, ease: "power1.inOut",
      }, 0.2);

      // B+C+D) LOGO, FONDO NEGRO Y OVERLAY — misma posición, misma ease, misma duración
      //        → opacidad idéntica en cada frame, el fondo nunca "asoma" bajo el logo
      const FADE = { pos: 0, dur: 1.6, ease: "power2.inOut" };

      tlIntro.to(blackBgRef.current, {
        opacity: 0, duration: FADE.dur, ease: FADE.ease,
      }, FADE.pos);

      tlIntro.to(overlayRef.current, {
        opacity: 0, duration: FADE.dur, ease: FADE.ease,
      }, FADE.pos);

      tlIntro.to(logoRef.current, {
        opacity: 0,
        scale: 10,
        duration: FADE.dur,
        ease: FADE.ease,
      }, FADE.pos);

      // E) NAVBAR LOGO — aparece al terminar la explosión
      if (navLogoEl) {
        tlIntro.to(navLogoEl, {
          autoAlpha: 1, duration: 0.4, ease: "power2.out",
        }, FADE.dur - 0.2);
      }

      // Video empieza a reproducirse con el scroll
      tlIntro.call(() => video?.play().catch(() => {}), null, 0.1);

      // ─── 4. OVERLAY al llegar a PITCH TITLES ──────────────────────────────
      // Arranca en "top 60%" para dar tiempo de pantalla al aftermovie:
      // el usuario scrollea ~40% de viewport con el video totalmente visible
      // antes de que el overlay empiece a subir.
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        {
          opacity: 0.82,
          ease: "power1.inOut",
          scrollTrigger: {
            trigger: pitchRef.current,
            start: "top 60%",
            end: "top 5%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );

      // ─── 5. VIDEO FADE OUT ────────────────────────────────────────────────
      // ease: "power3.in" = la opacidad casi no cae durante el primer 60% del
      // scroll (el video se ve casi en full), y recién baja con fuerza en el
      // tramo final antes de artistas. Percepción de mucho más tiempo de video.
      // start: "top 100%" = arranca desde que pitch asoma por el borde inferior.
      // end: "top 110%" = completa 10% antes de que artistas sea visible.
      gsap.fromTo(videoWrapRef.current,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "power4.in",
          scrollTrigger: {
            trigger: pitchRef.current,
            start: "top 100%",
            endTrigger: artistasRef.current,
            end: "top 110%",
            scrub: 1,
            invalidateOnRefresh: true,
            onLeave:      () => video?.pause(),
            onEnterBack:  () => video?.play().catch(() => {}),
          },
        }
      );

      // ─── 6. CONECTOR (luz dorada entre Pitch y Artistas) ─────────────────
      if (connectorLineRef.current) {
        gsap.set(connectorLineRef.current, { scaleY: 0, transformOrigin: "top" });
        gsap.to(connectorLineRef.current, {
          scaleY: 1, ease: "none",
          scrollTrigger: {
            trigger: pitchRef.current,
            start: "bottom 70%",
            endTrigger: artistasRef.current,
            end: "top 30%",
            scrub: true,
          }
        });
      }

    }, wrapRef);

    const doRefresh = () => ScrollTrigger.refresh();
    if (document.readyState === "complete") {
      doRefresh();
    } else {
      window.addEventListener("load", doRefresh, { once: true });
    }

    return () => {
      ctx.revert();
      window.removeEventListener("load", doRefresh);
      if (navLogoEl) gsap.set(navLogoEl, { autoAlpha: 1 });
    };

  }, []);

  return (
    <div ref={wrapRef} className="relative isolate bg-black">

      <h1 className="sr-only">GACETA — Sello Discográfico</h1>

      {/* FLASH INICIAL — z-[9000] cubre todo excepto la transición de página */}
      <div
        ref={flashRef}
        aria-hidden="true"
        className="fixed inset-0 z-[9000] bg-white pointer-events-none"
      />

      {/* === SECCIÓN 1: INTRO (LOGO ANIMADO) === */}
      <section
        ref={introRef}
        className="relative h-full-screen w-full overflow-hidden z-20 flex items-center justify-center"
      >
        {/* Negro propio de la sección — se desvanece junto al logo */}
        <div
          ref={blackBgRef}
          aria-hidden="true"
          className="absolute inset-0 bg-black z-0 pointer-events-none"
        />

        {/* Logo animado */}
        <div
          ref={logoRef}
          className="relative z-10 w-[40vw] max-w-[500px] min-w-[min(250px,70vw)] aspect-video flex items-center justify-center"
        >
          <video
            src="/assets/logo-animado.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-contain mix-blend-screen"
          />
        </div>

        {/* Indicador de scroll */}
        <div
          ref={scrollIndRef}
          aria-hidden="true"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest font-mono">Scroll</span>
          <div className="w-px h-8 bg-white/30 animate-scroll-hint" />
        </div>
      </section>

      {/* === AFTERMOVIE DE FONDO (fixed) === */}
      <div
        ref={videoWrapRef}
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <video
          ref={videoRef}
          src="/assets/aftermovie.mp4"
          className="w-full h-full object-cover"
          playsInline muted preload="metadata" loop
        />
        {/* Overlay — negro que se coordina con la explosión del logo */}
        <div ref={overlayRef} className="absolute inset-0 bg-black" />
      </div>

      {/* === SECCIÓN 2: PITCH TITLES === */}
      <section ref={pitchRef} className="relative z-10 min-h-[90svh] flex flex-col items-center justify-center py-20">
        <div className="max-w-6xl px-6 w-full">
          <PitchTitles />
        </div>
      </section>

      {/* CONECTOR DE SALIDA (Luz Dorada) */}
      <div className="relative z-10 h-[20svh] w-full pointer-events-none -mt-10">
        <div
          ref={connectorLineRef}
          className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-secundario via-secundario/50 to-transparent shadow-[0_0_15px_var(--color-secundario)]"
        />
      </div>

      {/* === SECCIÓN 3: ARTISTAS === */}
      <section ref={artistasRef} className="relative z-10">
        <SeccionArtistas artistsData={ARTISTS_DATA} showAll={false} />
      </section>

    </div>
  );
}
