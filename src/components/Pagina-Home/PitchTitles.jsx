import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export default function PitchTitles() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const titles = gsap.utils.toArray(".pitch-title");

      // ===========================
      // ANIMACIÓN DE ENTRADA TITULOS
      // ===========================
      titles.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 80, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            ease: "power3.out",
            duration: 1.1,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 35%",
              scrub: 0.5,
            },
          }
        );
      });

      // ===========================
      //  CONECTORES PARA TODAS LAS RESOLUCIONES (VERSION A)
      // ===========================
      mm.add("(min-width: 0px)", () => {
        const connectors = []; // ⬅️ VERSIÓN JS VÁLIDA

        const buildConnector = (fromEl, toEl) => {
          const GAP = 40;
          const isMobile = window.innerWidth < 768;

          const startY = fromEl.offsetTop + fromEl.offsetHeight + GAP;
          const endY = toEl.offsetTop - GAP;
          const height = Math.max(0, endY - startY);

          // base gris
          const base = document.createElement("div");
          base.className =
            "absolute left-1/2 -translate-x-1/2 w-[2px] bg-white/15 rounded-full";
          Object.assign(base.style, {
            top: `${startY}px`,
            height: `${height}px`,
          });
          root.appendChild(base);

          // linea blanca
          const prog = document.createElement("div");
          prog.className =
            "absolute left-1/2 -translate-x-1/2 w-[3px] md:w-[4px] rounded-full origin-top";
          Object.assign(prog.style, {
            top: `${startY}px`,
            height: `${height}px`,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.15) 100%)",
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))",
          });
          root.appendChild(prog);

          // dot final
          const dot = document.createElement("div");
          dot.className = "absolute left-1/2 -translate-x-1/2 rounded-full";
          Object.assign(dot.style, {
            top: `${startY + height - 7}px`,
            width: "14px",
            height: "14px",
            background:
              "radial-gradient(circle, white 0%, rgba(255,255,255,0.7) 40%, transparent 70%)",
            boxShadow: "0 0 14px rgba(255,255,255,0.35)",
            opacity: "0",
          });
          root.appendChild(dot);

          gsap.set(prog, { scaleY: 0, transformOrigin: "top" });

          // progreso linea
          const st1 = ScrollTrigger.create({
            trigger: fromEl,
            start: "bottom 80%",
            endTrigger: toEl,
            end: "top 45%",
            scrub: 0.7,
            onUpdate: (self) =>
              gsap.set(prog, { scaleY: self.progress || 0.0001 }),
          });

          // dot appearing
          const st2 = ScrollTrigger.create({
            trigger: toEl,
            start: "top 85%",
            end: "top 70%",
            scrub: true,
            onUpdate: (self) => gsap.set(dot, { opacity: self.progress }),
          });

          // pulso (solo desktop)
          let pulse = null;
          if (!isMobile) {
            pulse = gsap.to(dot, {
              scale: 1.06,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              duration: 1.2,
              paused: true,
            });

            ScrollTrigger.create({
              trigger: toEl,
              start: "top 85%",
              end: "top 30%",
              onEnter: () => pulse.play(),
              onLeave: () => pulse.pause(0),
              onEnterBack: () => pulse.play(),
              onLeaveBack: () => pulse.pause(0),
            });
          }

          connectors.push({ base, prog, dot, triggers: [st1, st2], pulse });
        };

        // reconstrucción dinámica
        const wireAll = () => {
          connectors.forEach(({ base, prog, dot, triggers, pulse }) => {
            triggers.forEach((t) => t.kill());
            pulse?.kill();
            base.remove();
            prog.remove();
            dot.remove();
          });
          connectors.length = 0;

          for (let i = 0; i < titles.length - 1; i++) {
            buildConnector(titles[i], titles[i + 1]);
          }

          ScrollTrigger.refresh();
        };

        let rAF = null;
        const onResize = () => {
          if (rAF) cancelAnimationFrame(rAF);
          rAF = requestAnimationFrame(wireAll);
        };

        requestAnimationFrame(wireAll);
        window.addEventListener("resize", onResize);

        return () => {
          window.removeEventListener("resize", onResize);
          connectors.forEach(({ base, prog, dot, triggers, pulse }) => {
            triggers.forEach((t) => t.kill());
            pulse?.kill();
            base.remove();
            prog.remove();
            dot.remove();
          });
        };
      });
    }, root);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col items-center gap-[30vh] md:gap-[48vh] py-24 md:py-10"
    >
      <h3
        className="pitch-title font-medium tracking-tight text-white titulo font-inter 
text-[clamp(2.3rem,5vw,4rem)] max-w-4xl text-center leading-[1.04]"
      >
        Hecho por y para <br />
        <span className="cursiva">artistas</span>
      </h3>

      <h3
        className="pitch-title font-medium tracking-tight text-white titulo font-inter 
text-[clamp(2.3rem,5vw,4rem)] max-w-4xl text-center leading-[1.04]"
      >
        Fundado en 2021 <br />
        en el <span className="cursiva">Río de la Plata</span> <br />
        con una visión
      </h3>

      <h3
        className="pitch-title font-medium tracking-tight text-white titulo font-inter 
text-[clamp(2.3rem,5vw,4rem)] max-w-4xl text-center leading-[1.04]"
      >
        Desarrollar y dar a conocer <span className="cursiva">talentos</span>
      </h3>
    </div>
  );
}
