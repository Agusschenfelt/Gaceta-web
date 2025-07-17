import CarrouselFotosSobreNosotros from "./CarrouselFotosSobreNosotros";
import { TextDiv } from '../ui/AnimatedSection'


const images = [
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
]

export default function SeccionSobreNosotros() { 

    return (
        <section className="flex align-center flex-col gap-20">
            <TextDiv className="mx-auto flex align-center flex-col g-10">
                <span className="font-medium text-orange-500 text-lg mx-auto subtitulo">#SobreNosotros</span> 
                <h2 className="titulo">de la <span className="font-instrument italic">esperanza</span> <br /> al <span className="font-instrument italic">primer paso</span></h2>
            </TextDiv>
            <div className="flex align-center flex-col gap-11">
                <CarrouselFotosSobreNosotros images={images}/>
                <button className="rounded-full font-medium text-base leading-tight transition mx-auto h-8 px-5 w-[160px] subtitulo bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                    Conocé Gaceta 
                </button>
            </div>
        </section>
    )
}