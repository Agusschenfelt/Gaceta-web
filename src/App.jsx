import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react"; 
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

// Componentes Shell
import Layout from "./components/Layout/Layout";
import MenuProvider from "./components/Layout/MenuStore";
import ScrollToTopOnRouteChange from "./ScrollToTopOnRouteChange";
import MusicPlayer from "./components/Layout/MusicPlayer";
import ResetBgOnRoute from "./components/ResetBgOnRoute";
import PageTransitionProvider from "./components/PageTransitionProvider";
import ScrollToAnchor from "./components/ScrollToAnchor";
import EventPopup from "./components/EventPopup";
import HypeLock from "./components/HypeLock";
// Páginas (Lazy)
const HomePage = lazy(() => import("./pages/HomePage"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const SobreNosotrosPage = lazy(() => import("./pages/SobreNosotrosPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const RosterPage = lazy(() => import("./pages/RosterPage")); // Asegúrate de tener este import si creaste la página

// IMPORTANTE: Importamos la data con llaves {} porque es un export nombrado
import { ARTISTS_DATA } from "./data/artistsData";

import "./index.css";
import "swiper/css";
import "swiper/css/navigation";

const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-3 h-3 bg-[#dee5a0] rounded-full animate-ping" />
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] animate-pulse">
        Cargando
      </span>
    </div>
  </div>
);

// 1. Ignorar el resize vertical en móviles (Evita el parpadeo al aparecer la barra)
ScrollTrigger.config({ 
  ignoreMobileResize: true 
});

export default function App() {
  return (
    <MenuProvider>
      <Analytics />
      <SpeedInsights />
      {/* 1. EL PROVIDER DEBE ENVOLVER TODO EL CONTENIDO NAVEGABLE */}
      <PageTransitionProvider> 
        
        <ScrollToTopOnRouteChange />
        <ResetBgOnRoute />
        <ScrollToAnchor />


        <HypeLock />
        
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="artistas/:id" element={<ArtistPage artistsData={ARTISTS_DATA} />} />
              <Route path="artistas" element={<RosterPage />} />
              <Route path="sobre-nosotros" element={<SobreNosotrosPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>

        {/* El MusicPlayer puede ir dentro o fuera, pero dentro es mejor 
            si alguna vez quieres que la transición interactúe con él. */}
        <MusicPlayer />

      </PageTransitionProvider> 
    </MenuProvider>
  );
}