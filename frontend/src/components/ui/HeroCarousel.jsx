import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useGetBannersQuery } from '../../services/bannersApi';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

/**
 * @param {{ onlyApi?: boolean, className?: string }} props
 * onlyApi: if true, render nothing when there are no active banners from API
 */
const HeroCarousel = ({ onlyApi = false, className = '' }) => {
  const { data: apiBanners, isLoading } = useGetBannersQuery(true);

  const slides =
    apiBanners && apiBanners.length > 0
      ? apiBanners.map((b) => {
          const videoUrl = b.video?.trim() || '';
          const imagenUrl = b.imagen?.trim() || '';
          const isTruthy = (val) => val === true || val === 'true' || val === 1 || val === '1';
          return {
            ...b,
            video: videoUrl,
            imagen: imagenUrl,
            esVideoValido: videoUrl.startsWith('http'),
            esImagenValida: imagenUrl.startsWith('http'),
            mostrarTexto: isTruthy(b.mostrarTexto),
            mostrarBoton: isTruthy(b.mostrarBoton),
            autoplay: b.autoplay === true || b.autoplay === 'true',
            ctaLink: b.ctaLink || '/insumos',
          };
        })
      : [];

  if (onlyApi && (isLoading || slides.length === 0)) return null;

  if (slides.length === 0) return null;

  return (
    <div className={`w-full bg-pearl ${className}`}>
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop={slides.length > 1}
        className="w-full aspect-[16/9] sm:aspect-[21/9] max-h-[420px]"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide._id}>
            <div className="relative w-full h-full overflow-hidden bg-surface">
              {slide.esVideoValido ? (
                <video
                  src={slide.video}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              ) : slide.esImagenValida ? (
                <img
                  src={slide.imagen}
                  alt={slide.titulo || 'Banner'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-pearl via-pearl/40 to-transparent" />
              <div className="relative z-10 h-full flex items-end pb-10">
                <div className="page-wrap w-full">
                  <div className="max-w-xl animate-slide-up">
                    {slide.mostrarTexto && (
                      <>
                        {slide.titulo?.trim() && (
                          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-ink mb-2 leading-tight">
                            {slide.titulo}
                          </h2>
                        )}
                        {slide.subtitulo?.trim() && (
                          <p className="text-sm sm:text-base text-ink-soft mb-5">{slide.subtitulo}</p>
                        )}
                      </>
                    )}
                    {slide.mostrarBoton && slide.ctaTexto?.trim() && (
                      <Link to={slide.ctaLink || '/insumos'} className="btn-primary inline-flex">
                        {slide.ctaTexto}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroCarousel;
