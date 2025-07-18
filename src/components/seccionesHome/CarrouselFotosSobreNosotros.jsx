import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';


export default function CarrouselFotosSobreNosotros( { images } ) {
    return (
        <div className='w-full'>
            <Swiper
                slidesPerView={3}
                loop={true}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                modules={[Autoplay, Pagination]}
                breakpoints={{ 
                    0:    { slidesPerView: 2 },
                    540:  { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1280: { slidesPerView: 5 },
                    1536: { slidesPerView: 6 }
                }}
                className="mySwiper"
            >
                {images.map((src, idx) => (
                    <SwiperSlide key={idx}>
                        <img
                            src={src}
                            alt={`slide-${idx}`}
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                    </SwiperSlide>
                ))};
            </Swiper>
        </div>
    );
}