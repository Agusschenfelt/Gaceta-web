import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';


export default function CarrouselFotosSobreNosotros( { images } ) {
    return (
        <div className='w-full'>
            <Swiper
                slidesPerView={2}
                loop={true}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                modules={[Autoplay, Pagination]}
                className="mySwiper"
            >
                {images.map((src, idx) => (
                    <SwiperSlide key={idx}>
                        <img
                            src={src}
                            alt={`slide-${idx}`}
                            loading="lazy"
                            className="w-[300px] h-[300px] object-cover"
                        />
                    </SwiperSlide>
                ))};
            </Swiper>
        </div>
    );
}