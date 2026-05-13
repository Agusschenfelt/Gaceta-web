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
    soldOut: false,
  },
  {
    id: "2",
    title: "White RV Oversize Tee",
    price: 29999,
    image: "/assets/rv-tee.webp",
    href: "https://gaceta.shop/productos/white-rv-oversize-tee/",
    soldOut: false,
  },
  {
    id: "3",
    title: "Black Backstage Cover Tee",
    price: 29999,
    image: "/assets/bc-negra.webp",
    href: "https://gaceta.shop/productos/white-backstagecover-tee/",
    soldOut: false,
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
        {/* COHERENCIA: Card con borde sutil */}
        <div className="relative rounded-sm overflow-hidden bg-white/[0.02] border border-white/5 group-hover:border-secundario/30 transition-[border-color] duration-500 h-full flex flex-col">
          
          {/* IMAGEN - Full color y viva */}
          <div className="aspect-[4/5] relative overflow-hidden bg-fondo border-b border-white/5">
             {/* Overlay sutil en hover solo si NO está sold out */}
            {!p.soldOut && (
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            )}
             
            <img
              src={p.image}
              alt={p.title}
              width="400"
              height="500"
              loading="lazy"
              // Mantenemos el zoom suave en hover incluso si está sold out, para que se sienta premium
              className="h-full w-full object-cover transition-transform duration-1000 opacity-100 scale-100 group-hover:scale-105"
            />

            {/* BADGE SOLD OUT SOBRE LA IMAGEN (Opcional, pero ayuda) */}
            {p.soldOut && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                    <span className="px-3 py-1 bg-white/10 text-white/60 text-[9px] font-mono uppercase tracking-widest rounded-full border border-white/15">
                        Sold Out
                    </span>
                </div>
            )}
          </div>

          {/* INFO */}
          <div className="p-4 md:p-6 flex flex-col flex-1 justify-between bg-fondo">
            <div>
                {/* Título mantiene su color blanco, no se apaga */}
                <h3 className="font-serif italic text-lg leading-tight mb-2 text-white group-hover:text-secundario transition-colors duration-300">
                  {p.title}
                </h3>
                <p className="text-secundario/60 text-xs font-mono tracking-wide">
                  {currency(p.price)}
                </p>
            </div>
            
            {/* FOOTER CARD */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-widest">
                {p.soldOut ? (
                    <div className="flex items-center gap-2 text-white/40 font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/30"></span>
                        <span>Agotado</span>
                    </div>
                ) : (
                    // Estado Normal
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
    
    gsap.to(".card-shop", {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out",
      scrollTrigger: { trigger: ".shop-grid", start: "top 85%", once: true }
    });

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
            <div key={p.id} className="card-shop opacity-0 translate-y-10 h-full">
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
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-transparent border border-white/20 rounded-full overflow-hidden transition-[border-color] duration-300 hover:border-white/50"
        >
          <span className="relative z-10 font-mono tracking-[0.1em] uppercase text-xs text-white/80 group-hover:text-white transition-colors">
            Ir a la tienda
          </span>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </a>
      </div>

    </section>
  );
}