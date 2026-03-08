// HomePage.jsx
import SEO from "../SEO.jsx";

import { useEffect, lazy, Suspense } from "react";
import gsap from "gsap";

// Lazy Load heavy sections
const SeccionGacetaShop = lazy(() => import("../components/Pagina-Home/SeccionGacetaShop"));
const SeccionProximosShows = lazy(() => import("../components/Pagina-Home/SeccionProximosShows"));
const SeccionGacetaTv = lazy(() => import("../components/Pagina-Home/SeccionGacetaTv"));
const SeccionGalleryTeaser = lazy(() => import("../components/Pagina-Home/SeccionGalleryTeaser"));

import IntroToLogo from "../components/Pagina-Home/IntroToLogo";
// import HeroSection from "../components/Pagina-Home/HeroSection"; 

function SectionSuspense({ children }) {
    return <Suspense fallback={<div className="h-[50vh] w-full bg-black/5" />}>{children}</Suspense>;
}

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
      <div className="bg-transparent flex flex-col min-h-[100svh]">
        <IntroToLogo />
        
        <SectionSuspense>
            <SeccionGacetaTv />
        </SectionSuspense>
        
        <SectionSuspense>
            <SeccionProximosShows />
        </SectionSuspense>
        
        <SectionSuspense>
            <SeccionGacetaShop />
        </SectionSuspense>

        <SectionSuspense>
            <SeccionGalleryTeaser
            images={[
                "/media/img/_woc7020-1440.webp",
                "/media/img/pyketoph-6-1440.webp",
                "/media/img/_woc5860-1440.webp",
            ]}
            eyebrow="GACETA"
            title="Gallery"
            ctaText="Visitar nuestra galería"
            ctaHref="/gallery"
            />
        </SectionSuspense>
      </div>
    </>
  );
}
