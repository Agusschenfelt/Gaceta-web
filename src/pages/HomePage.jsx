// HomePage.jsx
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import SEO from "../SEO.jsx";

import { useEffect } from "react";

import SeccionGacetaShop from "../components/Pagina-Home/SeccionGacetaShop";
import SeccionProximosShows from "../components/Pagina-Home/SeccionProximosShows";
import SeccionGacetaTv from "../components/Pagina-Home/SeccionGacetaTv";
import IntroToLogo from "../components/Pagina-Home/IntroToLogo";
import SeccionGalleryTeaser from "../components/Pagina-Home/SeccionGalleryTeaser";


export default function HomePage() {
  // Fondo base del home (esto ya lo tenías)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const HOME_BASE_BG = "#0e0e10";
    gsap.set(root, { "--pageBg": HOME_BASE_BG });
    return () => gsap.set(root, { "--pageBg": HOME_BASE_BG });
  }, []);

  return (
    <>
      <SEO 
        title="Inicio" // Se verá como: Inicio | GACETA
        description="Gaceta es un sello discográfico y productora audiovisual basada en Buenos Aires y Montevideo. Hogar de artistas como Ramma, Ara y Valuto."
        // image="/assets/home-og.jpg" // Opcional: una imagen específica para el home
      />
      <div className="bg-transparent flex flex-col min-h-[100svh]">
        <IntroToLogo />
        <SeccionGacetaTv />
        <SeccionProximosShows />
        <SeccionGacetaShop />
        <SeccionGalleryTeaser
          images={[
            "/assets/ramma-perfil.jpg",
            "/media/img/pyketoph-6-1440.webp",
            "/media/img/_woc5860-1440.webp",
          ]}
          eyebrow="GACETA"
          title="Gallery"
          ctaText="Visitar nuestra galería"
          ctaHref="/gallery"
        />
      </div>
    </>
  );
}
