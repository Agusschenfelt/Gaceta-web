// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import HomePage from "./pages/HomePage";
import ArtistPage from "./pages/ArtistPage";
import SobreNosotrosPage from "./pages/SobreNosotrosPage";
import PruebasPage from "./components/Pruebas/PruebasPage";
import GalleryPage from "./pages/GalleryPage";
import MenuProvider from "./components/Layout/MenuStore";
import ScrollToTopOnRouteChange from "./ScrollToTopOnRouteChange";
import MusicPlayer from "./components/Layout/MusicPlayer";
import ResetBgOnRoute from "./components/ResetBgOnRoute";

import "./index.css";
import "swiper/css";
import "swiper/css/navigation";

export default function App() {
  const artists = [
    {
      nombre: "ARA",
      rol: "Cantante / Productor",
      videoFondo: "/assets/ara-perfil.mp4",
      redes: {
        instagram: "https://instagram.com/ramma",
        spotify: "https://open.spotify.com/artist/...",
        youtube: "https://youtube.com/...",
        x: "https://x.com/ramma",
      },
      biografia: `Ramiro Valentín Domínguez nacido en Buenos Aires, Argentina. Es músico y compositor. Creció en una casa con piano, donde su padre y su hermana tocaban. Ahí dio sus primeros pasos hasta convertir esa curiosidad en un vínculo profundo con la música. Su acercamiento se consolidó entre el piano y la iglesia, donde la práctica musical era parte de la vida familiar. A los 6 años descubrió el rock nacional y, con su primer MP3, empezó a devorar discos; más tarde llegó el folklore y el rock internacional con bandas como Oasis o The Beatles y, ya de adolescente, el hip-hop.
Estudia piano desde los 6 años, descubrió Ableton a los 12 y, desde los 14, lo usa de forma regular. A lo largo de su adolescencia grabó canciones a raperos de Trelew, mientras comenzaba a hacer su propia música, un hábito que mantiene hasta hoy. Su proyecto se distingue por la versatilidad: en el equipo “Ramma” cada integrante asume más de un rol cuando hace falta, y esa flexibilidad también se refleja en la música, capaz de ir de un tema acústico a un trap con naturalidad.
Ramiro entiende la música como su forma más honesta de expresión: allí dice lo que no puede en palabras. En su catálogo conviven lanzamientos con millones de reproducciones como “MVP” o “Nostalgia”, y un hito que marcó su recorrido: “Bichigyal Remix”.
Como solista, editó tres álbumes: Incrédulo (2022), Intrépido (2023) y INMORTAL (2025). Este último marcó un hito en su recorrido: debutó en el Top 8 global, consolidando el crecimiento de su obra y el alcance de su propuesta. En su catálogo conviven lanzamientos con millones de reproducciones como “MVP” o “Nostalgia”, además de “Bichigyal Remix”, que expandieron su audiencia y su escena. Ahora prepara RV, su proyecto más íntimo hasta la fecha.`,
      fotos: [
        "/assets/ramma-perfil.jpg",
        "/assets/ramma-perfil.jpg",
        "/assets/ramma-perfil.jpg",
        "/assets/ramma-perfil.jpg",
        "/assets/ramma-perfil.jpg",
        "/assets/ramma-perfil.jpg",
      ],
      proyectos: [
        {
          nombre: "Delirio",
          imagen: "/assets/ramma-perfil.jpg",
          spotify: "https://open.spotify.com/album/...",
        },
        {
          nombre: "Constelacion",
          imagen: "/assets/ramma-perfil.jpg",
          spotify: "https://open.spotify.com/album/...",
        },
      ],
    },
  ];

  return (
    <MenuProvider>
      <ScrollToTopOnRouteChange />
      <ResetBgOnRoute />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path=":id" element={<ArtistPage artistsData={artists} />} />
          <Route path="sobre-nosotros" element={<SobreNosotrosPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="pruebas" element={<PruebasPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      <MusicPlayer />
    </MenuProvider>
  );
}
