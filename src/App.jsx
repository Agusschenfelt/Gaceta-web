import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// --- 1. IMPORTA DESDE /react (No /next) ---
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Componentes Shell
import Layout from "./components/Layout/Layout";
import MenuProvider from "./components/Layout/MenuStore";
import ScrollToTopOnRouteChange from "./ScrollToTopOnRouteChange";
import MusicPlayer from "./components/Layout/MusicPlayer";
import ResetBgOnRoute from "./components/ResetBgOnRoute";
import PageTransitionProvider from "./components/PageTransitionProvider";

// ... (Resto de tus imports lazy y componentes de carga) ...
// ... (LoadingScreen y ARTISTS_DATA) ...

export default function App() {
  return (
    <MenuProvider>
      {/* --- 2. COLÓCALOS AQUÍ (Nivel superior) --- */}
      {/* Así capturan datos sin importar en qué ruta estés o si hay transiciones */}
      <Analytics />
      <SpeedInsights />

      <PageTransitionProvider> 
        
        <ScrollToTopOnRouteChange />
        <ResetBgOnRoute />

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

        <MusicPlayer />

      </PageTransitionProvider> 
    </MenuProvider>
  );
}