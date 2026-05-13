import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function PitchTitles() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Guardar refs ANTES de que SplitText modifique el DOM
    const titleEls = Array.from(root.querySelectorAll(".pitch-title"));

    const splits = [];
    const observers = [];

    // ===========================
    // WORD-BY-WORD REVEAL — IntersectionObserver para evitar el
    // firing prematuro causado por la sección pinneada de IntroToLogo.
    // ScrollTrigger calcula posiciones de scroll y se confunde con el pin.
    // IntersectionObserver detecta visibilidad real en el viewport.
    // ===========================
    titleEls.forEach((el) => {
      const split = new SplitText(el, { type: "words" });
      splits.push(split);

      gsap.set(split.words, {
        y: 64,
        opacity: 0,
        rotationX: -14,
        transformOrigin: "50% 0%",
      });

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          gsap.to(split.words, {
            y: 0,
            opacity: 1,
            rotationX: 0,
            ease: "power3.out",
            duration: 0.85,
            stagger: { each: 0.09, from: "start" },
          });
          observer.disconnect();
        },
        // rootMargin bottom negativo: el título tiene que estar
        // al menos 15% dentro del viewport antes de disparar
        { threshold: 0, rootMargin: "0px 0px -15% 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    // ===========================
    // CONECTORES: LIGHT BEAMS (sin cambios)
    // ===========================
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(min-width: 0px)", () => {
        const connectors = [];

        const buildConnector = (fromEl, toEl) => {
          const isMobile = window.innerWidth < 768;
          const GAP = isMobile ? 14 : 25;

          const startY = fromEl.offsetTop + fromEl.offsetHeight + GAP;
          const endY = toEl.offsetTop - GAP;
          const height = Math.max(0, endY - startY);

          const base = document.createElement("div");
          base.setAttribute("aria-hidden", "true");
          base.className = "absolute left-1/2 -translate-x-1/2 w-[1px] bg-white/5";
          Object.assign(base.style, { top: `${startY}px`, height: `${height}px` });
          root.appendChild(base);

          const prog = document.createElement("div");
          prog.setAttribute("aria-hidden", "true");
          prog.className = "absolute left-1/2 -translate-x-1/2 w-[1px] origin-top";
          Object.assign(prog.style, {
            top: `${startY}px`,
            height: `${height}px`,
            background: "linear-gradient(to bottom, var(--color-secundario) 0%, rgba(222, 229, 160, 0.4) 60%, transparent 100%)",
            boxShadow: "0 0 10px rgba(222, 229, 160, 0.5)",
            zIndex: 10,
          });
          root.appendChild(prog);

          const dot = document.createElement("div");
          dot.setAttribute("aria-hidden", "true");
          dot.className = "absolute left-1/2 -translate-x-1/2 rounded-full";
          Object.assign(dot.style, {
            top: `${startY + height - 3}px`,
            width: "4px",
            height: "4px",
            background: "var(--color-secundario)",
            boxShadow: "0 0 8px var(--color-secundario), 0 0 15px var(--color-secundario)",
            opacity: "0",
            zIndex: 20,
          });
          root.appendChild(dot);

          gsap.set(prog, { scaleY: 0, transformOrigin: "top" });

          const st1 = ScrollTrigger.create({
            trigger: fromEl,
            start: "bottom 60%",
            endTrigger: toEl,
            end: "top 50%",
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(prog, { scaleY: self.progress || 0.0001 }),
          });

          const st2 = ScrollTrigger.create({
            trigger: toEl,
            start: "top 85%",
            end: "top 70%",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(dot, { opacity: self.progress }),
          });

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
              invalidateOnRefresh: true,
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

          for (let i = 0; i < titleEls.length - 1; i++) {
            buildConnector(titleEls[i], titleEls[i + 1]);
          }

          ScrollTrigger.refresh();
        };

        let resizeTimer = null;
        const onBreakpointChange = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(wireAll, 200);
        };

        const mq640 = window.matchMedia("(min-width: 640px)");
        const mq1024 = window.matchMedia("(min-width: 1024px)");
        mq640.addEventListener("change", onBreakpointChange);
        mq1024.addEventListener("change", onBreakpointChange);

        // Delay para que ScrollTrigger procese el pin de IntroToLogo antes de calcular posiciones
        ScrollTrigger.refresh();
        setTimeout(wireAll, 100);

        return () => {
          clearTimeout(resizeTimer);
          mq640.removeEventListener("change", onBreakpointChange);
          mq1024.removeEventListener("change", onBreakpointChange);
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
      splits.forEach((s) => s.revert());
      observers.forEach((obs) => obs.disconnect());
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-col items-center gap-[15svh] md:gap-[25vh] lg:gap-[40vh] py-20 md:py-10"
      style={{ perspective: "1000px" }}
    >
      <h3 className="pitch-title font-medium tracking-tight text-white font-inter text-[clamp(2.5rem,6vw,7rem)] max-w-4xl text-center leading-[1.1]">
        Hecho por y para <br />
        <span className="cursiva text-secundario">artistas</span>
      </h3>

      <h3 className="pitch-title font-medium tracking-tight text-white font-inter text-[clamp(2.5rem,6vw,7rem)] max-w-4xl text-center leading-[1.1]">
        Fundado en 2021 <br />
        en el <span className="cursiva text-secundario">Río de la Plata</span> <br />
        con una visión
      </h3>

      <h3 className="pitch-title font-medium tracking-tight text-white font-inter text-[clamp(2.5rem,6vw,7rem)] max-w-4xl text-center leading-[1.1]">
        Desarrollar y dar a conocer <span className="cursiva text-secundario">talentos</span>
      </h3>
    </div>
  );
}
