import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetProductQuery, useGetRelatedProductsQuery } from '../services/productsApi';
import { useToggleFavoriteMutation, useGetMeQuery } from '../services/authApi';
import { formatCurrency } from '../utils/formatCurrency';
import useCart from '../hooks/useCart';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import ProductCard from '../components/products/ProductCard';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart, HiChevronLeft, HiOutlineFilm, HiChevronRight } from 'react-icons/hi';
import { FaWhatsapp, FaCreditCard } from 'react-icons/fa';
import { generateWhatsAppLink } from '../utils/generateWhatsAppLink';
import SEO from '../components/common/SEO';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: product, isLoading, error } = useGetProductQuery(id);
  const { data: related = [] } = useGetRelatedProductsQuery(id, { skip: !product });
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [selectedMedida, setSelectedMedida] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImage(0);
    setSelectedColor(null);
    setSelectedTalla(null);
    setSelectedMedida(null);
  }, [id]);

  const media = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.imagenes?.length) {
      product.imagenes.forEach((img) => list.push({ type: 'image', ...img }));
    }
    if (product.videos?.length) {
      product.videos.forEach((vid) => list.push({ type: 'video', ...vid }));
    }
    if (list.length === 0) {
      list.push({ type: 'image', url: 'https://via.placeholder.com/600x600?text=Sin+imagen' });
    }
    return list;
  }, [product]);

  const colorImageUrl = useMemo(() => {
    if (!product || !selectedColor) return null;
    const color = product.colores?.find((c) => c.nombre === selectedColor);
    return color?.imagen?.url || null;
  }, [product, selectedColor]);

  const mainDisplay = colorImageUrl
    ? { type: 'image', url: colorImageUrl }
    : media[selectedImage];

  const selectColor = (nombre) => {
    setSelectedColor(nombre);
    const color = product.colores?.find((c) => c.nombre === nombre);
    if (color?.imagen?.url) {
      // Prefer color-linked image as main view
      setSelectedImage(0);
    }
  };

  const attrs = product
    ? {
        usaTallas:
          product.atributos?.usaTallas ?? (product.tallas?.habilitadas?.length > 0),
        usaMedidas:
          product.atributos?.usaMedidas ?? (product.medidas?.habilitadas?.length > 0),
        usaColores:
          product.atributos?.usaColores ?? (product.colores?.filter((c) => c.habilitado !== false).length > 0),
      }
    : { usaTallas: false, usaMedidas: false, usaColores: false };

  const tallasActivas = attrs.usaTallas ? product?.tallas?.habilitadas || [] : [];
  const medidasActivas = attrs.usaMedidas ? product?.medidas?.habilitadas || [] : [];
  const coloresActivos = attrs.usaColores
    ? (product?.colores || []).filter((c) => c.habilitado !== false)
    : [];
  const medidaUnidad = product?.medidas?.unidad || 'mm';
  const medidaEtiqueta = product?.medidas?.etiqueta || 'Medida';

  const buildVariantLabel = () => {
    const parts = [];
    if (selectedTalla) parts.push(selectedTalla);
    if (selectedMedida) parts.push(`${selectedMedida}${medidaUnidad}`);
    return parts.length ? parts.join(' / ') : null;
  };

  const variantsReady = () => {
    if (tallasActivas.length && !selectedTalla) return false;
    if (medidasActivas.length && !selectedMedida) return false;
    if (coloresActivos.length && !selectedColor) return false;
    return true;
  };

  const handleBuyWithMP = () => {
    if (!variantsReady()) {
      alert('Seleccioná las opciones del producto (talle, medida y/o color)');
      return;
    }
    addToCart(product, qty, buildVariantLabel(), selectedColor);
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="page-wrap py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-surface rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-surface rounded w-3/4" />
            <div className="h-6 bg-surface rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-wrap py-16 text-center text-ink-soft">
        <p className="font-display text-xl text-ink mb-4">Producto no encontrado.</p>
        <Link to="/insumos" className="btn-primary mt-4 inline-block">Ver insumos</Link>
      </div>
    );
  }

  const isFavorite = me?.favoritos?.includes(product._id);
  const displayPrice = product.precioOferta || product.precio;
  const hasDiscount = product.precioOferta && product.precioOferta < product.precio;

  const waLink = generateWhatsAppLink(
    [{ producto: product, cantidad: qty, talla: buildVariantLabel(), color: selectedColor }],
    displayPrice * qty
  );

  return (
    <div className="page-wrap py-8">
      <SEO
        title={`${product.nombre} | MDFK Tattoo`}
        description={product.descripcion?.substring(0, 160)}
        image={product.imagenes?.[0]?.url}
        type="product"
      />

      <div className="flex items-center gap-2 text-sm text-ink-soft mb-8">
        <Link to="/insumos" className="flex items-center gap-1 hover:text-ink">
          <HiChevronLeft size={16} /> Insumos
        </Link>
        <span>/</span>
        <span>{product.categoria?.nombre}</span>
        <span>/</span>
        <span className="text-ink font-medium truncate max-w-[200px]">{product.nombre}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 mb-16">
        <div>
          <div className="rounded-xl overflow-hidden bg-surface border border-surface-border mb-3 relative group aspect-square">
            {mainDisplay?.type === 'video' ? (
              <video
                src={mainDisplay?.url}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mainDisplay?.url}
                alt={product.nombre}
                className="w-full h-full object-contain transition-opacity duration-300"
                key={mainDisplay?.url}
              />
            )}

            {!colorImageUrl && media.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === 0 ? media.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImage((prev) => (prev === media.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <HiChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {!colorImageUrl && media.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {media.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === i ? 'border-primary-400' : 'border-surface-border'
                  }`}
                >
                  {item.type === 'video' ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <HiOutlineFilm size={20} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:sticky md:top-24 md:self-start">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-xs uppercase tracking-wider text-ink-soft">{product.categoria?.nombre}</p>
            <button
              onClick={() => toggleFavorite(product._id)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
            >
              {isFavorite ? <HiHeart size={22} className="text-red-500" /> : <HiOutlineHeart size={22} className="text-ink-soft" />}
            </button>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4">{product.nombre}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-display text-3xl font-extrabold text-ink">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-ink-soft line-through">{formatCurrency(product.precio)}</span>
                <span className="badge bg-primary-400/20 text-primary-400 font-bold">
                  -{Math.round(((product.precio - product.precioOferta) / product.precio) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="text-ink-soft leading-relaxed mb-6">{product.descripcion}</p>

          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="badge bg-emerald-500/15 text-emerald-400">En stock ({product.stock})</span>
            ) : (
              <span className="badge bg-red-500/15 text-red-400">Sin stock</span>
            )}
          </div>

          {tallasActivas.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">
                Talle {product.tallas?.rango && `(${product.tallas.rango})`}
              </label>
              <div className="flex gap-2 flex-wrap">
                {tallasActivas.map((talla) => (
                  <button
                    key={talla}
                    type="button"
                    onClick={() => setSelectedTalla(talla)}
                    className={`min-w-[3rem] px-4 py-2 border rounded-lg font-medium transition-all ${
                      selectedTalla === talla
                        ? 'border-primary-400 bg-primary-400 text-white'
                        : 'border-surface-border bg-surface text-ink-soft hover:border-ink/40'
                    }`}
                  >
                    {talla}
                  </button>
                ))}
              </div>
            </div>
          )}

          {medidasActivas.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">{medidaEtiqueta}</label>
              <div className="flex gap-2 flex-wrap">
                {medidasActivas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMedida(m)}
                    className={`min-w-[3rem] px-4 py-2 border rounded-lg font-medium transition-all ${
                      selectedMedida === m
                        ? 'border-primary-400 bg-primary-400 text-white'
                        : 'border-surface-border bg-surface text-ink-soft hover:border-ink/40'
                    }`}
                  >
                    {m}
                    {medidaUnidad}
                  </button>
                ))}
              </div>
            </div>
          )}

          {coloresActivos.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">
                Color{selectedColor ? `: ${selectedColor}` : ''}
              </label>
              <div className="flex gap-3 flex-wrap">
                {coloresActivos.map((color) => (
                  <button
                    key={`${color.nombre}-${color.codigo}`}
                    type="button"
                    onClick={() => selectColor(color.nombre)}
                    className={`relative w-11 h-11 rounded-full border-2 transition-all ${
                      selectedColor === color.nombre
                        ? 'border-primary-400 ring-2 ring-offset-2 ring-offset-pearl ring-primary-400'
                        : 'border-surface-border hover:border-ink/50'
                    }`}
                    style={{ backgroundColor: color.codigo }}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>
          )}

          {product.stock > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-ink">Cantidad</label>
                <div className="flex items-center border border-surface-border bg-surface rounded-lg overflow-hidden">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 py-2 hover:bg-white/5 text-lg">-</button>
                  <span className="px-4 py-2 font-medium">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3.5 py-2 hover:bg-white/5 text-lg">+</button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!variantsReady()) {
                    alert('Seleccioná las opciones del producto (talle, medida y/o color)');
                    return;
                  }
                  addToCart(product, qty, buildVariantLabel(), selectedColor);
                }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <HiOutlineShoppingCart size={20} />
                Agregar al carrito
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleBuyWithMP}
                  className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-3 rounded-lg transition-all disabled:opacity-40"
                  disabled={!variantsReady()}
                >
                  <FaCreditCard size={18} />
                  <span className="text-sm">Mercado Pago</span>
                </button>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold px-4 py-3 rounded-lg transition-all"
                >
                  <FaWhatsapp size={18} />
                  <span className="text-sm">WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="pb-16">
          <p className="section-kicker mb-1">Seguí explorando</p>
          <h2 className="section-title mb-6">Relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
