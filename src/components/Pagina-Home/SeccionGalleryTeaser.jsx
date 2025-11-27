import React, { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SeccionGalleryTeaser({
  images = [],
  title = "GALLERY",
  ctaText = "VISITAR GALERÍA",
  ctaHref = "/gallery",
}) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const btnRef = useRef(null);

  const displayImages = [
    images[0] || "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800&auto=format&fit=crop",
    images[1] || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop",
    images[2] || "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=800&auto=format&fit=crop",
  ];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%", 
          end: "bottom 90%",
          scrub: 1,
        }
      });

      // Título entra
      tl.fromTo(titleRef.current, { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0);

      const [left, center, right] = cardsRef.current;
      gsap.set([left, center, right], { y: 300, opacity: 0, scale: 0.8, rotation: 0, x: 0 });

      tl.to(left, { y: 40, x: -280, rotation: -12, opacity: 1, scale: 0.9, duration: 1.5, ease: "power2.out" }, 0.1);
      tl.to(right, { y: 40, x: 280, rotation: 12, opacity: 1, scale: 0.9, duration: 1.5, ease: "power2.out" }, 0.1);
      tl.to(center, { y: 0, x: 0, rotation: 0, opacity: 1, scale: 1.15, zIndex: 10, duration: 1.5, ease: "power2.out" }, 0.1);

      tl.fromTo(btnRef.current, { scale: 0.8, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" }, 1.2);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[90vh] bg-transparent overflow-hidden flex flex-col items-center justify-center pb-32 pt-48 -mt-24 z-30"
    >
      {/* Fondo Gradiente */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-[#0e0e0f] from-0% via-[#911e1e] via-40% to-[#911e1e]" />

      {/* Texturas */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay -z-10" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} 
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.3)_100%)] -z-10" />

      {/* TÍTULO GIGANTE DE FONDO */}
      <h2 
        ref={titleRef}
        className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[24vw] font-black leading-none whitespace-nowrap pointer-events-none select-none z-0 tracking-tighter"
        style={{
            color: "rgba(255, 255, 255, 0.15)", // Blanco al 15% - SÓLIDO
        }}
      >
        {title}
      </h2>

      {/* Cartas */}
      <div className="relative w-full max-w-5xl h-[550px] flex items-center justify-center z-20 perspective-[1000px] mb-10">
          <div ref={el => cardsRef.current[0] = el} className="absolute w-[260px] md:w-[320px] aspect-[3/4] rounded-xl shadow-2xl border-[8px] border-white/90 overflow-hidden origin-bottom-right bg-black">
              <img src={displayImages[0]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10" />
          </div>
          <div ref={el => cardsRef.current[2] = el} className="absolute w-[260px] md:w-[320px] aspect-[3/4] rounded-xl shadow-2xl border-[8px] border-white/90 overflow-hidden origin-bottom-left bg-black">
              <img src={displayImages[2]} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10" />
          </div>
          <div ref={el => cardsRef.current[1] = el} className="absolute w-[280px] md:w-[340px] aspect-[3/4] rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.4)] border-[8px] border-white overflow-hidden z-20 bg-black">
              <img src={displayImages[1]} alt="" className="w-full h-full object-cover" />
          </div>
      </div>

      {/* CTA */}
      <div ref={btnRef} className="relative z-30 mt-4">
        <a href={ctaHref} className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-[#911e1e] rounded-full overflow-hidden transition-transform duration-300 hover:scale-105 shadow-xl">
          <span className="relative z-10 font-bold tracking-[0.2em] uppercase text-xs md:text-sm group-hover:text-white transition-colors duration-300">{ctaText}</span>
          <svg className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          <div className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </a>
      </div>

    </section>
  );
}