import { Link } from 'react-router-dom';
import { useRef, useEffect } from 'react';

export default function ArtistsGrid({ artists }) {

  const audioRefs = useRef({});

  useEffect(() => {
    artists.forEach(artist => {
      if (artist.tag) {
        const audio = new Audio(artist.tag);
        audio.preload = "auto";
        audioRefs.current[artist.tag] = audio;
      }
    });
  }, [artists]);

  const handleMouseEnter = (tag) => {
    const audio = audioRefs.current[tag];
    if (audio) {
      audio.currentTime = 0; 
      audio.play().catch(err => console.warn("No se pudo reproducir el audio:", err));
    }
  };



  return (
    <div className="p-6 bg-black min-h-screen mt-20 sm:mt-28 flex flex-col gap-28 mx-4 lg:mx-28 mb-10">
      <div>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
              #Artistas
            </span>
            <h2 className="titulo">
              en primera 
            <br />
              <span className="cursiva">persona</span>
            </h2>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {artists.map(a => (
          <Link
            key={a.id}
            to={`/artistas/${a.id}`}
            className="block overflow-hidden rounded-xl"
          >
            <img
              src={a.photo}
              alt={a.name}
              className="w-full md:w-[70%] h-full transform hover:scale-105 transition rounded-[30px] mx-auto md:mx-0"
              onMouseEnter={() => handleMouseEnter(a.tag)}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
