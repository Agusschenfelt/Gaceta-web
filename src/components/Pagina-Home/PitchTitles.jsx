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
      // CONECTORES: LIGHT BEAMS (HACES DE LUZ)
      // ===========================
      mm.add("(min-width: 0px)", () => {
        const connectors = [];

        const buildConnector = (fromEl, toEl) => {
          const GAP = 25; // Espacio ajustado
          const isMobile = window.innerWidth < 768;

          const startY = fromEl.offsetTop + fromEl.offsetHeight + GAP;
          const endY = toEl.offsetTop - GAP;
          const height = Math.max(0, endY - startY);

          // 1. GUÍA BASE (Casi invisible)
          const base = document.createElement("div");
          base.className = "absolute left-1/2 -translate-x-1/2 w-[1px] bg-white/5";
          Object.assign(base.style, {
            top: `${startY}px`,
            height: `${height}px`,
          });
          root.appendChild(base);

          // 2. LUZ PRINCIPAL (Dorado Gaceta)
          const prog = document.createElement("div");
          prog.className = "absolute left-1/2 -translate-x-1/2 w-[1px] origin-top";
          Object.assign(prog.style, {
            top: `${startY}px`,
            height: `${height}px`,
            // Degradado sutil: Dorado intenso -> Dorado suave -> Transparente
            background: "linear-gradient(to bottom, #dee5a0 0%, rgba(222, 229, 160, 0.4) 60%, transparent 100%)",
            // Glow para efecto de luz
            boxShadow: "0 0 10px rgba(222, 229, 160, 0.5)",
            zIndex: 10
          });
          root.appendChild(prog);

          // 3. PUNTO DE LUZ (Partícula líder)
          const dot = document.createElement("div");
          dot.className = "absolute left-1/2 -translate-x-1/2 rounded-full";
          Object.assign(dot.style, {
            top: `${startY + height - 3}px`,
            width: "4px",   // Más fino y elegante
            height: "4px",
            background: "#dee5a0",
            boxShadow: "0 0 8px #dee5a0, 0 0 15px #dee5a0", // Doble glow
            opacity: "0",
            zIndex: 20
          });
          root.appendChild(dot);

          gsap.set(prog, { scaleY: 0, transformOrigin: "top" });

          // Animación de la línea (Se dibuja al scrollear)
          const st1 = ScrollTrigger.create({
            trigger: fromEl,
            start: "bottom 60%",
            endTrigger: toEl,
            end: "top 50%",
            scrub: 0.5,
            onUpdate: (self) =>
              gsap.set(prog, { scaleY: self.progress || 0.0001 }),
          });

          // Animación del punto (Aparece al final)
          const st2 = ScrollTrigger.create({
            trigger: toEl,
            start: "top 85%",
            end: "top 70%",
            scrub: true,
            onUpdate: (self) => gsap.set(dot, { opacity: self.progress }),
          });

          // Pulso "vivo" (Solo desktop)
          let pulse = null;
          if (!isMobile) {
            pulse = gsap.to(dot, {
              scale: 1.8,
              opacity: 0.8,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              duration: 1.5,
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
      className="relative flex flex-col items-center gap-[30vh] md:gap-[40vh] py-24 md:py-10"
    >
      <h3 className="pitch-title font-medium tracking-tight text-white titulo font-inter text-[clamp(2rem,4.5vw,3.5rem)] max-w-4xl text-center leading-[1.1]">
        Hecho por y para <br />
        <span className="cursiva text-[#dee5a0]">artistas</span>
      </h3>

      <h3 className="pitch-title font-medium tracking-tight text-white titulo font-inter text-[clamp(2rem,4.5vw,3.5rem)] max-w-4xl text-center leading-[1.1]">
        Fundado en 2021 <br />
        en el <span className="cursiva text-[#dee5a0]">Río de la Plata</span> <br />
        con una visión
      </h3>

      <h3 className="pitch-title font-medium tracking-tight text-white titulo font-inter text-[clamp(2rem,4.5vw,3.5rem)] max-w-4xl text-center leading-[1.1]">
        Desarrollar y dar a conocer <span className="cursiva text-[#dee5a0]">talentos</span>
      </h3>
    </div>
  );
}