import SlideArtista from "./SliderArtista";
import { MediaSection } from '../ui/AnimatedSection'


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
        <MediaSection className="flex flex-col gap-14 relative">
          <div className="ml-14">
            <span className="subtitulo font-medium text-orange-500 text-lg">#Artistas</span> 
            <h2 className="titulo">en primera <br /><span className="font-instrument italic">persona</span></h2>
          </div>
          <div className="flex flex-col gap-7">
            <div className="flex gap-4 overflow-x-auto ml-14">
              {artistas.map((artista, index) => (
                    <SlideArtista key={index} {...artista} />
              ))}
            </div>
            <div className="w-full flex justify-end mt-4">
              <button className="rounded-full font-medium text-base leading-none transition mr-[11%] py-2 px-5 w-[130px] bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                Todos los artistas
              </button>
            </div>
          </div>
        </MediaSection>
    );
}