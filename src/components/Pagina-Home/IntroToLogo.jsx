import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PitchTitles from "./PitchTitles";
import SeccionArtistas from "./SeccionArtistas";
import { ARTISTS_DATA } from "../../data/artistsData"; 

gsap.registerPlugin(ScrollTrigger);

export default function IntroToLogo() {
  const wrapRef = useRef(null);
  const introRef = useRef(null);
  const logoRef = useRef(null);
  const scrollIndRef = useRef(null);
  const videoWrapRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null); 
  const pitchRef = useRef(null);
  const artistasRef = useRef(null);
  const connectorLineRef = useRef(null);
  const navLogoEl = document.querySelector("[data-logo]");

  useEffect(() => {
    const video = videoRef.current;
    if (video) { video.muted = true; video.playsInline = true; }

    const ctx = gsap.context(() => {
      // Estados iniciales
      gsap.set(videoWrapRef.current, { autoAlpha: 0 });
      gsap.set(overlayRef.current, { opacity: 0.3 }); 
      gsap.set(logoRef.current, { opacity: 1, scale: 1, filter: "blur(0px)" });
      if(navLogoEl) gsap.set(navLogoEl, { autoAlpha: 0 });

      // 1. Intro Zoom
      const tlIntro = gsap.timeline({
        scrollTrigger: {
          trigger: introRef.current,
          start: "top top",
          end: "bottom 70%",
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onLeave: () => navLogoEl && gsap.to(navLogoEl, { autoAlpha: 1, duration: 0.25 }),
          onEnterBack: () => navLogoEl && gsap.set(navLogoEl, { autoAlpha: 0 }),
        },
      });

      tlIntro
        .to(scrollIndRef.current, { opacity: 0, duration: 0.1 }, 0)
        .to(logoRef.current, { scale: 15, opacity: 0, filter: "blur(10px)", duration: 1, ease: "power2.in" }, 0)
        .to(videoWrapRef.current, { autoAlpha: 1, duration: 0.5 }, 0.4)
        .call(() => video?.play().catch(() => {}), null, 0.5);

      // 2. FADE A NEGRO 
      gsap.to(overlayRef.current, {
        opacity: 1, 
        ease: "power1.inOut",
        scrollTrigger: {
            trigger: pitchRef.current,
            start: "top 40%", 
            end: "bottom 80%",   
            scrub: true,
        }
      });

      ScrollTrigger.create({
        trigger: artistasRef.current,
        start: "top bottom",
        onEnter: () => video?.pause(),
        onLeaveBack: () => video?.play().catch(() => {})
      });

      // 3. CONECTOR FINAL (Luz Dorada)
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
      if (navLogoEl) gsap.set(navLogoEl, { autoAlpha: 1 });
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative isolate bg-black">
      {/* Intro Section */}
      <section ref={introRef} className="relative h-screen w-full overflow-hidden z-20">
        <div ref={logoRef} className="absolute inset-0 flex items-center justify-center will-change-transform">
          <img src="/assets/logo-blanco.png" alt="Gaceta" className="w-[35vw] max-w-[420px] min-w-[180px]" />
        </div>
        <div ref={scrollIndRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-mono">Scroll</span>
            <div className="w-px h-8 bg-white/30" />
        </div>
      </section>

      {/* Video Background Fixed */}
      <div ref={videoWrapRef} className="fixed inset-0 z-0 pointer-events-none">
        <video ref={videoRef} src="/assets/aftermovie.mp4" className="w-full h-full object-cover" playsInline muted preload="auto" loop />
        <div ref={overlayRef} className="absolute inset-0 bg-black" />
      </div>

      {/* Pitch Text */}
      <section ref={pitchRef} className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center py-20">
        <div className="max-w-6xl px-6 w-full">
          <PitchTitles />
        </div>
      </section>

      {/* CONECTOR DE SALIDA (Luz Dorada) */}
      <div className="relative z-10 h-[20vh] w-full pointer-events-none -mt-10">
        <div 
            ref={connectorLineRef} 
            className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-[#dee5a0] via-[#dee5a0]/50 to-transparent shadow-[0_0_15px_#dee5a0]" 
        />
      </div>

      {/* Artistas */}
      <section ref={artistasRef} className="relative z-10">
        <SeccionArtistas artistsData={ARTISTS_DATA} />
      </section>
    </div>
  );
}