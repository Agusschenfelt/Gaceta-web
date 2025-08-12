import ListaShowsMobile from './ListaShowsMobile';
import TablaShowsDesktop from './TablaShowsDesktop';

export default function SeccionProximosShows() {

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
    {
      artista: 'Ramma',
      fecha: '21 de Julio',
      lugar: 'Sala Uni',
      ciudad: 'Madrid',
      pais: '🇪🇸',
      soldOut: false,
      link: 'https://entradas.example.com',
    },

  ];
  
  return (
    <section className="text-white py-10 flex flex-col m-14 mb-0 lg:m-0">
      <div className='lg:ml-[11.5rem] '>
        <span className="text-orange-500 text-lg font-medium xl:text-xl subtitulo">#Live</span> 
        <h2 className="titulo text-lg">
          próximos 
          <br />
          shows
        </h2>
      </div>

      <div className="block lg:hidden">
        <ListaShowsMobile shows={shows} />
      </div>

      <div className="hidden lg:block">
        <TablaShowsDesktop shows={shows} />
      </div>
    </section>
  );
}
