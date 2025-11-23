// SeccionGacetaShop.jsx — versión optimizada rendimiento
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const products = [
  {
    id: "black-logo-tee",
    title: "CON EL UNIFORME PUESTO Official cap",
    price: 22555,
    image: "/assets/valuto-merch.png",
    href: "https://tutienda.tiendanube.com/black-logo-tee",
  },
  {
    id: "white-logo-tee",
    title: "INMORTAL Black Logo Tee",
    price: 35555,
    image: "/assets/ramma-merch-remera.jpg",
    href: "https://tutienda.tiendanube.com/white-logo-tee",
  },
  {
    id: "hoodie-gaceta",
    title: "Zip Hoodie INMORTAL White Logo",
    price: 65555,
    image: "/assets/ramma-merch-hoodie.png",
    href: "https://tutienda.tiendanube.com/hoodie-gaceta",
  },
];

const currency = (n) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

function ProductCard({ p }) {
  return (
    <a
      href={p.href}
      target="_blank"
      rel="noreferrer"
      className="block select-none"
      data-card
    >
      <div data-float className="will-change-transform">
        <div className="relative rounded-[1.2rem] overflow-hidden bg-white/[0.02] ring-1 ring-white/15 transition-colors group hover:ring-white/25">
          {/* IMAGEN */}
          <div className="aspect-[4/5] sm:aspect-[3/4] relative overflow-hidden">
            <img
              src={p.image}
              alt={p.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,.06)_0_1px,transparent_1px_3px)]" />
          </div>

          {/* TEXTO */}
          <div className="px-3 sm:px-4 pt-3.5 pb-2.5">
            <h3 className="text-white/95 font-medium leading-tight uppercase tracking-[.02em] text-xs sm:text-[15px] truncate">
              {p.title}
            </h3>
            <p className="text-white/55 text-[11px] sm:text-[12px] mt-[2px]">
              {currency(p.price)}
            </p>
          </div>

          <div className="mx-4 h-px bg-white/10" />

          {/* BOTÓN */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="relative h-8 sm:h-9 w-full rounded-[8px] bg-white/5 text-white/85 flex items-center justify-center text-[10px] sm:text-[11px] tracking-[.16em] uppercase font-medium transition hover:bg-white/10">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Comprar
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function SeccionGacetaShop() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const titleRef = useRef(null);
  const bgPulseRef = useRef(null);
  const gradientRef = useRef(null);
  const floatTweens = useRef([]);

  const HOME_BG = "#0e0e10";
  const GALLERY_BG = "#911e1e";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = section.querySelectorAll("[data-card]");
    const floats = section.querySelectorAll("[data-float]");
    const line = lineRef.current;
    const title = titleRef.current;
    const bgPulse = bgPulseRef.current;
    const grad = gradientRef.current;
    const root = document.documentElement;

    const isMobile = window.innerWidth < 640; // Tailwind sm

    // Fondo base del home
    gsap.set(root, { "--pageBg": HOME_BG });
    gsap.set(line, { scaleY: 0, autoAlpha: 0, transformOrigin: "top center" });
    gsap.set(title, { opacity: 0, y: 40 });
    gsap.set(bgPulse, { opacity: 0 });
    if (grad) gsap.set(grad, { yPercent: 0 });

    const INITIAL_Y = isMobile ? 0 : 64;
    const SIDE_OFFSET = isMobile ? 0 : -80;

    cards.forEach((el, i) => {
      const baseY = isMobile ? 0 : i === 1 ? 0 : SIDE_OFFSET;
      gsap.set(el, {
        y: INITIAL_Y + baseY,
        autoAlpha: 0,
        scale: isMobile ? 1 : 0.96,
      });
    });

    const killFloats = () => {
      floatTweens.current.forEach((t) => t.kill());
      floatTweens.current = [];
    };

    const startFloats = () => {
      // Sólo en desktop para no matar mobile
      if (isMobile) return;
      killFloats();
      floats.forEach((el, i) => {
        const AMP = i === 1 ? 8 : 12;
        floatTweens.current.push(
          gsap.fromTo(
            el,
            { y: -AMP / 2 },
            {
              y: AMP / 2,
              duration: 2.4 + Math.random() * 0.6,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: i * 0.08,
              force3D: true,
            }
          )
        );
      });
    };

    // Timeline de entrada (una sola vez)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        once: true, // ⚡ no re-ejecutar mil veces
      },
      defaults: { ease: "power3.out" },
    });

    tl.to(line, { autoAlpha: 1, scaleY: 1, duration: 1.0 }, 0)
      .to(title, { opacity: 1, y: 0, duration: 0.8 }, 0.15)
      .to(bgPulse, { opacity: 1, duration: 1.0 }, 0.1)
      .to(
        cards,
        {
          y: (i) => (i === 1 ? 0 : SIDE_OFFSET),
          autoAlpha: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
        },
        0.35
      );

    // ScrollTrigger separado sólo para las flotaciones
    const floatST = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      onEnter: startFloats,
      onEnterBack: startFloats,
      onLeave: killFloats,
      onLeaveBack: killFloats,
    });

    // Parallax leve del gradient solo en desktop
    let gradTween = null;
    if (grad && !isMobile) {
      gradTween = gsap.to(grad, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });
    }

    // Transición de fondo global SIN scrub continuo
    // (mucho más liviano que animar --pageBg en cada pixel)
    let bgEnterTween = null;
    let bgLeaveTween = null;

    const gallery = document.querySelector("#gallery-teaser");
    if (gallery) {
      ScrollTrigger.create({
        trigger: gallery,
        start: "top center",
        end: "top 30%",
        onEnter: () => {
          bgLeaveTween?.kill();
          bgEnterTween = gsap.to(root, {
            "--pageBg": GALLERY_BG,
            duration: 1.2,
            ease: "power1.out",
          });
        },
        onLeaveBack: () => {
          bgEnterTween?.kill();
          bgLeaveTween = gsap.to(root, {
            "--pageBg": HOME_BG,
            duration: 1.0,
            ease: "power1.out",
          });
        },
      });
    }

    return () => {
      tl.kill();
      floatST.kill();
      killFloats();
      if (gradTween) {
        gradTween.scrollTrigger?.kill();
        gradTween.kill();
      }
      bgEnterTween?.kill();
      bgLeaveTween?.kill();
      gsap.set(root, { "--pageBg": HOME_BG });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="gaceta-shop"
      className="relative py-24 sm:py-32 lg:py-52 bg-page overflow-hidden"
    >
      {/* Glow radial */}
      <div
        ref={bgPulseRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_20%,rgba(255,255,255,.07),transparent_70%)] opacity-0 transition-opacity"
      />

      {/* Gradient para parallax (si querés usarlo, por ahora invisible/light) */}
      <div
        ref={gradientRef}
        aria-hidden
        className="pointer-events-none absolute -top-40 left-0 right-0 h-64 -z-10 opacity-[0.35] bg-gradient-to-b from-[#911e1e]/30 via-transparent to-transparent"
      />

      {/* Línea identidad */}
      <span
        ref={lineRef}
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] bg-[#911e1e]/70 rounded-full"
      />

      {/* Título */}
      <div ref={titleRef} className="relative z-10 text-center mb-14 md:mb-20">
        <h2 className="text-[11px] sm:text-[12px] font-semibold tracking-[.25em] text-white/70 uppercase">
          GACETA <span className="text-[#911e1e]">SHOP</span>
        </h2>
        <p className="mt-2 text-white/50 text-xs sm:text-sm">
          Merch oficial — edición limitada
        </p>
      </div>

      {/* Productos */}
      <div className="relative z-10 px-5 sm:px-6 lg:px-10 xl:px-12">
        <div
          className="
            grid grid-cols-1 md:grid-cols-3
            gap-20 md:gap-10 xl:gap-12
            max-w-[75rem]
            mx-auto
          "
        >
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-5 sm:px-6 lg:px-12 mt-14 md:mt-20 flex justify-center">
        <a
          href="https://tutienda.tiendanube.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full h-11 px-6 bg-white text-black font-medium border border-white hover:bg-black hover:text-white hover:border-white/70 transition"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="-mt-[1px]"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Ver todos los productos
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
