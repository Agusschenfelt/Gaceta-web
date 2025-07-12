import ListaShowsMobile from './ListaShowsMobile';
import TablaShowsDesktop from './TablaShowsDesktop';

export default function SeccionProximosShows() {
  return (
    <section className="bg-black text-white py-10 flex flex-col mx-14">
      <span className="text-orange-500 text-lg font-medium mb-2">#Live</span> 
      <h2 className="text-6xl">
        <span className='font-semibold titulo'>próximos</span> 
        <br />
        <span className='font-instrument italic'>shows</span>
      </h2>

      <div className="block md:hidden">
        <ListaShowsMobile />
      </div>

      <div className="hidden md:block">
        <TablaShowsDesktop />
      </div>
    </section>
  );
}
