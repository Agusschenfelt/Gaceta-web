import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';


export default function CarrouselNewsHome( {images} ) {
    
    const originals = images;
    const origCount  = originals.length;
    const extImages  = [...originals, ...originals];

    return (
        
        <div className="relative w-full h-full">
            <div className="custom-pagination lg:hidden" />
            <Swiper
                effect="coverflow"
                grabCursor={true}
                centeredSlides={true}
                loop={true}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                slidesPerView={1.3} 
                initialSlide= {origCount +1}
                coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
                }}
                pagination={{
                    el: '.custom-pagination',
                    clickable: true,
                    type: 'custom',
                    renderCustom: (swiper) => {
                        let html = '';
                        for (let i = 0; i < origCount; i++) {
                            const isActive = swiper.realIndex % origCount === i;
                            html += `<span class="swiper-pagination-bullet${isActive ? ' swiper-pagination-bullet-active' : ''}"></span>`;
                        }
                        return html;
                    }
                }}
                modules={[EffectCoverflow, Pagination, Autoplay]}
                className="relative w-full h-full"  
            >
                {extImages.map((src, idx) => (
                <SwiperSlide
                    key={idx}
                    className="w-full h-[85%] rounded-[4rem] overflow-hidden"
                >
                    <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    />
                </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}