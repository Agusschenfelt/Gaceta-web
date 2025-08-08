import { Link } from 'react-router-dom';

export default function ArtistsGrid({ artists }) {
  return (
    <div className="p-6 bg-black min-h-screen mt-20 sm:mt-28 flex flex-col gap-28 mx-14 lg:mx-28">
      <div>
            <span className="text-orange-500 text-base font-medium xl:text-xl subtitulo">
              #Artistas
            </span>
            <h2 className="titulo">
              en
            <br />
              primera 
            <br />
              <span className="cursiva">persona</span>
            </h2>
        </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {artists.map(a => (
          <Link
            key={a.id}
            to={`/artistas/${a.id}`}
            className="block overflow-hidden rounded-xl"
          >
            <img
              src={a.photo}
              alt={a.name}
              className="w-full h-auto object-cover transform hover:scale-105 transition"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
