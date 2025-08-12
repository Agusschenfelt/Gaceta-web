import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from './pages/HomePage';
import AllArtistsPage from './pages/AllArtistsPage';
import ArtistPage from "./pages/ArtistPage";
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import ScrollToTop from "./components/ScrollToTop";
import './index.css';


export default function App() {
    const artists = [
    {
      id: "ramma",
      name: "Ramma",
      photo: "/assets/ramma-perfil.jpg",
      fondo: "/assets/ramma-fondo.jpg",
      bio: "Ramma comenzó su carrera musical en 2020, explorando géneros como el rap, trap y reggaetón. En 2022 lanzó Incrédulo, su primer álbum, seguido por Intrépido en 2023, mostrando una evolución artística clara. En 2024 participó en Bichigyal Rmx, tema viral que lo posicionó como una promesa fuerte del trap argentino. En 2025 lanzó Inmortal, sellando su identidad en la escena.G",
      tag : "/assets/ramma-tag.mp3",
      projects: [
        {
          id: "trip2",
          title: "Trip 2 – EP",
          cover: "/assets/projects-ramma/trip2-front.jpg",
          date: "15 Marzo 2023",
          label: "Independiente",
          producer: "The Beats Co.",
          spotify : "https://open.spotify.com/intl-es/album/7DkEdrof8yEWH1ofkLHWDT?si=2mr_vYVaSdmEJaTutZdDzw",
          bio: "Segundo EP de Ramma, continuando su exploración del trap con un sonido más maduro y letras introspectivas."
        },
        {
          id: "etlm",
          title: "EL TRAP LO MERECE – EP",
          cover: "/assets/projects-ramma/etlm-front.jpg",
          date: "10 Julio 2023",
          label: "Sky Records",
          producer: "DJ Flow",
          spotify : "https://open.spotify.com/intl-es/album/7DkEdrof8yEWH1ofkLHWDT?si=2mr_vYVaSdmEJaTutZdDzw",
          bio : "EP que consolidó a Ramma en la escena del trap, con colaboraciones destacadas y un sonido innovador."
        },
        {
          id: "immortal",
          title: "IMMORTAL – Album",
          cover: "/assets/projects-ramma/inmortal-front.jpg",
          date: "02 Enero 2025",
          label: "Universal Music",
          producer: "Mastermind",
          spotify : "https://open.spotify.com/intl-es/album/7DkEdrof8yEWH1ofkLHWDT?si=2mr_vYVaSdmEJaTutZdDzw",
          bio : "Álbum debut que marcó un hito en la carrera de Ramma, mostrando su versatilidad y profundidad lírica."
        },
        {
          id: "incredulo",
          title: "INCREDULO – Album",
          cover: "/assets/projects-ramma/incredulo-front.jpg",
          date: "02 Enero 2025",
          label: "Universal Music",
          producer: "Mastermind",
          spotify : "https://open.spotify.com/intl-es/album/7DkEdrof8yEWH1ofkLHWDT?si=2mr_vYVaSdmEJaTutZdDzw",
          bio : "Primer álbum de Ramma, que lo estableció como una voz única en el panorama del trap argentino."
        },
        {
          id: "intrepido",
          title: "INTREPIDO – Album",
          cover: "/assets/projects-ramma/intrepido-front.jpg",
          date: "02 Enero 2025",
          label: "Universal Music",
          producer: "Mastermind",
          spotify : "https://open.spotify.com/intl-es/album/7DkEdrof8yEWH1ofkLHWDT?si=2mr_vYVaSdmEJaTutZdDzw",
          bio : "Álbum que refleja la evolución artística de Ramma, con un enfoque más experimental y colaboraciones internacionales."
        },
      ],
      spotifyEmbed: "https://open.spotify.com/embed/album/1A2B3C4D5E6F",
    },
    {
      id: "ara",
      name: "ARA",
      photo: "/assets/ara-photo.jpg",
      fondo: "/assets/ara-fondo.jpg",
      bio: "ARA es una artista emergente que ha capturado la atención de la escena musical con su estilo único y su voz poderosa. Desde sus inicios, ha demostrado una gran versatilidad, explorando diversos géneros y colaborando con otros artistas destacados. Su música se caracteriza por letras profundas y una producción innovadora que resuena con una amplia audiencia.",
      projects: [
        {
          id: "#4u",
          title: "#4u - EP",
          cover: "/assets/ara-#4u.jpg",
          date: "25 Junio 2025",
          label: "Independiente",
          producer: "ARA",
          spotify : "https://open.spotify.com/intl-es/album/1UN6gHFKHxueuhdY4DRegP?si=xvT8n6yHRT-_5qPVJIQPiw",
          bio : "Primer EP de ARA, que muestra su capacidad para fusionar géneros y crear un sonido fresco y contemporáneo."
        }
      ],
      spotifyEmbed: "https://open.spotify.com/embed/album/1A2B3C4D5E6F",
    },
    {
      id: "valuto",
      name: "Valuto",
      photo: "/assets/valuto-photo.webp",
      fondo: "/assets/valuto-fondo.webp",
      bio: "Valuto es una artista emergente que ha capturado la atención de la escena musical con su estilo único y su voz poderosa. Desde sus inicios, ha demostrado una gran versatilidad, explorando diversos géneros y colaborando con otros artistas destacados. Su música se caracteriza por letras profundas y una producción innovadora que resuena con una amplia audiencia.",
      projects: [
        {
          id: "ceup",
          title: "CON EL UNIFORME PUESTO - Album",
          cover: "/assets/ceup.webp",
          date: "18 Junio 2025",
          label: "Independiente",
          producer: "Valuto",
          spotify : "https://open.spotify.com/intl-es/album/0NSIPu4gynlpDew19wIGGQ?si=eQZ3DImaQmO9CQBm9zsdaQ",
          bio : "Primer álbum de Valuto, que muestra su capacidad para fusionar géneros y crear un sonido fresco y contemporáneo."
        }
      ],
      spotifyEmbed: "https://open.spotify.com/embed/album/1A2B3C4D5E6F",
    }
  ];
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="artistas" element={<AllArtistsPage artists={artists}/>} />
          <Route path="artistas/:id" element={<ArtistPage artists={artists}/>} />
          <Route path="sobre-nosotros" element={<SobreNosotrosPage/>} /> 
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}