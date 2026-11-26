import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAdmin } from '../../features/auth/authSlice';
import {
  HiOutlineViewGrid,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineTicket,
  HiOutlinePhotograph,
  HiOutlineCollection,
  HiOutlineHome,
  HiOutlineChatAlt2,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineColorSwatch,
  HiOutlineCog,
} from 'react-icons/hi';
import Logo from '../common/Logo';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineViewGrid, exact: true },
  { to: '/admin/turnos', label: 'Solicitudes', icon: HiOutlineCalendar },
  { to: '/admin/agenda', label: 'Agenda', icon: HiOutlineClock },
  { to: '/admin/artistas', label: 'Artistas', icon: HiOutlineUserGroup },
  { to: '/admin/portfolio', label: 'Portfolio', icon: HiOutlineColorSwatch },
  { to: '/admin/productos', label: 'Insumos', icon: HiOutlineCube },
  { to: '/admin/categorias', label: 'Categorías', icon: HiOutlineTag },
  { to: '/admin/ordenes', label: 'Pedidos', icon: HiOutlineClipboardList },
  { to: '/admin/cupones', label: 'Cupones', icon: HiOutlineTicket },
  { to: '/admin/banners', label: 'Banners', icon: HiOutlineCollection },
  { to: '/admin/popup', label: 'Popup WhatsApp', icon: HiOutlineChatAlt2 },
  { to: '/admin/cloudinary', label: 'Almacenamiento', icon: HiOutlinePhotograph },
  { to: '/admin/configuracion', label: 'Configuración', icon: HiOutlineCog },
];

const AdminLayout = ({ children }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-pearl text-ink">
      <aside className="w-56 bg-surface border-r border-surface-border flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-9 rounded-[4px] shadow-[0_0_0_1px_rgba(186,214,206,0.16)]" />
            <div>
              <p className="font-display font-bold text-ink">Panel Admin</p>
              <p className="text-[11px] text-primary-400 mt-0.5 tracking-wide">MDFK Tattoo</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary-400/15 text-primary-400 font-semibold'
                    : 'text-ink-soft hover:bg-white/5 hover:text-ink'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-surface-border">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-ink-soft hover:bg-white/5 hover:text-ink transition-colors">
            <HiOutlineHome size={18} />
            Ir al sitio
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-pearl p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
