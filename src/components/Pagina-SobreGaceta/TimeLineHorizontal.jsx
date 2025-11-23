// TimeLineHorizontal.jsx
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GACETA_TIMELINE } from "./data";

gsap.registerPlugin(ScrollTrigger);

/* ===== CONST ===== */
const LINE_TOP = 160;
const GAP_BELOW = 32;
const CARD_W = 320;
const CARD_GAP = 64;
const COL_MIN = 960;
const TAIL_FACTOR = 0.5;

const ENTER_DUR = 0.55;
const ENTER_EASE = "power2.out";

/* ===== HELPERS ===== */
const viewportW = (el) =>
  el && el.getBoundingClientRect
    ? el.getBoundingClientRect().width
    : window.innerWidth;

const widthForYear = (events) =>
  Math.max(COL_MIN, 360 + events.length * (CARD_W + CARD_GAP));

function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/* ===== COMPONENTE PRINCIPAL (DESKTOP ONLY) ===== */
export default function TimeLineHorizontal({ data = GACETA_TIMELINE }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const rowRef = useRef(null);

  const yearFrontRef = useRef(null);
  const yearBackRef = useRef(null);
  const miniRailRef = useRef(null);
  const miniKnobRef = useRef(null);
  const miniBubbleRef = useRef(null);

  const moveTweenRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);

  // info acumulada de anchos por año
  const meta = useMemo(() => {
    const cols = data.map((y) => widthForYear(y.events));
    const cumLeft = cols.map((_, i) =>
      cols.slice(0, i).reduce((a, b) => a + b, 0)
    );
    const sumCols = cols.reduce((a, b) => a + b, 0);
    return { cols, cumLeft, sumCols };
  }, [data]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const row = rowRef.current;
    if (!section || !track || !row) return;

    const yearF = yearFrontRef.current;
    const yearB = yearBackRef.current;
    const rail = miniRailRef.current;
    const knob = miniKnobRef.current;
    const bubble = miniBubbleRef.current;

    if (!yearF || !yearB || !rail || !knob || !bubble) return;

    // medidas
    const vw = viewportW(section);
    const totalColsW = meta.sumCols;
    const totalW = Math.round(totalColsW + vw * TAIL_FACTOR);

    track.style.width = `${totalW}px`;
    row.style.width = `${totalColsW}px`;

    const maxX = () => Math.max(0, totalW - viewportW(section));

    // HUD año gigante
    yearF.textContent = String(data[0]?.year ?? "");
    gsap.set([yearF, yearB], {
      x: 0,
      opacity: (i) => (i === 0 ? 1 : 0),
      force3D: true,
    });

    const thresholds = meta.cumLeft.map((left) =>
      Math.max(0, left - viewportW(section) / 2)
    );
    let currentIdx = 0;

    const bumpTo = (idx) => {
      if (idx === currentIdx) return;
      const nextYear = data[idx]?.year;
      if (nextYear == null) return;

      yearB.textContent = String(nextYear);
      const d = 0.22;

      const tl = gsap.timeline();
      tl.to(yearF, { x: -24, opacity: 0, duration: d, ease: "power2.out" }, 0)
        .fromTo(
          yearB,
          { x: 24, opacity: 0 },
          { x: 0, opacity: 1, duration: d, ease: "power2.out" },
          0
        )
        .add(() => {
          yearF.textContent = yearB.textContent;
          gsap.set(yearB, { opacity: 0, x: 0 });
          gsap.set(yearF, { opacity: 1, x: 0 });
        });

      currentIdx = idx;
    };

    const handleYearBump = () => {
      const x = -gsap.getProperty(track, "x");
      let idx = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (x >= thresholds[i] + 12) idx = i;
        else break;
      }
      bumpTo(idx);
    };

    // MINI HUD
    const qKnobX = gsap.quickTo(knob, "x", {
      duration: 0.15,
      ease: "power2.out",
    });
    const qBubbleLeft = gsap.quickTo(bubble, "left", {
      duration: 0.15,
      ease: "power2.out",
    });

    const updateMiniHUD = (p = 0) => {
      const rw = rail.getBoundingClientRect().width || 1;
      const kw = knob.getBoundingClientRect().width || 14;
      const usable = Math.max(0, rw - kw);
      const x = Math.max(0, Math.min(usable, p * usable));
      qKnobX(x);
      qBubbleLeft(x + kw / 2);

      const yearPos = meta.cumLeft.map((l) =>
        meta.sumCols ? l / meta.sumCols : 0
      );
      let idx = 0;
      for (let i = 0; i < yearPos.length; i++) {
        if (p >= yearPos[i]) idx = i;
        else break;
      }
      bubble.textContent = String(data[idx]?.year ?? "");
    };

    // TIMELINE pin + tween que mueve todo el track
    gsap.set(track, { x: 0, force3D: true, willChange: "transform" });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${maxX()}`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        pinSpacing: true,
        fastScrollEnd: true,
        onUpdate: (self) => {
          updateMiniHUD(self.progress);
          handleYearBump();
        },
        onRefresh: (self) => {
          updateMiniHUD(self?.progress ?? 0);
          handleYearBump();
        },
      },
    });

    const moveTween = tl.to(track, { x: () => -maxX(), ease: "none" });
    moveTweenRef.current = moveTween;
    setContainerReady(true);

    // refresh robusto (media + fonts + resize)
    const doRefresh = () => ScrollTrigger.refresh();
    const mediaEls = row.querySelectorAll("img, video");

    mediaEls.forEach((el) => {
      if (el.tagName === "IMG") {
        if (el.complete) return;
        el.addEventListener("load", doRefresh, { once: true });
        el.addEventListener("error", doRefresh, { once: true });
      } else if (el.tagName === "VIDEO") {
        if (el.readyState >= 2) return;
        el.addEventListener("loadeddata", doRefresh, { once: true });
        el.addEventListener("error", doRefresh, { once: true });
      }
    });

    if (document.fonts?.ready) document.fonts.ready.then(doRefresh);

    const ro = new ResizeObserver(() => {
      updateMiniHUD(tl.scrollTrigger?.progress ?? 0);
      doRefresh();
    });
    ro.observe(section);
    ro.observe(row);

    setTimeout(doRefresh, 200);

    return () => {
      ro.disconnect();
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
      moveTweenRef.current = null;
      setContainerReady(false);
    };
  }, [data, meta]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100vh] overflow-hidden bg-black text-white"
    >
      {/* HUD años grande */}
      <div className="fixed top-8 left-0 right-0 z-[70] pointer-events-none flex justify-center">
        <div className="relative h-[96px] w-[420px]">
          <div
            ref={yearFrontRef}
            className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none text-white/10 select-none"
          />
          <div
            ref={yearBackRef}
            className="absolute inset-0 flex items-center justify-center text-[120px] font-black leading-none text-white/10 select-none"
          />
        </div>
      </div>

      {/* MINI-TIMELINE */}
      <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-10 z-[30]">
        <div
          ref={miniRailRef}
          className="relative h-[2px] w-[50vw] bg-white/20 rounded"
        >
          {meta.cols.map((_, i) => {
            const leftPct = (meta.cumLeft[i] / meta.sumCols) * 100;
            return (
              <div
                key={`tick-${i}`}
                className="absolute -top-[6px] h-[14px] w-[2px] bg-white/35"
                style={{ left: `calc(${leftPct}% - 1px)` }}
              />
            );
          })}
          {data.map((y, i) => {
            const leftPct = (meta.cumLeft[i] / meta.sumCols) * 100;
            return (
              <div
                key={`label-${y.year}`}
                className="absolute top-3 -translate-x-1/2 text-[11px] tracking-wide text-white/60"
                style={{ left: `${leftPct}%` }}
              >
                {y.year}
              </div>
            );
          })}
          <div
            ref={miniKnobRef}
            className="absolute -top-[6px] h-[14px] w-[14px] rounded-full bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.55)]"
            style={{ transform: "translateX(0px)" }}
          />
          <div
            ref={miniBubbleRef}
            className="absolute -top-10 px-2 py-0.5 rounded-full bg-white/8 text-white/80 text-xs backdrop-blur-sm border border-white/10"
            style={{ transform: "translateX(-50%)" }}
          >
            {data[0]?.year ?? ""}
          </div>
        </div>
      </div>

      {/* Línea base horizontal */}
      <div className="absolute left-0 right-0" style={{ top: LINE_TOP }}>
        <div className="h-[2px] bg-white/25 relative overflow-hidden" />
      </div>

      {/* TRACK + ROW */}
      <div
        ref={trackRef}
        className="absolute inset-0 pl-[10vw] pr-[40vw]"
        style={{
          paddingTop: LINE_TOP,
          paddingBottom: 200,
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        <div ref={rowRef} className="flex items-start gap-24">
          {data.map((block) => (
            <YearStrip
              key={block.year}
              year={block.year}
              events={block.events}
              containerAnim={moveTweenRef}
              containerReady={containerReady}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== SUBCOMPONENTES ===== */

function YearStrip({ year, events, containerAnim, containerReady }) {
  const width = widthForYear(events);
  const stripRef = useRef(null);

  useLayoutEffect(() => {
    const root = stripRef.current;
    const ca = containerAnim?.current;
    if (!root) return;

    const items = root.querySelectorAll("[data-ev]");

    // estado inicial de las cards
    gsap.set(items, {
      autoAlpha: 0,
      y: 28,
      scale: 0.96,
      rotate: (i) => gsap.utils.random(-2, 2, 0.25),
      transformOrigin: "50% 60%",
      force3D: true,
      willChange: "transform, opacity",
    });

    if (!ca || !containerReady) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(items).forEach((el, idx) => {
        gsap.fromTo(
          el,
          {
            autoAlpha: 0,
            y: 28,
            scale: 0.96,
            rotate: gsap.utils.random(-2, 2, 0.25),
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: ENTER_DUR,
            ease: ENTER_EASE,
            overwrite: "auto",
            delay: (idx % 4) * 0.02,
            scrollTrigger: {
              trigger: el,
              containerAnimation: ca,
              start: "left 85%",
              end: "left 60%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, stripRef);

    return () => ctx.revert();
  }, [containerAnim, containerReady, year, events]);

  return (
    <div
      ref={stripRef}
      className="relative shrink-0"
      data-year-col
      style={{ width }}
    >
      <div className="flex items-start gap-16">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ ev }) {
  return (
    <div
      className="relative min-w-[320px]"
      style={{ containIntrinsicSize: "320px 260px" }}
    >
      {/* línea que baja desde la timeline */}
      <div
        className="w-px mx-auto bg-white/25"
        style={{ height: GAP_BELOW }}
      />

      <article
        data-ev
        className="w-[320px]"
        style={{
          willChange: "transform, opacity",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">
          {fmt(ev.date)}
        </p>
        <h3 className="mt-1 text-base font-semibold leading-snug">
          {ev.title}
        </h3>

        {ev.desc && (
            <p className="mt-3 text-sm text-white/75 leading-relaxed">
              {ev.desc}
            </p>
          )}

          {ev.media?.type === "image" && (
            <img
              src={ev.media.src}
              alt={ev.media.alt || ev.title}
              className="mt-4 w-full aspect-[1/1] object-cover rounded-xl ring-1 ring-white/10"
              loading="lazy"
              decoding="async"
            />
          )}

          {ev.media?.type === "video" && (
            <video
              className="mt-4 w-full aspect-[1/1] object-cover rounded-xl ring-1 ring-white/10"
              src={ev.media.src}
              muted
              playsInline
              preload="metadata"
            />
          )}

      </article>
    </div>
  );
}
