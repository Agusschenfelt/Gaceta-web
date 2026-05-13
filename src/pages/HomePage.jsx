// HomePage.jsx
import SEO from "../SEO.jsx";

import { useEffect, lazy, Suspense } from "react";
import gsap from "gsap";

// Lazy Load heavy sections
const SeccionProximosShows = lazy(() => import("../components/Pagina-Home/SeccionProximosShows"));
const SeccionGacetaTv = lazy(() => import("../components/Pagina-Home/SeccionGacetaTv"));
const SeccionGacetaShop = lazy(() => import("../components/Pagina-Home/SeccionGacetaShop"));
const SeccionGalleryTeaser = lazy(() => import("../components/Pagina-Home/SeccionGalleryTeaser"));
const CTASobreNosotros = lazy(() => import("../components/Pagina-Home/CTASobreNosotros"));

import IntroToLogo from "../components/Pagina-Home/IntroToLogo";

function SectionSuspense({ children, minHeight = "100svh" }) {
    return (
        <Suspense fallback={<div role="status" aria-busy="true" className="w-full bg-black" style={{ minHeight }} />}>
            {children}
        </Suspense>
    );
}

export default function HomePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const HOME_BASE_BG = "#0a0a0a";
    gsap.set(root, { "--pageBg": HOME_BASE_BG });
    return () => gsap.set(root, { "--pageBg": HOME_BASE_BG });
  }, []);

  return (
    <>
      <div className="bg-transparent flex flex-col min-h-[100svh]">
        <IntroToLogo />

        <SectionSuspense>
          <SeccionProximosShows />
        </SectionSuspense>

        <SectionSuspense minHeight="60svh">
          <SeccionGacetaTv />
        </SectionSuspense>

        <SectionSuspense>
          <SeccionGacetaShop />
        </SectionSuspense>

        <SectionSuspense>
          <SeccionGalleryTeaser
            images={[
              "/media/img/_woc7020-840.webp",
              "/media/img/pyketoph-6-840.webp",
              "/media/img/_woc5860-840.webp",
            ]}
            eyebrow="GACETA"
            title="Gallery"
            ctaText="Visitar nuestra galería"
            ctaHref="/gallery"
          />
        </SectionSuspense>

        <SectionSuspense minHeight="20svh">
          <CTASobreNosotros />
        </SectionSuspense>
      </div>
    </>
  );
}
