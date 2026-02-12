import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PitchTitles from "./PitchTitles";
import SeccionArtistas from "./SeccionArtistas";
import { ARTISTS_DATA } from "../../data/artistsData";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const containerRef = useRef(null);
  const heroTextRef = useRef(null);
  const videoWrapRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 0. Initial States
      gsap.set(videoWrapRef.current, { 
        clipPath: "inset(40% 20% 40% 20% round 20px)", 
        scale: 0.8,
        opacity: 0 
      });
      gsap.set(heroTextRef.current, { opacity: 1, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        }
      });

      // 1. Hero Text fades out slightly & scales up
      tl.to(heroTextRef.current, {
        scale: 5,
        opacity: 0,
        filter: "blur(20px)",
        ease: "power2.in",
        duration: 2
      }, 0);

      // 2. Video Reveals via ClipPath & Scale
      tl.to(videoWrapRef.current, {
        clipPath: "inset(0% 0% 0% 0% round 0px)",
        scale: 1,
        opacity: 1,
        ease: "power2.inOut",
        duration: 2
      }, 0);

      // 3. Video plays when revealed
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        onEnter: () => videoRef.current?.play(),
        onLeaveBack: () => videoRef.current?.play() // Keep playing if we bounce back
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={contentRef} className="relative bg-black text-white">
      
      {/* === PINNED HERO === */}
      <div ref={containerRef} className="relative w-full h-[100vh] overflow-hidden flex items-center justify-center z-20">
        
        {/* HUGE TEXT */}
        <h1 
            ref={heroTextRef}
            className="relative z-30 font-serif text-[18vw] leading-[0.8] text-center mix-blend-difference pointer-events-none select-none text-[#dee5a0]"
        >
            GACETA
        </h1>

        {/* BACKGROUND VIDEO */}
        <div 
            ref={videoWrapRef}
            className="absolute inset-0 z-10 w-full h-full"
        >
             <video 
                ref={videoRef}
                src="/assets/aftermovie.mp4" 
                className="w-full h-full object-cover opacity-60" 
                muted 
                loop 
                playsInline
            />
            {/* Overlay to keep it dark/editorial */}
            <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 z-30 flex flex-col items-center gap-2 animate-pulse">
            <span className="text-[10px] uppercase tracking-[0.3em] font-mono opacity-50">Scroll to Explore</span>
            <div className="w-[1px] h-12 bg-white/20" />
        </div>

      </div>

      {/* === CONTENT BELOW HERO === */}
      <div className="relative z-20 bg-black -mt-[1px] pt-32 pb-32">
        <PitchTitles />
      </div>

       {/* === ARTISTAS SECTION === */}
       <div className="relative z-20 bg-black pb-20">
         <SeccionArtistas artistsData={ARTISTS_DATA} showAll={false} />
       </div>

    </div>
  );
}
