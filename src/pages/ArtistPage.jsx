// ArtistPage.jsx
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import ModalProjects from '../components/seccionesArtistas/ModalProjects';

export default function ArtistPage({ artists }) {
  const { id } = useParams();
  const artist = artists.find(a => a.id === id);
  const [tab, setTab] = useState('bio');
  const [modalProject, setModalProject] = useState(null);

  if (!artist) return <h1 className="text-white">Artista no encontrado</h1>;

  return (
    <div className="text-white min-h-screen bg-black">
      {/* --- Cabecera fija: nombre + tabs --- */}
      <div className="flex justify-between items-end mb-8 mx-20 mt-20 sm:mt-28">
      <div className='flex flex-col gap-3'>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
            #Artista
            </span>
            <h2 className="titulo">
              <span className='cursiva'>{artist.name}</span>
            </h2>
        </div>
        <nav className="flex space-x-6">
          <button
            onClick={() => setTab('bio')}
            className={`text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'bio' ? 'text-orange-500' : 'text-white'}`}
          >
            bio
          </button>
          <button
            onClick={() => setTab('projects')}
            className={`text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'projects' ? 'text-orange-500' : 'text-white'}`}
          >
            projects
          </button>
          <button
            onClick={() => setTab('liveset')}
            className={`text-2xl font-inter font-semibold hover:text-orange-500 ${tab === 'liveset' ? 'text-orange-500' : 'text-white'}`}
          >
            liveset
          </button>
        </nav>
      </div>

      {/* --- Contenido dinámico debajo --- */}
      {tab === 'bio' && (
        <div className="flex flex-col md:flex-row justify-end">
          <div className="md:w-[60%]" />
          <div className="max-w-[600px] text-2xl font-inter mr-20">
            <p>{artist.bio}</p>
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {artist.projects.map(p => (
            <div key={p.id} className="relative">
              <img
                src={p.cover}
                alt={p.title}
                className="rounded-lg cursor-pointer hover:opacity-80"
                onClick={() => setModalProject(p)}
              />
              <p className="mt-2 text-center">{p.title}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'liveset' && (
        <iframe
          src={artist.spotifyEmbed}
          className="w-full h-64 rounded-lg"
          allow="encrypted-media"
        />
      )}

      {/* --- Modal de proyecto --- */}
      {modalProject && (
        <ModalProjects onClose={() => setModalProject(null)}>
          {/* ... */}
        </ModalProjects>
      )}
    </div>
  );
}
