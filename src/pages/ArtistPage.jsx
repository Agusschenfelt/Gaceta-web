// ArtistPage.jsx
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import BioSection from '../components/seccionesArtistas/BioSection';
import ProjectsSection from '../components/seccionesArtistas/ProjectsSection';
import LivesetSection from '../components/seccionesArtistas/LiveSetSection';


export default function ArtistPage({ artists }) {
  const { id } = useParams();
  const artist = artists.find(a => a.id === id);
  const [tab, setTab] = useState('bio');

  if (!artist) return <h1 className="text-black mt-28">Artista no encontrado</h1>;

  return (
    <div className="text-white min-h-screen bg-black flex flex-col gap-10 bg-contain bg-no-repeat bg-left" style={{ backgroundImage: `url(${artist.fondo})` }}>
      <header className="flex justify-between items-start md:items-end mb-8 mx-9 md:mx-20 mt-20 sm:mt-32">
      <div className='flex flex-col gap-3'>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
              #Artista
            </span>
            <h2 className="titulo">
              <span className='cursiva'>{artist.name}</span>
            </h2>
        </div>
        <nav className="flex space-x-6 flex-col md:flex-row items-start gap-3">
          <button
            onClick={() => setTab('bio')}
            className={`text-lg md:text-2xl font-inter font-semibold ml-6 hover:text-orange-500 ${tab === 'bio' ? 'text-orange-500' : 'text-white'}`}
          >
            bio
          </button>
          <button
            onClick={() => setTab('projects')}
            className={`text-lg md:text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'projects' ? 'text-orange-500' : 'text-white'}`}
          >
            projects
          </button>
          <button
            onClick={() => setTab('liveset')}
            className={`text-lg md:text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'liveset' ? 'text-orange-500' : 'text-white'}`}
          >
            liveset
          </button>
        </nav>
      </header>

      {/* --- Contenido dinámico debajo --- */}
      {tab === 'bio' && (
        <BioSection bio={artist.bio} />
      )}

      {tab === 'projects' && (
        <ProjectsSection projects={artist.projects} />
      )}

      {tab === 'liveset' && (
        <LivesetSection />
      )}
      
    </div>
  );
}
