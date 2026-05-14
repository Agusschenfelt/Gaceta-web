import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const products = [
  {
    id: "1",
    title: "Black Gaceta Tee",
    price: 20000,
    image: "/assets/gaceta-negra.webp",
    href: "https://gaceta.shop/productos/black-gaceta-tee/",
    soldOut: true,
  },
  {
    id: "2",
    title: "White RV Oversize Tee",
    price: 29999,
    image: "/assets/rv-tee.webp",
    href: "https://gaceta.shop/productos/white-rv-oversize-tee/",
    soldOut: true,
  },
  {
    id: "3",
    title: "Black Backstage Cover Tee",
    price: 29999,
    image: "/assets/bc-negra.webp",
    href: "https://gaceta.shop/productos/white-backstagecover-tee/",
    soldOut: true,
  },
];

const currency = (n) =>
  n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

const ProductCard = React.memo(function ProductCard({ p }) {
  const Tag = p.soldOut ? "div" : "a";
  const linkProps = p.soldOut
    ? { role: "group", "aria-label": `${p.title}, agotado` }
    : { href: p.href, target: "_blank", rel: "noopener noreferrer" };
  return (
    <Tag
      {...linkProps}
      className={`block select-none h-full group relative ${
        p.soldOut ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className={`relative rounded-sm overflow-hidden bg-white/[0.02] border transition-[border-color] duration-500 h-full flex flex-col ${
          p.soldOut ? "border-white/5 opacity-60" : "border-white/5 group-hover:border-secundario/30"
        }`}>

          {/* IMAGEN */}
          <div className="aspect-[4/5] relative overflow-hidden bg-fondo border-b border-white/5">
            {!p.soldOut && (
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            )}

            <img
              src={p.image}
              alt={p.title}
              width="400"
              height="500"
              loading="lazy"
              className={`h-full w-full object-cover transition-[filter,transform] duration-500 ${
                p.soldOut ? "grayscale opacity-70" : "group-hover:scale-105"
              }`}
            />

            {/* SOLD OUT — stamp centrado y rotado */}
            {p.soldOut && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/80 border border-white/40 px-4 py-2 rotate-[-12deg] bg-black/50 backdrop-blur-sm">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="p-4 md:p-6 flex flex-col flex-1 justify-between bg-fondo">
            <div>
              <h3 className={`font-serif italic text-lg leading-tight mb-2 transition-colors duration-300 ${
                p.soldOut ? "text-white/40" : "text-white group-hover:text-secundario"
              }`}>
                {p.title}
              </h3>
              <p className={`text-xs font-mono tracking-wide ${p.soldOut ? "text-white/20 line-through" : "text-secundario/60"}`}>
                {currency(p.price)}
              </p>
            </div>

            {/* FOOTER CARD */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-widest">
              {p.soldOut ? (
                <div className="flex items-center gap-2 text-white/30 font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span>Agotado</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white transition-colors">
                  <span>Shop Now</span>
                  <span className="translate-x-[-5px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-300">→</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Tag>
  );
});

export default function SeccionGacetaShop() {
  const sectionRef = useRef(null);
  const connectorRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
        }
    });

    tl.fromTo(connectorRef.current, 
        { scaleY: 0 },
        { scaleY: 1, duration: 1.2, ease: "power3.inOut", transformOrigin: "top" }
    )
    .from(".shop-title", {
      y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1
    }, "-=0.5");
    
    gsap.fromTo(".card-shop",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".shop-grid", start: "top 85%", once: true } }
    );

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="gaceta-shop"
      className="relative z-20 py-32 pb-48"
    >
      {/* Gradiente ambiental sutil — el ruido viene del body, no se duplica */}
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(255,255,255,0.015)_0%,transparent_100%)] pointer-events-none z-0" />

      {/* Fade de entrada desde GacetaTV */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-fondo to-transparent pointer-events-none z-0" />

      {/* Fade de salida hacia Gallery */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-fondo to-transparent pointer-events-none z-30" />

      {/* LÍNEA CONECTORA */}
      <div aria-hidden="true" className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[1px] z-10 origin-top">
         <div
            ref={connectorRef}
            className="w-full h-full bg-gradient-to-b from-secundario via-secundario/40 to-transparent"
         />
      </div>

      {/* HEADER */}
      <div className="text-center mb-24 relative z-20 pt-10">
        <p className="shop-title text-xs md:text-sm text-secundario uppercase tracking-[0.3em] font-medium mb-4 opacity-80">
          Merch Oficial
        </p>
        <h2 className="shop-title text-5xl md:text-6xl lg:text-7xl font-serif italic text-white">
          Gaceta Shop
        </h2>
      </div>

      {/* GRID PRODUCTOS */}
      <div className="shop-grid relative z-10 px-6 md:px-12 max-w-[1200px] mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((p) => (
            <div key={p.id} className="card-shop h-full">
                <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex justify-center shop-title">
        <a
          href="https://gaceta.shop/"
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-transparent border border-white/20 rounded-sm overflow-hidden transition-[border-color] duration-300 hover:border-secundario/50"
        >
          <span className="relative z-10 font-mono tracking-[0.1em] uppercase text-xs text-white/80 group-hover:text-secundario transition-colors">
            Ir a la tienda
          </span>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </a>
      </div>

    </section>
  );
}