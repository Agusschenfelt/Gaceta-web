import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const SIGNATURE_D = `M2.00052 42.1502C2.11525 41.8781 2.72831 40.8353 5.07823 37.9461C6.70582 35.945 8.37276 33.8583 9.60664 32.2956C10.2043 31.5387 11.6055 29.6038 16.0662 24.4247C19.3447 20.618 25.1037 14.7904 29.0347 10.9934C32.9658 7.19644 35.0016 5.70166 36.7746 4.62703C41.6023 1.70083 45.6043 1.88263 47.8149 2.11997C48.974 2.24441 49.5009 4.39096 49.8916 6.58735C50.1773 8.1939 49.6554 10.0571 49.0825 11.9458C48.4513 14.0269 47.1267 16.1969 45.2952 18.9054C44.2221 20.4923 42.7192 22.4149 40.8228 25.3128C38.9264 28.2107 36.6468 32.0013 35.2882 34.349C32.7603 38.717 31.8248 40.7242 29.9792 44.1062C29.4412 45.0921 29.1864 45.7659 28.8857 46.1599C28.4303 46.7565 28.5794 44.3601 28.2364 42.4205C27.71 39.4439 27.5458 34.5199 27.3738 33.8755C27.3587 33.8189 27.3153 34.5272 27.4416 39.4302C27.5678 44.3333 27.8204 53.4648 27.9389 58.2916C28.0575 63.1184 28.0345 63.3636 28.0131 63.02C27.858 60.5327 28.6568 58.1625 29.8505 53.9574C31.2784 48.9274 32.5422 44.926 33.6486 42.7154C34.5929 40.8289 35.3397 39.5647 35.8406 38.7323C36.3425 37.898 38.4462 35.9747 41.4016 33.3713C44.2156 30.8924 45.7768 29.9481 46.5797 29.0027C47.2924 28.1636 49.3438 28.1896 50.7566 28.5727C51.2502 28.7066 51.4965 30.1463 51.8215 33.1748C52.0362 35.1753 51.9632 38.1496 51.5794 41.4002C51.1957 44.6509 50.4041 48.0961 49.7906 50.7176C48.78 55.0359 48.0763 58.5852 47.6575 61.4501C47.3912 63.272 47.1513 64.2706 46.952 65.8376C46.8981 66.2616 47.1431 64.6383 47.7768 63.0233C49.2721 59.2121 50.7426 55.5638 51.7799 52.7726C52.3922 51.1249 53.416 49.1008 55.7796 44.9988C58.1433 40.8969 61.8763 34.8021 64.5326 30.7915C68.4405 24.8912 70.421 22.8802 71.5297 21.6231C73.6819 19.1829 75.9648 17.0549 77.4903 15.3088C80.8441 11.4701 82.4142 10.0736 83.188 9.29251C83.3875 9.11202 83.5822 8.96051 83.8713 8.75049C84.1604 8.54047 84.538 8.27653 85.0346 7.99059`;

