import { Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import ArtistasPage from './pages/ArtistasPage';
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import './index.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/artistas" element={<ArtistasPage />} />
      <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
    </Routes>
  );
}

