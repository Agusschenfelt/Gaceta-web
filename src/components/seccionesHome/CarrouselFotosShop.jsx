import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';


export default function CarrouselFotosShop({ images }) {

  return (
    <div className="w-full h-[400px]">
      <Swiper
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={2}
        loop={true}
        initialSlide={1}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        modules={[EffectCoverflow, Pagination, Autoplay]}
        className="w-full h-[500px]"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx} className="w-[220px] h-[400px] rounded-[3.3rem] overflow-hidden">
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}