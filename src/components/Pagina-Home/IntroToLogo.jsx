import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PitchTitles from "./PitchTitles";
import SeccionArtistas from "./SeccionArtistas"; // Ajusta rutas si es necesario
import { ARTISTS_DATA } from "../../data/artistsData"; // Ajusta rutas si es necesario

gsap.registerPlugin(ScrollTrigger);

export default function IntroToLogo() {
  const wrapRef = useRef(null);
  const introRef = useRef(null);
  const logoRef = useRef(null); // Ahora referenciará al contenedor del video
  const scrollIndRef = useRef(null);
  const videoWrapRef = useRef(null); // El aftermovie de fondo
  const videoRef = useRef(null);
  const overlayRef = useRef(null); 
  const pitchRef = useRef(null);
  const artistasRef = useRef(null);
  const connectorLineRef = useRef(null);


  useEffect(() => {
    // Asegurar que el aftermovie esté listo y silenciado
    const video = videoRef.current;
    if (video) { video.muted = true; video.playsInline = true; }

    // Seleccionamos el logo del Navbar
    const navLogoEl = document.querySelector('[data-logo="navbar-logo"]');

    const ctx = gsap.context(() => {
      // 1. ESTADO INICIAL
      if(navLogoEl) gsap.set(navLogoEl, { autoAlpha: 0 }); // Navbar oculto
      
      gsap.set(overlayRef.current, { opacity: 0.3 }); 
      gsap.set(logoRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });

      // 2. SECUENCIA SINCRONIZADA
      const tlIntro = gsap.timeline({
        scrollTrigger: {
          trigger: introRef.current,
          start: "top top",
          end: "bottom 70%",
          scrub: 0.5, // Leve delay para suavizar el "stuck"
          fastScrollEnd: true, // CRITICO: Forza al final si scrollean rápido
          pin: true,
          anticipatePin: 1,
        },
      });

      tlIntro
        .add(() => {}, 0); // Start anchor

      if (scrollIndRef.current) {
         tlIntro.to(scrollIndRef.current, { opacity: 0, duration: 0.1 }, 0);
      }
        
        // A) LOGO EXPLODE + BLUR (Cinematic Fly-Through)
      if (logoRef.current) {
        tlIntro.to(logoRef.current, { 
            scale: 50, // Much larger scale to ensure it covers screen before vanishing
            opacity: 0, 
            filter: "blur(40px)", // Heavier blur at end
            duration: 2.0, // Slower duration for drama
            ease: "expo.in", // Accelerates into the camera
        }, 0);
      }
        
        // B) VIDEO REVEAL (CLIP PATH)
      if (videoWrapRef.current) {
        tlIntro.fromTo(videoWrapRef.current, 
            { autoAlpha: 1, clipPath: "inset(40% 20% 40% 20% round 20px)", scale: 0.9 },
            { clipPath: "inset(0% 0% 0% 0% round 0px)", scale: 1, duration: 1.5, ease: "power2.inOut" },
            0.2 // Small overlap
        );
      }
        
        // C) NAVBAR LOGO
        if (navLogoEl) {
           tlIntro.to(navLogoEl, { 
              autoAlpha: 1, 
              duration: 0.5, 
              ease: "power2.out" 
           }, 1.2);
        }

        tlIntro.call(() => video?.play().catch(() => {}), null, 0.5);


      // 3. Otros efectos (Fade texto, conector, etc) - SE MANTIENEN IGUAL
      gsap.to(overlayRef.current, {
        opacity: 1, 
        ease: "power1.inOut",
        scrollTrigger: {
            trigger: pitchRef.current,
            start: "top 20%", 
            end: "bottom 20%",   
            scrub: true,
        }
      });

      ScrollTrigger.create({
        trigger: artistasRef.current,
        start: "top bottom",
        onEnter: () => video?.pause(),
        onLeaveBack: () => video?.play().catch(() => {})
      });

      if (connectorLineRef.current) {
        gsap.set(connectorLineRef.current, { scaleY: 0, transformOrigin: "top" });
        gsap.to(connectorLineRef.current, {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
                trigger: pitchRef.current,
                start: "bottom 70%", 
                endTrigger: artistasRef.current,
                end: "top 30%", 
                scrub: true
            }
        });
      }

    }, wrapRef);

    const doRefresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", doRefresh);

    return () => {
      ctx.revert();
      window.removeEventListener("load", doRefresh);
      // Restaurar logo si salimos
      if (navLogoEl) gsap.set(navLogoEl, { autoAlpha: 1 }); 
    };

  }, []);

  return (
    <div ref={wrapRef} className="relative isolate bg-black">
      
      {/* === SECCIÓN 1: INTRO (LOGO ANIMADO) === */}
      <section ref={introRef} className="relative h-full-screen w-full overflow-hidden z-20 flex items-center justify-center">
        
        {/* VIDEO LOGO (Reemplaza a la imagen) */}
        <div ref={logoRef} className="relative z-10 w-[40vw] max-w-[500px] min-w-[250px] aspect-video flex items-center justify-center will-change-transform">
          <video 
            src="/assets/logo-animado.mp4" // <--- TU VIDEO DEL LOGO
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Indicador de Scroll */}
        <div ref={scrollIndRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono">Scroll</span>
            <div className="w-px h-8 bg-white/30" />
        </div>
      </section>

      {/* === BACKGROUND FIX (AFTERMOVIE) === */}
      {/* Este video aparece detrás cuando el logo explota */}
      <div ref={videoWrapRef} className="fixed inset-0 z-0 pointer-events-none">
        <video ref={videoRef} src="/assets/aftermovie.mp4" className="w-full h-full object-cover" playsInline muted preload="auto" loop />
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
            className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-[#dee5a0] via-[#dee5a0]/50 to-transparent shadow-[0_0_15px_#dee5a0]" 
        />
      </div>

      {/* === SECCIÓN 3: ARTISTAS === */}
      <section ref={artistasRef} className="relative z-10">
        <SeccionArtistas artistsData={ARTISTS_DATA} showAll={false} />
      </section>
    </div>
  );
}