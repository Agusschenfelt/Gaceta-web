import CarrouselNewsHome from "./CarrouselNewsHeader"


const images = [
    "public/assets/header-img1.jpg",
    "public/assets/header-img2.png",
    "public/assets/header-img3.png"
]

const allSlides = [images, images, images]

export default function SeccionHeaderHome() {
    return (
        <div className="h-[80vh] mt-28">
            <CarrouselNewsHome images={images} />
        </div>
    )
}