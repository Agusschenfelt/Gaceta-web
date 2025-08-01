import SlideArtista from "./SliderArtista";
import { MediaSection } from '../ui/AnimatedSection'
import { CgArrowTopRight } from "react-icons/cg";


const artistas = [
  {
    nombre: 'Ramma',
    imgSrc: 'src/assets/remera-blanca.jpeg',
    videoSrc: 'src/assets/8e04e54a968e81ad150bedb36acdfc668b036eb4.webm',
    spotifyUrl: 'https://open.spotify.com/intl-es/artist/7b0pdDyPV9f9hyDXAhk4Sg',
  },
  {
    nombre: 'Valuto',
    imgSrc: 'src/assets/valuto.jpg',
    videoSrc: 'src/assets/valuto-video.webm',
    spotifyUrl: 'https://open.spotify.com/artist/xxxxxxxx',
  },
  {
    nombre: 'Valuto',
    imgSrc: 'src/assets/valuto.jpg',
    videoSrc: 'src/assets/valuto-video.webm',
    spotifyUrl: 'https://open.spotify.com/artist/xxxxxxxx',
  },
  
];


export default function SeccionArtistas() {
    return (
        <MediaSection className="flex flex-col md:flex-row md:justify-between md:mr-[10%]  gap-14 relative ">
          <div className="ml-14 lg:ml-[11.5rem]">
            <span className="subtitulo font-medium text-orange-500 text-lg xl:text-xl">#Artistas</span> 
            <h2 className="titulo">en <br className="hidden lg:block"/> primera <br /><span className="font-instrument italic">persona</span></h2>
          </div>
          <div className="flex flex-col gap-7 ">
            <div className="flex gap-4 overflow-x-auto sm:gap-8 md:gap-4 ml-14 lg:gap-9">
              {artistas.map((artista, index) => (
                    <SlideArtista key={index} {...artista} />
              ))}
            </div>
            <div className="w-full flex justify-end mt-4">
              <button className="rounded-full inline-flex items-center justify-center font-normal text-base leading-none inter transition mr-[11%] sm:mr-[17%] md:mr-[11%] lg:mr-[0] py-2 px-5 lg:px-3 w-[130px] lg:w-[240px] lg:h-10 lg:text-lg lg:py-5 bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                Todos los artistas
                <CgArrowTopRight className="size-5" />
              </button>
            </div>
          </div>
        </MediaSection>
    );
}