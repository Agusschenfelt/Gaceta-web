import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100svh] bg-fondo flex items-center justify-center">
          <p className="text-white font-bold text-xl">Algo salió mal. Recargá la página.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Registro único — no repetir en componentes individuales
gsap.registerPlugin(ScrollTrigger, SplitText, ScrollToPlugin, useGSAP);

// Componentes Shell
import Layout from "./components/Layout/Layout";
import MenuProvider from "./components/Layout/MenuStore";
import ScrollToTopOnRouteChange from "./ScrollToTopOnRouteChange";
import ResetBgOnRoute from "./components/ResetBgOnRoute.jsx";
import PageTransitionProvider from "./components/PageTransitionProvider";
import ScrollToAnchor from "./components/ScrollToAnchor";
import SmoothScroll from "./components/SmoothScroll";
const MusicPlayer = lazy(() => import("./components/Layout/MusicPlayer"));
const CustomCursor = lazy(() => import("./components/CustomCursor"));
// Páginas (Lazy)
const HomePage = lazy(() => import("./pages/HomePage"));
const ArtistPage = lazy(() => import("./pages/ArtistPage"));
const SobreNosotrosPage = lazy(() => import("./pages/SobreNosotrosPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const RosterPage = lazy(() => import("./pages/RosterPage"));

import "./index.css";

const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-fondo">
    <div className="flex flex-col items-center gap-4">
      <div className="w-3 h-3 bg-secundario rounded-full animate-ping" />
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
      <Suspense fallback={null}><CustomCursor /></Suspense>
      {/* 1. EL PROVIDER DEBE ENVOLVER TODO EL CONTENIDO NAVEGABLE */}
      <PageTransitionProvider> 
        <SmoothScroll>
        <ScrollToTopOnRouteChange />
        <ResetBgOnRoute />
        <ScrollToAnchor />
        
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="artistas/:id" element={<ArtistPage />} />
                <Route path="artistas" element={<RosterPage />} />
                <Route path="sobre-nosotros" element={<SobreNosotrosPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>

        {/* El MusicPlayer puede ir dentro o fuera, pero dentro es mejor 
            si alguna vez quieres que la transición interactúe con él. */}
        <Suspense fallback={null}><MusicPlayer /></Suspense>
        </SmoothScroll>

      </PageTransitionProvider> 
    </MenuProvider>
  );
}