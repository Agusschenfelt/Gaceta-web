import { MediaSectionShows } from '../ui/AnimatedSection'

export default function ListaShowsMobile({ shows }) {

  return (
    <div className="flex flex-col gap-4 mt-20 ">
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