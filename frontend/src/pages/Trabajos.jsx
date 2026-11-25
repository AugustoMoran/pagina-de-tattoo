import React, { useState } from 'react';
import { useGetPortfolioQuery, useGetPortfolioStylesQuery, useGetArtistsQuery } from '../services/studioApi';
import SEO from '../components/common/SEO';
import { HiX } from 'react-icons/hi';

const Trabajos = () => {
  const [estilo, setEstilo] = useState('');
  const [artista, setArtista] = useState('');
  const [lightbox, setLightbox] = useState(null);

  const { data: styles = [] } = useGetPortfolioStylesQuery();
  const { data: artists = [] } = useGetArtistsQuery();
  const { data: items = [], isLoading } = useGetPortfolioQuery({
    ...(estilo ? { estilo } : {}),
    ...(artista ? { artista } : {}),
  });

  return (
    <div className="page-wrap py-10">
      <SEO title="Trabajos | MDFK Tattoo" description="Portfolio de trabajos del estudio MDFK Tattoo." />

      <div className="mb-10 animate-slide-up">
        <p className="section-kicker mb-1">Portfolio</p>
        <h1 className="section-title mb-2">Trabajos</h1>
        <p className="text-ink-soft text-sm max-w-lg">
          Selección de piezas del estudio. Filtrá por estilo o artista.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setEstilo('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            !estilo ? 'border-primary-400 text-primary-400' : 'border-surface-border text-ink-soft hover:border-ink/40'
          }`}
        >
          Todos los estilos
        </button>
        {styles.map((s) => (
          <button
            key={s}
            onClick={() => setEstilo(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              estilo === s ? 'border-primary-400 text-primary-400' : 'border-surface-border text-ink-soft hover:border-ink/40'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {artists.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setArtista('')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              !artista ? 'border-primary-400 text-primary-400' : 'border-surface-border text-ink-soft'
            }`}
          >
            Todos los artistas
          </button>
          {artists.map((a) => (
            <button
              key={a._id}
              onClick={() => setArtista(a._id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                artista === a._id ? 'border-primary-400 text-primary-400' : 'border-surface-border text-ink-soft'
              }`}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-ink-soft text-center py-20">No hay trabajos con esos filtros.</p>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {items.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => setLightbox(item)}
              className="portfolio-hover break-inside-avoid w-full block overflow-hidden bg-surface text-left"
            >
              <img
                src={item.imagen?.url}
                alt={item.titulo || 'Trabajo'}
                className="w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 icon-btn text-white"
            onClick={() => setLightbox(null)}
            aria-label="Cerrar"
          >
            <HiX size={28} />
          </button>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.imagen?.url}
              alt={lightbox.titulo || 'Trabajo'}
              className="w-full max-h-[80vh] object-contain"
            />
            <div className="mt-4 text-center">
              {lightbox.estilo && (
                <p className="text-[11px] uppercase tracking-widest text-primary-400 mb-1">{lightbox.estilo}</p>
              )}
              <p className="font-display text-lg text-ink">{lightbox.titulo}</p>
              {lightbox.artista?.nombre && (
                <p className="text-sm text-ink-soft mt-1">{lightbox.artista.nombre}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trabajos;
