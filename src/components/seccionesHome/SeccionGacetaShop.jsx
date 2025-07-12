import BotonGaceta from "../BotonGaceta";
import CarrouselFotosShop from "./CarrouselFotosShop";

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
        <section className="flex flex-col gap-6 ">
            <div>
                <span className="font-medium ml-14 text-orange-500 text-lg">#GacetaShop</span> 
                <h2 className="text-6xl text-white font-semibold titulo ml-14 mb-6">gaceta <br /> <span className="font-instrument italic">shop</span></h2>
            </div>
                <CarrouselFotosShop images={images} />
            <div className="flex justify-content-center mb-20 mt-10">
                <a href="https://gaceta.shop/" className="mx-auto"><BotonGaceta size="md">Visitar Shop</BotonGaceta></a>
            </div >
        </section>
    )
}