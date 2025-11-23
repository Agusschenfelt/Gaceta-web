import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

import PitchTitles from "./PitchTitles";
import SeccionArtistas from "./SeccionArtistas";

export default function IntroToLogo() {
  const wrapRef = useRef(null);
  const introRef = useRef(null);
  const logoRef = useRef(null);

  const videoWrapRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  const pitchRef = useRef(null);
  const artistasRef = useRef(null);

  // Conector
  const connectorWrapRef = useRef(null);
  const connectorLineRef = useRef(null);
  const connectorDotRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const intro = introRef.current;
    const logo = logoRef.current;

    const videoWrap = videoWrapRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;

    const pitch = pitchRef.current;
    const artistas = artistasRef.current;

    const connectorWrap = connectorWrapRef.current;
    const connectorLine = connectorLineRef.current;
    const connectorDot = connectorDotRef.current;

    const gacetatv = document.querySelector("#gacetatv");
    const navLogoEl = document.querySelector("[data-logo]");

    if (video) {
      video.muted = true;
      video.playsInline = true;
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768;

      // Estados base
      gsap.set(videoWrap, { autoAlpha: 0 });
      gsap.set(overlay, { opacity: 0.25, willChange: "opacity" });
      video && gsap.set(video, { willChange: "transform" });
      navLogoEl && gsap.set(navLogoEl, { autoAlpha: 0 });

      gsap.set(logo, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        willChange: "transform, opacity, filter",
      });

      // INTRO (pin + zoom logo)
      const tlIntro = gsap.timeline({
        scrollTrigger: {
          trigger: intro,
          start: "top top",
          end: "bottom 70%",
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onEnter: () => navLogoEl && gsap.set(navLogoEl, { autoAlpha: 0 }),
          onEnterBack: () => navLogoEl && gsap.set(navLogoEl, { autoAlpha: 0 }),
          onLeave: () =>
            navLogoEl &&
            gsap.to(navLogoEl, { autoAlpha: 1, duration: 0.25, delay: 0.05 }),
          onLeaveBack: () =>
            navLogoEl && gsap.to(navLogoEl, { autoAlpha: 0, duration: 0.2 }),
        },
      });

      tlIntro.to(
        logo,
        {
          scale: 10,
          opacity: 0,
          filter: "blur(8px)",
          duration: 1.1,
          ease: "power3.out",
        },
        0
      );
      tlIntro
        .to(
          videoWrap,
          {
            autoAlpha: 1,
            duration: 0.7,
            ease: "power2.out",
          },
          0.5
        )
        .call(() => video?.play().catch(() => {}), null, 0.55);

      // Mantener video visible entre Pitch y Artistas
      ScrollTrigger.create({
        trigger: pitch,
        start: "top top",
        endTrigger: artistas,
        end: "bottom top",
        onEnter: () => gsap.set(videoWrap, { autoAlpha: 1 }),
        onLeave: () => gsap.set(videoWrap, { autoAlpha: 1 }),
        onEnterBack: () => gsap.set(videoWrap, { autoAlpha: 1 }),
      });

      // PITCH: oscurecer overlay (sin tocar blur del video)
      gsap.fromTo(
        overlay,
        { opacity: 0.25 },
        {
          opacity: 0.8,
          ease: "none",
          overwrite: "auto",
          immediateRender: false,
          scrollTrigger: {
            trigger: pitch,
            start: "top 115%",
            endTrigger: artistas,
            end: "top 85%",
            scrub: true,
            onLeaveBack: () => gsap.set(overlay, { opacity: 0.25 }),
          },
        }
      );

      // CONECTOR talentos → artistas
      if (connectorWrap && connectorLine && connectorDot) {
        gsap.set(connectorLine, {
          scaleY: 0,
          transformOrigin: "top",
          willChange: "transform",
        });
        gsap.set(connectorDot, { y: 12, autoAlpha: 0, willChange: "transform, opacity" });

        gsap.to(connectorLine, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: pitch,
            start: "bottom 88%",
            endTrigger: artistas,
            end: "top 72%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        gsap.to(connectorDot, {
          autoAlpha: 1,
          y: 0,
          ease: "sine.out",
          duration: 0.45,
          scrollTrigger: {
            trigger: artistas,
            start: "top 82%",
            end: "top 72%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        // pulso solo en desktop (evitamos animación infinita en mobile)
        if (!isMobile) {
          const pulse = gsap.to(connectorDot, {
            scale: 1.06,
            repeat: -1,
            yoyo: true,
            duration: 1.2,
            ease: "sine.inOut",
            paused: true,
          });

          ScrollTrigger.create({
            trigger: artistas,
            start: "top 82%",
            end: "top 20%",
            onEnter: () => pulse.play(),
            onLeave: () => pulse.pause(0),
            onEnterBack: () => pulse.play(),
            onLeaveBack: () => pulse.pause(0),
          });
        }
      }

      // Entrada a GACETV: solo overlay y fade del video, sin blur extra
      if (gacetatv) {
        gsap.fromTo(
          overlay,
          { opacity: 0.8 },
          {
            opacity: 0.94,
            ease: "none",
            overwrite: "auto",
            immediateRender: false,
            scrollTrigger: {
              trigger: gacetatv,
              start: "top 92%",
              end: "top 65%",
              scrub: true,
              onLeaveBack: () => gsap.set(overlay, { opacity: 0.8 }),
            },
          }
        );

        gsap.fromTo(
          videoWrap,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: gacetatv,
              start: "top 88%",
              end: "top 65%",
              scrub: true,
            },
          }
        );
      }
    }, wrap);

    const doRefresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", doRefresh);
    document.fonts?.ready?.then?.(doRefresh);

    return () => {
      ctx.revert();
      window.removeEventListener("load", doRefresh);
      if (navLogoEl) gsap.set(navLogoEl, { autoAlpha: 1 });
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative isolate">
      {/* INTRO */}
      <section
        ref={introRef}
        className="relative h-screen w-full bg-black overflow-hidden"
      >
        <div
          ref={logoRef}
          className="absolute inset-0 flex items-center justify-center will-change-transform"
        >
          <img
            src="/assets/logo-blanco.png"
            alt="Gaceta"
            className="w-[35vw] max-w-[420px] min-w-[180px] pointer-events-none select-none"
          />
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-white opacity-80">
          <span className="text-xs tracking-widest font-inter mb-1">
            Conocé Gaceta
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* VIDEO + OVERLAY */}
      <div
        ref={videoWrapRef}
        className="fixed inset-0 z-0 pointer-events-none opacity-0"
      >
        <video
          ref={videoRef}
          src="/assets/aftermovie.mp4"
          className="w-full h-full object-cover"
          playsInline
          muted
          preload="metadata"
          loop
        />
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black"
          style={{ opacity: 0.25 }}
        />
      </div>

      {/* PITCH */}
      <section
        ref={pitchRef}
        className="relative z-10 flex flex-col items-center justify-center bg-transparent py-[16vh]"
      >
        <div className="max-w-5xl px-6 text-center text-white w-full">
          <PitchTitles />
        </div>

        <div className="h-[4vh] md:h-[5vh]" />
      </section>

      {/* CONECTOR */}
      <div
        ref={connectorWrapRef}
        className="relative z-10 h-[15vh] md:h-[20vh] md:-mt-[20vh] -mt-[28vh]"
      >
        <div
          ref={connectorLineRef}
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[3px] md:w-[4px] rounded-full origin-top"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.1) 100%)",
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))",
            height: "100%",
          }}
        />
        <div
          ref={connectorDotRef}
          className="absolute left-1/2 -translate-x-1/2 bottom-1 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0.0) 75%)",
            boxShadow: "0 0 14px rgba(255,255,255,0.35)",
          }}
        />
      </div>

      {/* ARTISTAS */}
      <section ref={artistasRef} className="relative z-10 bg-transparent">
        <SeccionArtistas />
      </section>
    </div>
  );
}
