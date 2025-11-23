// HomePage.jsx
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

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
    <div className="bg-transparent flex flex-col min-h-screen">
      <IntroToLogo />
      <SeccionGacetaTv />
      <SeccionProximosShows />
      <SeccionGacetaShop />
      <SeccionGalleryTeaser
        images={[
          "/assets/ramma-perfil.jpg",
          "/assets/ramma-pruebas2.jpeg",
          "/assets/ara-photo.jpg",
        ]}
        eyebrow="GACETA"
        title="Gallery"
        ctaText="Visitar nuestra galería"
        ctaHref="/gallery"
      />
    </div>
  );
}
