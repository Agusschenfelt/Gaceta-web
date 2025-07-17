import { MediaSectionShows } from '../ui/AnimatedSection'

export default function ListaShowsMobile() {
  const shows = [
    {
      artista: 'Ramma',
      fecha: '31 de Marzo',
      lugar: 'Sala El Sol',
      ciudad: 'Madrid',
      pais: '🇪🇸',
      soldOut: true,
    },
    {
      artista: 'Ramma',
      fecha: '06 de Abril',
      lugar: 'Sauvage',
      ciudad: 'Barcelona',
      pais: '🇪🇸',
      soldOut: true,
    },
    {
      artista: 'Ramma',
      fecha: '11 de Abril',
      lugar: 'C Art Media',
      ciudad: 'Buenos Aires',
      pais: '🇦🇷',
      soldOut: false,
      link: 'https://entradas.example.com',
    },
    {
      artista: 'Ramma',
      fecha: '27 de Mayo',
      lugar: 'Groove',
      ciudad: 'Buenos Aires',
      pais: '🇦🇷',
      soldOut: false,
      link: 'https://entradas.example.com',
    },
    {
      artista: 'Valuto',
      fecha: '7 de Agosto',
      lugar: 'Magnolio Sala',
      ciudad: 'Montevideo',
      pais: '🇺🇾',
      soldOut: false,
      link: 'https://entradas.example.com',
    },
    {
      artista: 'Valuto',
      fecha: '28 de Agosto',
      lugar: 'La Tangente',
      ciudad: 'Buenos Aires',
      pais: '🇦🇷',
      soldOut: false,
      link: 'https://entradas.example.com',
    },
  ];

  return (
    <div className="flex flex-col gap-4 mt-20  w-">
      {shows.map((show, idx) => (
        <MediaSectionShows
          key={idx}
          className={`flex items-center justify-between py-3 rounded-full relative ${
            show.soldOut ? 'bg-gray-600' : 'bg-orange-600'
          }`}
        >
          <div className="text-sm text-white mx-auto flex flex-col">
            <p className="text-sm font-semibold mx-auto leading-3 subtitulo">{show.fecha}</p>
            <p className="text-sm leading-5  mt-[2px] subtitulo">
              {show.lugar} – {show.ciudad} ({show.pais})
            </p>
          </div>

          {show.soldOut ? (
            <span className="bg-red-600 text-white text-base py-1 px-3 rounded-[2px] font-bold absolute -right-3 top-1/2 transform -translate-y-1/2 -rotate-12 font-roboto">
              SOLD OUT
            </span>
          ) : (
            <a
              href={show.link}
              target="_blank"
              rel="noreferrer"
              className="text-[1.3rem] text-white absolute top-1/2 transform -translate-y-1/2 right-4 ">
            ᐳ
            </a>
          )}
        </MediaSectionShows>
      ))}
    </div>
  );
}