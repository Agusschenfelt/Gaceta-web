export default function SlideArtista({ nombre, imgSrc, videoSrc, spotifyUrl }) {
  return (
    <article className="flex flex-col transition-[flex,transform,box-shadow] duration-300 flex-[0_1_10%] min-w-[125px] sm:min-w-[140px] sm:h-[55vh] md:min-w-[125px] h-[50vh] relative overflow-hidden lg:min-w-[160px] lg:h-[70vh] lg:hover:flex-[0_1_30%] lg:hover:z-10 lg:hover:shadow-2xl lg:hover:rounded-[4em] group">
      
      <div className="relative flex sm:items-end overflow-hidden h-full w-full rounded-[4.5em]">
        
        <img
          loading="lazy"
          src={imgSrc}
          alt={`Preview de ${nombre}`}
          className="absolute top-0 left-0 w-full h-full object-cover z-20 transition-opacity duration-300 lg:group-hover:opacity-0"
        />
        
        <video
          className="absolute top-0 left-0 w-full h-full object-cover z-10 opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100"
          src={videoSrc}
          muted
          loop
          playsInline
        />

        <div className="absolute top-4 left-2 bg-transparent p-3 rounded opacity-0 transition-opacity duration-300 z-30 text-white text-center lg:group-hover:opacity-100">
          <h3 className="text-2xl font-black">
            <span className="italic">{nombre}</span>
          </h3>
          <a
            className="inline-block mt-2 bg-red-600/70 text-white px-4 py-1 rounded font-semibold hover:bg-red-600 transition-colors duration-200"
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escuchá en Spotify →
          </a>
        </div>

      </div>
    </article>
  );
}