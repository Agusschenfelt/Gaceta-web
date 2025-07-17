import CarrouselFotosShop from "./CarrouselFotosShop";
import { TextDiv } from '../ui/AnimatedSection'

const images = [
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg',
    '/assets/ramma-merch.jpg'
];

export default function SeccionGacetaShop() {
    return (
        <section className="flex flex-col gap-12 ">
            <TextDiv>
                <span className="font-medium ml-14 text-orange-500 text-lg subtitulo">#GacetaShop</span> 
                <h2 className="titulo ml-14">gaceta <br /> <span className="font-instrument italic">shop</span></h2>
            </TextDiv>
            <div>
                <CarrouselFotosShop images={images} />
                <div className="flex justify-content-center mb-20 mt-10">
                    <button className="rounded-full font-medium text-base leading-tight transition mx-auto h-9 w-[160px] subtitulo bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                        Visitar Shop 
                    </button>
                </div >
            </div>
        </section>
    )
}