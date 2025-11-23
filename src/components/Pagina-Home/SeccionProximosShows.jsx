// SeccionProximosShows.jsx — Video de fondo + fade con scroll (performante)
import React, { useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Props:
 *  - start = "top 80%"   // dónde empieza a aparecer
 *  - end   = "bottom top"// dónde termina (y empieza a desvanecerse)
 *  - appearWindow = [0.0, 0.25] // tramo relativo del progreso en el que hace fade-in
 *  - disappearWindow = [0.75, 1.0] // tramo para fade-out
 *  - sources: [{src,type}]       // webm/mp4 en orden de preferencia
 *  - poster: string              // frame placeholder liviano
 */

// 👇 helper para parsear fechas como LOCAL, sin UTC
const parseLocalDate = (d) => {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day); // año, mesIndexadoDesdeCero, día
};

export default function SeccionProximosShows({
  start = "top 85%",
  end = "bottom top",
  appearWindow = [0.0, 0.22],
  disappearWindow = [0.78, 1.0],
  sources = [
    { src: "/assets/ara-saltando.mov", type: "video/quicktime" },
    { src: "/assets/hero-bg.mp4", type: "video/mp4" },
  ],
  poster = "/assets/hero-bg-poster.jpg",
}) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const headerRef = useRef(null);
  const listRef = useRef(null);

  // data de shows
  const shows = useMemo(() => {
    const data = [
      {
        id: "2025-03-19-bue-tangente",
        artist: "ARA",
        date: "2025-03-19",
        city: "Buenos Aires",
        country: "Argentina",
        venue: "La Tangente",
        soldOut: true,
      },
      {
        id: "2025-03-31-mad-sol",
        artist: "Ramma",
        date: "2025-03-31",
        city: "Madrid",
        country: "España",
        venue: "Sala El Sol",
        soldOut: true,
      },
      {
        id: "2025-04-06-bcn-sauvage",
        artist: "Ramma",
        date: "2025-04-06",
        city: "Barcelona",
        country: "España",
        venue: "Sala Sauvage",
        soldOut: true,
      },
      {
        id: "2025-04-11-bue-artmedia",
        artist: "Ramma",
        date: "2025-04-11",
        city: "Buenos Aires",
        country: "Argentina",
        venue: "C Art Media",
        soldOut: true,
      },
      {
        id: "2025-07-21-mad-uni",
        artist: "Ramma",
        date: "2025-07-21",
        city: "Madrid",
        country: "España",
        venue: "Sala Uni",
        soldOut: true,
      },
      {
        id: "2025-08-07-mvd-magnolio",
        artist: "Valuto",
        date: "2025-08-07",
        city: "Montevideo",
        country: "Uruguay",
        venue: "Magnolio Sala",
        soldOut: true,
      },
      {
        id: "2025-08-24-bue-tangente",
        artist: "Valuto",
        date: "2025-08-24",
        city: "Buenos Aires",
        country: "Argentina",
        venue: "La Tangente",
        soldOut: true,
      },
      {
        id: "2025-08-30-men-nido",
        artist: "Ramma",
        date: "2025-08-30",
        city: "Mendoza",
        country: "Argentina",
        venue: "Club Nido",
        soldOut: true,
      },
      {
        id: "2025-09-05-cor-paraguay",
        artist: "Ramma",
        date: "2025-09-05",
        city: "Córdoba",
        country: "Argentina",
        venue: "Club Paraguay",
        soldOut: true,
      },
      {
        id: "2025-09-06-ros-guemes",
        artist: "Ramma",
        date: "2025-09-06",
        city: "Rosario",
        country: "Argentina",
        venue: "C.C. Güemes",
        soldOut: true,
      },
      {
        id: "2025-10-04-mvd-museo",
        artist: "Ramma",
        date: "2025-10-04",
        city: "Montevideo",
        country: "Uruguay",
        venue: "Sala del Museo",
        soldOut: true,
      },
      {
        id: "2025-10-24-mdp-vorterix",
        artist: "Ramma",
        date: "2025-10-24",
        city: "Mar del Plata",
        country: "Argentina",
        venue: "Vorterix",
        soldOut: true,
      },
      {
        id: "2025-10-25-lp-opera",
        artist: "Ramma",
        date: "2025-10-25",
        city: "La Plata",
        country: "Argentina",
        venue: "Teatro Ópera",
        soldOut: true,
      },
      {
        id: "2025-11-25-bue-artmedia",
        artist: "Ramma",
        date: "2025-11-25",
        city: "Buenos Aires",
        country: "Argentina",
        venue: "C Art Media",
        soldOut: true,
      },
      {
        id: "??-ara",
        artist: "ARA",
        date: null,
        city: "Buenos Aires",
        country: "Argentina",
        venue: "???",
        soldOut: false,
      },
    ];

    return data
      .map((s) => ({ ...s, _dt: parseLocalDate(s.date) }))
      .sort((a, b) => {
        // sin fecha → al final
        if (!a._dt && !b._dt) return 0;
        if (!a._dt) return 1; // a va después
        if (!b._dt) return -1; // b va después
        return a._dt.getTime() - b._dt.getTime();
      });
  }, []);

  const fmtDDMM = (dt, raw) => {
    // si no hay fecha → hype
    if (!raw) return "??/??"; // o "xx/xx/26"

    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  };

  // Lazy-load de <source> reales cuando entra cerca del viewport
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    let loaded = false;

    const attachSources = () => {
      if (loaded) return;
      loaded = true;
      sources.forEach(({ src, type }) => {
        const s = document.createElement("source");
        s.src = src;
        s.type = type;
        vid.appendChild(s);
      });
      vid.load();
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting || e.intersectionRatio > 0) attachSources();
        });
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(vid);
    return () => io.disconnect();
  }, [sources]);

  useGSAP(() => {
    const section = sectionRef.current;
    const video = videoRef.current;

    // kill prev triggers con mismo id (HMR/StrictMode)
    ScrollTrigger.getAll()
      .filter(
        (t) =>
          t.vars?.id?.startsWith?.("shows-video") ||
          t.vars?.id?.startsWith?.("shows-batch") ||
          t.vars?.id === "shows-header"
      )
      .forEach((t) => t.kill());

    // setup video
    if (video) {
      video.muted = true;
      video.playsInline = true;
      // arranque robusto
      const tryPlay = () => video.play().catch(() => {});
      video.addEventListener("loadeddata", tryPlay, { once: true });
      video.addEventListener("canplay", tryPlay, { once: true });
    }

    // estado base (sin blur; sólo opacity/scale)
    gsap.set(video, {
      opacity: 0,
      scale: 1.02,
      willChange: "opacity,transform",
      force3D: true,
    });

    // quickSetters para mutar sin crear tweens por frame
    const setOpacity = gsap.quickSetter(video, "opacity");
    const setScale = gsap.quickSetter(video, "scale");

    // ventanas para aparecer/desaparecer
    const inA = Math.min(...appearWindow);
    const inB = Math.max(...appearWindow);
    const outA = Math.min(...disappearWindow);
    const outB = Math.max(...disappearWindow);

    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const invLerp = (a, b, v) => (v - a) / (b - a);

    let rafId = null;
    let lastP = -1;

    const applyByProgress = (p) => {
      if (p === lastP) return;
      lastP = p;

      // opacity
      let o;
      if (p <= inA) o = 0;
      else if (p < inB) o = clamp(invLerp(inA, inB, p), 0, 1); // 0→1
      else if (p <= outA) o = 1;
      else if (p < outB) o = 1 - clamp(invLerp(outA, outB, p), 0, 1); // 1→0
      else o = 0;

      // scale (ligerísimo para dar “profundidad” sin costar)
      const s = 1.02 - o * 0.02; // 1.02→1.00

      setOpacity(o);
      setScale(s);
    };

    const st = ScrollTrigger.create({
      id: "shows-video-st",
      trigger: section,
      start,
      end,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          applyByProgress(self.progress);
          if (self.isActive) video?.play().catch(() => {});
          else video?.pause();
        });
      },
    });

    // títulos (no-scrub, liviano)
    if (headerRef.current) {
      const tl = gsap.timeline({
        id: "shows-header",
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "top 75%",
          toggleActions: "play none none reverse",
        },
      });
      const h2 = headerRef.current.querySelector("h2");
      const sub = headerRef.current.querySelector("[data-sub]");
      gsap.set([h2, sub], {
        opacity: 0,
        y: 24,
        willChange: "transform,opacity",
        force3D: true,
      });
      tl.to(sub, { opacity: 1, y: 0, duration: 0.3 }).to(
        h2,
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.1"
      );
    }

    // filas en batch
    if (listRef.current) {
      const rows = listRef.current.querySelectorAll("[data-row]");
      gsap.set(rows, {
        opacity: 0,
        y: 40,
        willChange: "transform,opacity",
        force3D: true,
      });
      ScrollTrigger.batch(rows, {
        id: "shows-batch",
        start: "top 90%",
        end: "bottom 70%",
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.1,
            stagger: { each: 0.04, from: "start" },
            ease: "power2.out",
            overwrite: true,
          }),
        onLeaveBack: (batch) =>
          gsap.to(batch, {
            opacity: 0,
            y: 40,
            duration: 0.18,
            stagger: { each: 0.04, from: "end" },
            ease: "power1.out",
            overwrite: true,
          }),
      });
    }

    // pausar si la pestaña no está visible
    const onVis = () =>
      document.hidden
        ? video?.pause()
        : st.isActive && video?.play().catch(() => {});
    document.addEventListener("visibilitychange", onVis);

    // refresh razonables
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    document.fonts?.ready?.then(refresh);
    const ro = new ResizeObserver(refresh);
    ro.observe(section);
    video?.addEventListener("loadeddata", refresh, { once: true });

    return () => {
      st.kill();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("load", refresh);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [start, end, appearWindow, disappearWindow]);

  return (
    <section
      id="shows"
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#0e0e0f] text-white min-h-[120vh] rounded-t-[2rem] lg:rounded-t-[2.5rem]"
    >
      {/* VIDEO de fondo */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          disablePictureInPicture
          controls={false}
          webkit-playsinline
          x5-playsinline
        />
        {/* gradiente para legibilidad del contenido */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-transparent pointer-events-none" />
      </div>

      {/* contenido */}
      <div className="relative z-10 px-6 lg:px-[11.5rem] py-32">
        <header ref={headerRef} className="pb-10">
          <h2 className="titulo text-lg">
            próximos <br />
            <span className="cursiva">shows</span>
          </h2>
        </header>

        <ul ref={listRef} className="space-y-3">
          {shows.map((s, idx) => {
            const key = s.id || `${s.artist}-${s.date}-${idx}`;
            const isMystery = !s.date;
            return (
              <li
                key={key}
                data-row
                className={`group relative grid grid-cols-7 items-center gap-3 rounded-xl px-5 py-6 transition-transform duration-150 hover:-translate-y-[1px]
    ${
      isMystery
        ? "bg-black/50 ring-1 ring-[#853CF7]/50 shadow-[0_0_30px_rgba(133,60,247,0.45)] animate-[pulse_4s_ease-in-out_infinite]"
        : "bg-black/50 ring-1 ring-white/10"
    }`}
              >
                <div
                  className="col-span-2 sm:col-span-1 tabular-nums 
                  text-lg sm:text-4xl cursiva font-black text-white/85 ml-1"
                >
                  {fmtDDMM(s._dt, s.date)}
                </div>

                <div className="col-span-3 flex flex-col gap-1">
                  <span className="cursiva text-base sm:text-[1.4rem] leading-none">
                    {s.artist}
                  </span>
                  <span className="text-sm sm:text-[1.1rem] leading-snug text-white/80">
                    {s.city}, {s.country}
                  </span>
                </div>

                <div className="hidden sm:block col-span-2 text-sm sm:text-lg text-white/60 truncate cursiva">
                  {s.venue}
                </div>

                <div className="col-span-1 sm:col-span-1 flex justify-end">
                  {s.soldOut ? (
                    <span className="text-red-400/90 text-xs sm:text-base line-through font-semibold">
                      SOLD OUT
                    </span>
                  ) : s.ticketsUrl ? (
                    <a
                      href={s.ticketsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-1.5 rounded-full ring-1 ring-white/40 hover:ring-white text-white/85 hover:text-black hover:bg-white transition-colors"
                    >
                      ENTRADAS
                    </a>
                  ) : (
                    <span className="text-white/60">Próx.</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
