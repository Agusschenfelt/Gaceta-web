import { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import TransitionLink from "../TransitionLink";

export default function CTASobreNosotros() {
  const sectionRef = useRef(null);
  const lineLeftRef = useRef(null);
  const lineRightRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headingRef = useRef(null);
  const ctaRef = useRef(null);

  useGSAP(() => {
    const split = new SplitText(headingRef.current, { type: "chars" });

    gsap.set(lineLeftRef.current, { scaleX: 0, transformOrigin: "right center" });
    gsap.set(lineRightRef.current, { scaleX: 0, transformOrigin: "left center" });
    gsap.set(eyebrowRef.current, { opacity: 0 });
    gsap.set(split.chars, { y: 50, opacity: 0 });
    gsap.set(ctaRef.current, { opacity: 0, y: 14 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 78%",
        once: true,
      },
    });

    tl.to([lineLeftRef.current, lineRightRef.current], {
      scaleX: 1,
      duration: 1,
      ease: "power3.inOut",
    })
      .to(eyebrowRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      }, "-=0.4")
      .to(split.chars, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.025,
      }, "-=0.2")
      .to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      }, "-=0.35");

    return () => split.revert();
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative z-30 w-full py-28 flex flex-col items-center justify-center"
    >
      {/* Gold lines + eyebrow — animan desde el centro hacia afuera */}
      <div className="flex items-center w-full max-w-2xl px-6 md:px-10 mb-10">
        <div
          ref={lineLeftRef}
          className="flex-1 h-px bg-gradient-to-l from-secundario/50 to-transparent"
        />
        <span
          ref={eyebrowRef}
          className="font-mono text-[9px] tracking-[0.5em] uppercase text-secundario/60 mx-5 shrink-0 opacity-0"
        >
          GACETA
        </span>
        <div
          ref={lineRightRef}
          className="flex-1 h-px bg-gradient-to-r from-secundario/50 to-transparent"
        />
      </div>

      {/* Heading con reveal de chars */}
      <h2
        ref={headingRef}
        className="font-serif italic text-4xl md:text-5xl lg:text-6xl text-white/75 text-center leading-tight mb-10 px-6"
      >
        ¿Quiénes somos?
      </h2>

      {/* CTA link */}
      <div ref={ctaRef} className="opacity-0">
        <TransitionLink
          to="/sobre-nosotros"
          className="group flex items-center gap-2.5 font-mono text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-secundario transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secundario rounded-sm"
        >
          <span>Sobre GACETA</span>
          <svg
            className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </TransitionLink>
      </div>
    </section>
  );
}
