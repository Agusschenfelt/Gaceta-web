// SeccionGacetaShop.jsx — Ajuste: Sold Out Premium (No triste)
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Mantenemos soldOut: true
const products = [
  {
    id: "1",
    title: "CON EL UNIFORME PUESTO Official cap",
    price: 22555,
    image: "/assets/valuto-merch.png",
    href: "https://tutienda.tiendanube.com/black-logo-tee",
    soldOut: true,
  },
  {
    id: "2",
    title: "INMORTAL Black Logo Tee",
    price: 35555,
    image: "/assets/ramma-merch-remera.jpg",
    href: "https://tutienda.tiendanube.com/white-logo-tee",
    soldOut: true,
  },
  {
    id: "3",
    title: "Zip Hoodie INMORTAL White Logo",
    price: 65555,
    image: "/assets/ramma-merch-hoodie.png",
    href: "https://tutienda.tiendanube.com/hoodie-gaceta",
    soldOut: true,
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
      href={p.soldOut ? null : p.href}
      data-cursor={p.soldOut ? "not-allowed" : "pointer"} // Indicador para cursor personalizado si lo tuvieras
      className={`block select-none h-full group relative ${
        p.soldOut ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div className="will-change-transform h-full flex flex-col">
        {/* COHERENCIA: Card con borde sutil */}
        <div className="relative rounded-sm overflow-hidden bg-white/[0.02] border border-white/5 group-hover:border-[#dee5a0]/30 transition-all duration-500 h-full flex flex-col">
          
          {/* IMAGEN - Full color y viva */}
          <div className="aspect-[4/5] relative overflow-hidden bg-[#0a0a0a] border-b border-white/5">
             {/* Overlay sutil en hover solo si NO está sold out */}
            {!p.soldOut && (
               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            )}
             
            <img
              src={p.image}
              alt={p.title}
              loading="lazy"
              // Mantenemos el zoom suave en hover incluso si está sold out, para que se sienta premium
              className="h-full w-full object-cover transition-transform duration-1000 opacity-100 scale-100 group-hover:scale-105"
            />

            {/* BADGE SOLD OUT SOBRE LA IMAGEN (Opcional, pero ayuda) */}
            {p.soldOut && (
                <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 bg-[#911e1e] text-white text-[9px] font-mono uppercase tracking-widest rounded-full">
                        Sold Out
                    </span>
                </div>
            )}
          </div>

          {/* INFO */}
          <div className="p-6 flex flex-col flex-1 justify-between bg-[#0e0e0f]">
            <div>
                {/* Título mantiene su color blanco, no se apaga */}
                <h3 className="font-serif italic text-lg leading-tight mb-2 text-white group-hover:text-[#dee5a0] transition-colors duration-300">
                  {p.title}
                </h3>
                <p className="text-[#dee5a0]/60 text-xs font-mono tracking-wide">
                  {currency(p.price)}
                </p>
            </div>
            
            {/* FOOTER CARD */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-widest">
                {p.soldOut ? (
                    // Estado Sold Out: Rojo sangre, llamativo, sin opacidad.
                    <div className="flex items-center gap-2 text-[#911e1e] font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#911e1e]"></span>
                        <span>Agotado</span>
                    </div>
                ) : (
                    // Estado Normal
                    <div className="flex items-center gap-2 text-white/40 group-hover:text-white transition-colors">
                        <span>Shop Now</span>
                        <span className="translate-x-[-5px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
                    </div>
                )}
            </div>
          </div>

        </div>
      </div>
    </a>
  );
}

export default function SeccionGacetaShop() {
  const sectionRef = useRef(null);
  const connectorRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
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
      scrollTrigger: { trigger: ".shop-grid", start: "top 85%" }
    });

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="gaceta-shop"
      className="relative z-20 py-32 pb-64 bg-[#0a0a0a] overflow-hidden"
    >
      
      {/* LÍNEA CONECTORA */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[1px] z-10 origin-top">
         <div 
            ref={connectorRef} 
            className="w-full h-full bg-gradient-to-b from-[#dee5a0] via-[#dee5a0]/40 to-transparent" 
         />
      </div>

      {/* HEADER */}
      <div className="text-center mb-24 relative z-20 pt-10">
        <h2 className="shop-title text-xs md:text-sm text-[#dee5a0] uppercase tracking-[0.3em] font-medium mb-4 opacity-80">
          Merch Oficial
        </h2>
        <h3 className="shop-title text-5xl md:text-7xl font-serif italic text-white">
          Gaceta Shop
        </h3>
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

      {/* CTA - Lo mantenemos para ir a la tienda real aunque este sold out estos items */}
      <div className="relative z-10 flex justify-center shop-title">
        <a
          href="https://gaceta.shop/"
          target="_blank"
          rel="noreferrer"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 bg-transparent border border-white/20 rounded-full overflow-hidden transition-all duration-300 hover:border-white/50"
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