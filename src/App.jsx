import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from './pages/HomePage';
import AllArtistsPage from './pages/AllArtistsPage';
import ArtistPage from "./pages/ArtistPage";
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import './index.css';


export default function App() {
    const artists = [
    {
      id: "ramma",
      name: "Ramma",
      photo: "src/assets/tadu_compu.jpg",
      fondo: "src/assets/ramma-fondo.jpg",
      bio: "Ramma comenzó su carrera musical en 2020, explorando géneros como el rap, trap y reggaetón. En 2022 lanzó Incrédulo, su primer álbum, seguido por Intrépido en 2023, mostrando una evolución artística clara. En 2024 participó en Bichigyal Rmx, tema viral que lo posicionó como una promesa fuerte del trap argentino. En 2025 lanzó Inmortal, sellando su identidad en la escena.G",
      projects: [
        {
          id: "trip2",
          title: "Trip 2 – EP",
          cover: "https://via.placeholder.com/200x200.png?text=Trip+2",
          date: "15 Marzo 2023",
          label: "Independiente",
          producer: "The Beats Co."
        },
        {
          id: "etlm",
          title: "EL TRAP LO MERECE – EP",
          cover: "https://via.placeholder.com/200x200.png?text=ETLM",
          date: "10 Julio 2023",
          label: "Sky Records",
          producer: "DJ Flow"
        },
        {
          id: "immortal",
          title: "IMMORTAL – Album",
          cover: "https://via.placeholder.com/200x200.png?text=Immortal",
          date: "02 Enero 2025",
          label: "Universal Music",
          producer: "Mastermind"
        }
      ],
      spotifyEmbed: "https://open.spotify.com/embed/album/1A2B3C4D5E6F"
    }
  ];
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="artistas" element={<AllArtistsPage artists={artists}/>} />
          <Route path="artistas/:id" element={<ArtistPage artists={artists}/>} />
          <Route path="sobre-nosotros" element={<SobreNosotrosPage/>} /> 
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
  );
}