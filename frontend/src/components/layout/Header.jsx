import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineShoppingCart,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineHeart,
  HiX,
  HiMenu,
  HiChevronDown,
} from 'react-icons/hi';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { toggleMenu, closeMenu } from '../../features/ui/uiSlice';
import { useGetCategoriesQuery, useGetProductSuggestionsQuery } from '../../services/productsApi';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const menuOpen = useSelector((s) => s.ui.menuOpen);
  const { data: categories = [] } = useGetCategoriesQuery();
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const suggestionsRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const catsRef = useRef(null);

  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (!suggestionsRef.current || !suggestionsRef.current.contains(e.target)) &&
        (!mobileSearchRef.current || !mobileSearchRef.current.contains(e.target))
      ) {
        setShowSuggestions(false);
      }
      if (catsRef.current && !catsRef.current.contains(e.target)) {
        setCatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/insumos?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setShowSuggestions(false);
      dispatch(closeMenu());
    }
  };

  const handleSuggestionClick = (product) => {
    navigate(`/insumos/${product._id}`);
    setSearch('');
    setShowSuggestions(false);
    dispatch(closeMenu());
  };

  const SuggestionsList = ({ compact = false }) => {
    if (!showSuggestions || search.trim().length === 0) return null;
    if (suggestions.length === 0) {
      return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-border rounded-xl shadow-nav z-50 p-4 text-center text-sm text-ink-soft">
          No se encontraron insumos
        </div>
      );
    }
    return (
      <div className={`absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-border rounded-xl shadow-nav z-50 overflow-hidden ${compact ? 'max-h-60' : 'max-h-80'} overflow-y-auto`}>
        {suggestions.map((product) => (
          <button
            key={product._id}
            onClick={() => handleSuggestionClick(product)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-surface-border last:border-b-0 text-left"
          >
            <div className={`${compact ? 'w-8 h-8' : 'w-11 h-11'} rounded-lg overflow-hidden flex-shrink-0 bg-pearl-dark`}>
              {product.imagenes?.[0]?.url ? (
                <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-soft">
                  <HiOutlineSearch size={16} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-ink truncate ${compact ? 'text-xs' : 'text-sm'}`}>{product.nombre}</p>
              <p className="text-xs text-ink-soft">
                ${product.precioOferta ? product.precioOferta.toLocaleString('es-AR') : product.precio.toLocaleString('es-AR')}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const navLink = 'px-3 py-2 text-sm font-semibold text-ink/70 hover:text-ink rounded-lg hover:bg-white/5 transition-colors';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-pearl/95 backdrop-blur-md border-b border-surface-border transition-shadow duration-300 ${
          scrolled ? 'shadow-nav' : ''
        }`}
      >
        <div className="page-wrap">
          <div className="flex items-center justify-between h-16 md:h-[72px] gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => dispatch(toggleMenu())}
                className="lg:hidden icon-btn"
                aria-label="Menú"
              >
                {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
              </button>
              <Link to="/" className="flex items-center gap-2" onClick={() => dispatch(closeMenu())}>
                <span className="font-display font-extrabold text-xl md:text-2xl tracking-tight text-ink">
                  MDFK<span className="text-primary-400">.</span>
                </span>
                <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-ink-soft font-semibold">
                  Tattoo
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-0.5 ml-6">
                <Link to="/" className={navLink}>Inicio</Link>
                <Link to="/trabajos" className={navLink}>Trabajos</Link>
                <Link to="/insumos" className={navLink}>Insumos</Link>
                <Link to="/turnos" className={navLink}>Turnos</Link>
                {categories.length > 0 && (
                  <div className="relative" ref={catsRef}>
                    <button
                      onClick={() => setCatsOpen((v) => !v)}
                      className={`flex items-center gap-1 ${navLink}`}
                    >
                      Categorías <HiChevronDown size={14} className={`transition-transform ${catsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {catsOpen && (
                      <div className="absolute left-0 top-full mt-2 w-56 bg-surface rounded-xl shadow-nav border border-surface-border py-2 z-50">
                        {categories.map((cat) => (
                          <Link
                            key={cat._id}
                            to={`/insumos?categoria=${cat._id}`}
                            onClick={() => setCatsOpen(false)}
                            className="block px-4 py-2.5 text-sm text-ink hover:bg-white/5 transition-colors"
                          >
                            {cat.nombre}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            <div className="hidden md:flex flex-1 max-w-xs mx-4 relative" ref={suggestionsRef}>
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full">
                  <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Buscar insumos..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-surface text-ink rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-400/50 placeholder:text-ink-soft/50"
                  />
                </div>
              </form>
              <SuggestionsList />
            </div>

            <div className="flex items-center gap-0.5">
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-1 icon-btn">
                    <HiOutlineUser size={22} />
                    <span className="hidden sm:block text-sm font-semibold max-w-[90px] truncate">
                      {user?.nombre}
                    </span>
                    <HiChevronDown size={14} className="hidden sm:block" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-xl shadow-nav border border-surface-border py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link to="/perfil" className="block px-4 py-2.5 text-sm hover:bg-white/5">Mi perfil</Link>
                    <Link to="/mis-ordenes" className="block px-4 py-2.5 text-sm hover:bg-white/5">Mis pedidos</Link>
                    <Link to="/favoritos" className="block px-4 py-2.5 text-sm hover:bg-white/5">Favoritos</Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-2.5 text-sm text-primary-400 font-bold hover:bg-white/5 border-t border-surface-border">
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 border-t border-surface-border"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="icon-btn" aria-label="Iniciar sesión">
                  <HiOutlineUser size={22} />
                </Link>
              )}

              {isAuthenticated && (
                <Link to="/favoritos" className="icon-btn" aria-label="Favoritos">
                  <HiOutlineHeart size={22} />
                </Link>
              )}

              <button onClick={toggleCart} className="relative icon-btn" aria-label="Carrito">
                <HiOutlineShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary-400 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold leading-none">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3" ref={mobileSearchRef}>
            <form onSubmit={handleSearch} className="relative">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Buscar insumos..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-surface text-ink rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-primary-400/50"
              />
              <SuggestionsList compact />
            </form>
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-40 transition-all duration-300 ${menuOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => dispatch(closeMenu())}
        />

        <nav
          className={`absolute top-0 left-0 w-[min(20rem,88vw)] h-full bg-surface shadow-2xl flex flex-col transition-transform duration-300 border-r border-surface-border ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <span className="font-display font-bold text-lg text-ink">MDFK Tattoo</span>
            <button onClick={() => dispatch(closeMenu())} className="icon-btn">
              <HiX size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {[
              ['/', 'Inicio'],
              ['/trabajos', 'Trabajos'],
              ['/insumos', 'Insumos'],
              ['/turnos', 'Reservar turno'],
            ].map(([to, label]) => (
              <Link
                key={to}
                to={to}
                onClick={() => dispatch(closeMenu())}
                className="flex items-center px-3 py-2.5 rounded-lg hover:bg-white/5 font-medium transition-colors text-ink"
              >
                {label}
              </Link>
            ))}

            {categories.length > 0 && (
              <div className="pt-3">
                <p className="px-3 text-[11px] font-semibold text-ink-soft uppercase tracking-[0.16em] mb-1">
                  Categorías
                </p>
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/insumos?categoria=${cat._id}`}
                    onClick={() => dispatch(closeMenu())}
                    className="flex items-center px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-colors text-ink/80"
                  >
                    {cat.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-surface-border space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/perfil" onClick={() => dispatch(closeMenu())} className="block w-full text-center btn-secondary text-sm">
                  Mi perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => dispatch(closeMenu())}
                    className="block w-full text-center btn-primary text-sm"
                  >
                    Panel Admin
                  </Link>
                )}
                <button onClick={() => { logout(); dispatch(closeMenu()); }} className="w-full btn-danger text-sm">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => dispatch(closeMenu())} className="block w-full text-center btn-primary text-sm">
                  Iniciar sesión
                </Link>
                <Link to="/registro" onClick={() => dispatch(closeMenu())} className="block w-full text-center btn-secondary text-sm">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
