import CarrouselFotosSobreNosotros from "./CarrouselFotosSobreNosotros";
import { TextDiv } from '../ui/AnimatedSection'
import { Link } from "react-router-dom";
import { CgArrowTopRight } from "react-icons/cg";


const images = [
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
    "src/assets/tadu_compu.jpg",
]

export default function SeccionSobreNosotros() { 

    return (
        <section className="flex align-center flex-col gap-20">
            <TextDiv className="mx-auto flex align-center flex-col g-10">
                <span className="font-medium text-orange-500 text-lg xl:text-xl mx-auto subtitulo">#SobreNosotros</span> 
                <h2 className="titulo">de la <span className="font-instrument italic">esperanza</span> <br /> al <span className="font-instrument italic">primer paso</span></h2>
            </TextDiv>
            <div className="flex align-center flex-col gap-11">
                <CarrouselFotosSobreNosotros images={images}/>
                <Link to="/sobre-nosotros" className="w-[190px] lg:w-[20%] mx-auto">
                    <button className="rounded-full inline-flex items-center justify-center font-medium text-base leading-tight transition h-8 px-1 w-full lg:h-9 lg:px-4 lg:text-lg inter bg-orange-500 text-white border border-orange-500 hover:bg-white hover:text-orange-500">
                        Conocé Gaceta 
                        <CgArrowTopRight className="size-5" />
                    </button>
                </Link>
            </div>
        </section>
    )
}