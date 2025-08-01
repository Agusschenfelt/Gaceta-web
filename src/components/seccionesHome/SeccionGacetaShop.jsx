import CarrouselFotosShop from "./CarrouselFotosShop";
import { TextDiv } from '../ui/AnimatedSection';

const images = [
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
];

export default function SeccionGacetaShop() {
    return (
        <section className="flex flex-col gap-24 h-[80vh] mb-12 lg:mb-28">
            <TextDiv className='ml-14 lg:m-auto flex flex-col'>
                <span className="font-medium lgmx-auto text-orange-500 text-lg subtitulo xl:text-xl">#GacetaShop</span> 
                <h2 className="titulo ">gaceta <br className="lg:hidden"/> <span className="font-instrument italic">shop</span></h2>
            </TextDiv>
            <div className="flex gap-14 flex-col">
                <CarrouselFotosShop images={images} />
                <div className="hidden lg:grid grid-cols-4 gap-8 px-12 h-100%"> 
                    {images.map((src, idx) =>(
                      <img src={src} key={idx} alt={idx} className="w-full h-full object-cover hover:scale-105 transition-transform rounded-[3rem]" loading="lazy"  />  
                    ))}
                </div>
                <div className="flex justify-content-center">
                    <button className="rounded-full font-medium text-base leading-tight transition mx-auto h-9 w-[160px] inter bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                        Visitar Shop 
                    </button>
                </div >
            </div>
        </section>
    )
}