const PruebasPage = ({
  embedUrl = "https://www.youtube.com/embed/E4vBVc0kisc?start=3701&autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&fs=0",
  showLocation = "Buenos Aires",
}) => {
  const rootRef = useRef(null);
  const boxRef = useRef(null);
  const lightRef = useRef(null);
  const signaturePathRef = useRef(null);
  const shardsRef = useRef([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(pointer:fine)");
      setIsDesktop(mq.matches);
      const handler = (e) => setIsDesktop(e.matches);
      mq.addEventListener && mq.addEventListener("change", handler);
      return () =>
        mq.removeEventListener && mq.removeEventListener("change", handler);
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(rootRef.current, {
        opacity: 0,
        y: 40,
        duration: 1.1,
      })
        .from(
          ".ln-title",
          {
            opacity: 0,
            y: 12,
            stagger: 0.12,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          boxRef.current,
          {
            opacity: 0,
            scale: 0.94,
            duration: 1,
          },
          "-=0.4"
        );

      // firma
      if (signaturePathRef.current) {
        const path = signaturePathRef.current;
        const length = path.getTotalLength();

        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });

        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.out",
          delay: 0.7,
        });

        gsap.to(path, {
          opacity: 0.35,
          duration: 2,
          delay: 2.7,
          ease: "power2.out",
        });
      }

      // light sweep
      if (lightRef.current) {
        gsap.to(lightRef.current, {
          x: "130%",
          duration: 6,
          ease: "none",
          repeat: -1,
          repeatDelay: 1.8,
        });
      }

      // halo breathing
      gsap.to(".ln-halo", {
        scale: 1.05,
        opacity: 0.9,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // shards orbitando
      shardsRef.current.forEach((el, i) => {
        if (!el) return;
        const dir = i % 2 === 0 ? 1 : -1;
        gsap.to(el, {
          rotation: dir * 18,
          x: dir * 18,
          y: dir * -10,
          duration: 7 + i * 2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      });

      // glitch suave cada tanto
      if (boxRef.current) {
        const glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 5 });
        glitchTl
          .to(
            boxRef.current,
            {
              x: -2,
              y: 1,
              duration: 0.03,
              ease: "none",
            },
            0
          )
          .to(
            boxRef.current,
            {
              x: 2,
              y: -1,
              duration: 0.03,
              ease: "none",
            },
            0.04
          )
          .to(
            boxRef.current,
            {
              x: 0,
              y: 0,
              duration: 0.04,
              ease: "none",
            },
            0.08
          )
          .to(
            ".ln-video-overlay",
            {
              opacity: 0.5,
              duration: 0.05,
              ease: "none",
            },
            0
          )
          .to(
            ".ln-video-overlay",
            {
              opacity: 1,
              duration: 0.1,
              ease: "none",
            },
            0.06
          );
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e) => {
    if (!isDesktop) return;
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const maxDeg = 7;
    setTilt({
      x: x * maxDeg,
      y: -y * maxDeg,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      ref={rootRef}
      className="relative min-h-screen w-full overflow-hidden bg-black text-white"
    >
      {/* fondo */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_#201a3a_0,_#05010f_35%,_#010005_70%,_#000_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="ln-halo absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="ln-halo absolute bottom-[-6rem] left-[12%] h-72 w-72 rounded-full bg-white/6 blur-[80px]" />
        <div className="ln-halo absolute bottom-[-5rem] right-[10%] h-64 w-64 rounded-full bg-white/8 blur-[70px]" />
      </div>

      {/* barra listening */}
      <div className="relative z-20 flex justify-center pt-6">
        <p className="ln-title flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.3em] text-white/70">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          Live • Listening Night • {showLocation}
        </p>
      </div>

      {/* contenido */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col items-center justify-center px-4 pb-10 pt-6 sm:px-6 md:px-8">
        {/* título pequeño */}
        <h1 className="ln-title mb-6 text-center text-[11px] font-medium uppercase tracking-[0.35em] text-white/55">
          RV — Pre escucha oficial
        </h1>

        {/* caja + tilt */}
        <div
          className="relative w-full max-w-4xl"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* glow exterior */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="mx-auto h-full w-[90%] rounded-[2.3rem] bg-black/80 shadow-[0_0_120px_rgba(150,150,255,0.45)] blur-3xl" />
          </div>

          {/* anillos espejo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0">
            <div className="hidden sm:block h-[115%] w-[80%] rounded-[3rem] border border-white/8 blur-xl" />
            <div className="hidden sm:block absolute h-[105%] w-[88%] rounded-[3.2rem] border border-white/5 blur-[18px]" />
          </div>

          {/* shards de vidrio */}
          <div className="pointer-events-none absolute inset-0">
            <div
              ref={(el) => (shardsRef.current[0] = el)}
              className="absolute -left-10 top-1/3 hidden h-16 w-32 rounded-[2rem] bg-white/10 blur-2xl sm:block"
            />
            <div
              ref={(el) => (shardsRef.current[1] = el)}
              className="absolute -right-8 top-2/3 hidden h-14 w-28 rounded-[2rem] bg-white/12 blur-xl sm:block"
            />
          </div>

          {/* caja principal */}
          <div
            ref={boxRef}
            className="mx-auto aspect-[16/9] w-[95%] sm:w-[92%] md:w-[88%]"
            style={
              isDesktop
                ? {
                    transform: `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                    transition: "transform 180ms ease-out",
                    transformStyle: "preserve-3d",
                  }
                : undefined
            }
          >
            <div
              className="
                relative h-full w-full overflow-hidden rounded-[1.8rem]
                border border-white/20 bg-white/[0.02]
                shadow-[0_25px_90px_rgba(0,0,0,0.9)]
              "
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* vídeo */}
              <div className="relative h-full w-full">
                <iframe
                  src={embedUrl}
                  title="Listening Night Live"
                  className="pointer-events-none h-full w-full rounded-[1.8rem]"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />

                {/* capa transparente para bloquear cualquier click al player original */}
                <div className="absolute inset-0 pointer-events-auto cursor-default" />

                {/* overlay para color / glitch / textura */}
                <div className="ln-video-overlay pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/70 via-black/45 to-black/80" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light bg-[linear-gradient(120deg,rgba(255,255,255,0.35)_0,transparent_12%,transparent_88%,rgba(255,255,255,0.4)_100%)]" />
              </div>


              {/* light sweep */}
              <div
                ref={lightRef}
                className="pointer-events-none absolute -inset-y-10 -left-1/2 w-1/2 rotate-[18deg] bg-gradient-to-r from-transparent via-white/28 to-transparent blur-3xl opacity-70"
                style={{ transform: "translateZ(50px)" }}
              />

              {/* firma */}
              <div
                className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
                style={{ transform: "translateZ(55px)" }}
              >
                <svg
                  viewBox="0 0 90 70"
                  className="w-[80px] sm:w-[95px] opacity-80"
                  style={{
                    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.65))",
                  }}
                >
                  <path
                    ref={signaturePathRef}
                    d={SIGNATURE_D}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* badge live */}
              <div
                className="pointer-events-none absolute left-4 top-3 flex items-center gap-2 text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.28em] text-white/75"
                style={{ transform: "translateZ(40px)" }}
              >
                <span className="flex h-2 w-6 items-center justify-start rounded-full bg-red-500/25">
                  <span className="ml-[2px] h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                <span>Live</span>
              </div>

              {/* “The Glass Box” */}
              <div
                className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center"
                style={{ transform: "translateZ(40px)" }}
              >
                <p className="rounded-full border border-white/18 bg-black/70 px-4 sm:px-5 py-1 text-[8px] sm:text-[9px] uppercase tracking-[0.28em] text-white/75">
                  The Glass Box — Digital Reflection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* disclaimer */}
        <p className="mt-6 max-w-md text-center text-[10px] text-white/40 px-4">
          Este portal no transmite el álbum. Solo refleja el ambiente de la
          noche de preescucha.
        </p>
      </div>
    </section>
  );
};

export default PruebasPage;
