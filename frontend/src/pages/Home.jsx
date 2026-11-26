import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGetPortfolioQuery } from '../services/studioApi';
import { useGetProductsQuery } from '../services/productsApi';
import ProductCard from '../components/products/ProductCard';
import SEO from '../components/common/SEO';
import Logo from '../components/common/Logo';
import { HiArrowRight } from 'react-icons/hi';

const HERO_IMG =
  'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1920&q=80';

const Home = () => {
  const { data: portfolio = [] } = useGetPortfolioQuery({ destacado: 'true' });
  const { data: productsData } = useGetProductsQuery({ limit: 4, sort: 'newest' });
  const featured = portfolio.length ? portfolio.slice(0, 8) : [];
  const products = productsData?.products || [];
  const revealRef = useRef(null);

  useEffect(() => {
    const nodes = revealRef.current?.querySelectorAll('[data-reveal]');
    if (!nodes?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('animate-reveal');
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [featured, products]);

  return (
    <div ref={revealRef}>
      <SEO
        title="MDFK Tattoo | Estudio de Tatuajes"
        description="Portfolio, insumos profesionales y turnos con seña. Estudio MDFK Tattoo."
        keywords="tatuajes, tattoo, piercing, insumos, mdfk, turnos"
      />

      {/* Hero — full-bleed, brand first */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <img
          src={HERO_IMG}
          alt="MDFK Tattoo estudio"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pearl via-pearl/70 to-black/40" />
        <div className="relative page-wrap pb-16 pt-32 w-full animate-slide-up">
          <Logo className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-md mb-5 shadow-[0_0_0_1px_rgba(186,214,206,0.16),0_16px_40px_rgba(0,0,0,0.45)]" />
          <p className="section-kicker mb-3">Estudio · Portfolio · Insumos</p>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-extrabold text-ink tracking-tight leading-[0.95] mb-4">
            MDFK<span className="text-primary-400">.</span>
          </h1>
          <p className="text-ink-soft text-base sm:text-lg max-w-md mb-8">
            Tatuajes con identidad. Mirá el trabajo, reservá tu turno o llevate insumos del estudio.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/trabajos" className="btn-primary">
              Ver trabajos
            </Link>
            <Link to="/turnos" className="btn-secondary">
              Reservar turno
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio strip */}
      <section className="page-wrap pt-20" data-reveal style={{ opacity: 0 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-kicker mb-1">Portfolio</p>
            <h2 className="section-title">Trabajos recientes</h2>
          </div>
          <Link to="/trabajos" className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center gap-1">
            Ver todo <HiArrowRight size={16} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-ink-soft text-sm py-12 text-center border border-dashed border-surface-border rounded-xl">
            Pronto cargamos el portfolio desde el panel.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {featured.map((item) => (
              <Link
                key={item._id}
                to="/trabajos"
                className="portfolio-hover relative aspect-[3/4] overflow-hidden bg-surface group"
              >
                <img
                  src={item.imagen?.url}
                  alt={item.titulo || 'Trabajo MDFK'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <div>
                    {item.estilo && (
                      <p className="text-[10px] uppercase tracking-widest text-primary-400 mb-0.5">{item.estilo}</p>
                    )}
                    <p className="text-sm font-medium text-white truncate">{item.titulo || item.artista?.nombre}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA turnos */}
      <section className="mt-24 relative overflow-hidden" data-reveal style={{ opacity: 0 }}>
        <div className="page-wrap py-16 border-y border-surface-border">
          <div className="max-w-xl">
            <p className="section-kicker mb-2">Agenda</p>
            <h2 className="section-title mb-3">Reservá tu turno</h2>
            <p className="text-ink-soft text-sm mb-6">
              Elegí artista y horario, aboná la seña por Mercado Pago o WhatsApp, y coordinamos el resto.
            </p>
            <Link to="/turnos" className="btn-primary inline-flex items-center gap-2">
              Pedir turno <HiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Insumos preview */}
      <section className="page-wrap py-20" data-reveal style={{ opacity: 0 }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-kicker mb-1">Tienda</p>
            <h2 className="section-title">Insumos del estudio</h2>
          </div>
          <Link to="/insumos" className="text-primary-400 hover:text-primary-300 text-sm font-semibold flex items-center gap-1">
            Ver tienda <HiArrowRight size={16} />
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-ink-soft text-sm">Sin productos cargados todavía.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
