import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import Logo from '../common/Logo';

const Footer = () => {
  const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '5491137764237';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/mdfk.tattoo';
  const storeName = import.meta.env.VITE_STORE_NAME || 'MDFK Tattoo';

  return (
    <footer className="bg-pearl border-t border-surface-border text-ink-soft mt-24">
      <div className="h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
      <div className="page-wrap py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="h-16 w-16 rounded-md shadow-[0_0_0_1px_rgba(186,214,206,0.16),0_12px_30px_rgba(0,0,0,0.35)]" />
              <p className="font-display text-3xl font-extrabold text-ink tracking-tight">
                MDFK<span className="text-primary-400">.</span>
              </p>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Estudio de tatuajes. Portfolio, insumos profesionales y turnos con seña.
              Coordiná por WhatsApp o reservá online.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-surface-border flex items-center justify-center text-ink hover:border-[#25D366] hover:text-[#25D366] transition-all"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={16} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg border border-surface-border flex items-center justify-center text-ink hover:border-primary-400 hover:text-primary-400 transition-all"
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-ink mb-4 text-sm uppercase tracking-wider">Explorar</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/trabajos" className="hover:text-primary-400 transition-colors">Trabajos</Link></li>
              <li><Link to="/insumos" className="hover:text-primary-400 transition-colors">Insumos</Link></li>
              <li><Link to="/turnos" className="hover:text-primary-400 transition-colors">Reservar turno</Link></li>
              <li><Link to="/mis-ordenes" className="hover:text-primary-400 transition-colors">Mis pedidos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-ink mb-4 text-sm uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">
                  @mdfk.tattoo
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border py-5">
        <div className="page-wrap text-center text-xs text-ink-soft/60">
          © {new Date().getFullYear()} {storeName}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
