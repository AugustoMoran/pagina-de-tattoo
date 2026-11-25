import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useGetArtistsQuery,
  useGetArtistAvailabilityQuery,
  useGetSettingsQuery,
  useCreateAppointmentMutation,
} from '../services/studioApi';
import useAuth from '../hooks/useAuth';
import SEO from '../components/common/SEO';
import { formatCurrency } from '../utils/formatCurrency';
import { FaWhatsapp, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Turnos = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: artists = [] } = useGetArtistsQuery();
  const { data: settings } = useGetSettingsQuery();
  const [createAppointment, { isLoading }] = useCreateAppointmentMutation();

  const [artistaId, setArtistaId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [metodoPago, setMetodoPago] = useState('whatsapp');
  const [form, setForm] = useState({
    nombreCliente: user?.nombre || '',
    emailCliente: user?.email || '',
    telefonoCliente: user?.telefono || '',
    notas: '',
  });
  const [result, setResult] = useState(null);

  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 45);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const { data: availability, isFetching: loadingSlots } = useGetArtistAvailabilityQuery(
    { id: artistaId, ...range },
    { skip: !artistaId }
  );

  const slots = availability?.slots || [];

  const slotsByDay = useMemo(() => {
    const map = {};
    for (const iso of slots) {
      const d = new Date(iso);
      const key = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!map[key]) map[key] = [];
      map[key].push(iso);
    }
    return map;
  }, [slots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!artistaId || !fechaHora) {
      toast.error('Elegí artista y horario');
      return;
    }
    try {
      const res = await createAppointment({
        artistaId,
        fechaHora,
        metodoPago,
        ...form,
      }).unwrap();
      setResult(res);
      toast.success('Turno solicitado');
      if (metodoPago === 'whatsapp' && res.whatsappUrl) {
        window.open(res.whatsappUrl, '_blank');
      }
      if (metodoPago === 'mercadopago' && res.mpData?.initPoint) {
        window.location.href = res.mpData.initPoint;
      }
    } catch (err) {
      toast.error(err?.data?.message || 'No se pudo solicitar el turno');
    }
  };

  if (result && metodoPago === 'whatsapp') {
    return (
      <div className="page-wrap py-16 max-w-lg mx-auto text-center">
        <SEO title="Turno solicitado | MDFK Tattoo" />
        <p className="section-kicker mb-2">Listo</p>
        <h1 className="section-title mb-3">Turno solicitado</h1>
        <p className="text-ink-soft text-sm mb-2">
          Código <span className="text-primary-400 font-semibold">{result.appointment?.codigo}</span>
        </p>
        <p className="text-ink-soft text-sm mb-8">
          Quedó pendiente de confirmación del estudio. Ya te abrimos WhatsApp con el mensaje del turno.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={result.whatsappUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center justify-center gap-2">
            <FaWhatsapp /> Abrir WhatsApp
          </a>
          <Link to="/" className="btn-secondary">Volver al inicio</Link>
        </div>
        {!isAuthenticated && (
          <p className="text-xs text-ink-soft mt-8">
            ¿Querés seguir tus pedidos y turnos?{' '}
            <Link to="/registro" className="text-primary-400 underline">Registrate</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="page-wrap py-10 max-w-3xl">
      <SEO title="Reservar turno | MDFK Tattoo" description="Pedí tu turno con seña en MDFK Tattoo." />

      <div className="mb-10">
        <p className="section-kicker mb-1">Agenda</p>
        <h1 className="section-title mb-2">Reservar turno</h1>
        <p className="text-ink-soft text-sm">
          Seña actual:{' '}
          <span className="text-ink font-semibold">
            {formatCurrency(settings?.montoSenia ?? 0)}
          </span>
          . El admin confirma el turno después del pago.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-xl border border-surface-border bg-surface text-sm text-ink-soft">
          Podés reservar como invitado. Si ya tenés cuenta,{' '}
          <Link to="/login" className="text-primary-400 underline">iniciá sesión</Link>
          {' '}o{' '}
          <Link to="/registro" className="text-primary-400 underline">registrate</Link>.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold mb-3">1. Artista</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {artists.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => { setArtistaId(a._id); setFechaHora(''); }}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  artistaId === a._id
                    ? 'border-primary-400 bg-primary-400/10'
                    : 'border-surface-border bg-surface hover:border-ink/30'
                }`}
              >
                <p className="font-semibold text-ink">{a.nombre}</p>
                {a.especialidades?.length > 0 && (
                  <p className="text-xs text-ink-soft mt-1">{a.especialidades.join(' · ')}</p>
                )}
              </button>
            ))}
            {artists.length === 0 && (
              <p className="text-sm text-ink-soft col-span-2">Todavía no hay artistas cargados.</p>
            )}
          </div>
        </div>

        {artistaId && (
          <div>
            <label className="block text-sm font-semibold mb-3">2. Horario disponible</label>
            {loadingSlots ? (
              <p className="text-sm text-ink-soft">Cargando horarios…</p>
            ) : Object.keys(slotsByDay).length === 0 ? (
              <p className="text-sm text-ink-soft">No hay horarios libres en las próximas semanas.</p>
            ) : (
              <div className="space-y-5 max-h-80 overflow-y-auto pr-1">
                {Object.entries(slotsByDay).map(([day, daySlots]) => (
                  <div key={day}>
                    <p className="text-xs uppercase tracking-wider text-ink-soft mb-2 capitalize">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((iso) => {
                        const t = new Date(iso).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => setFechaHora(iso)}
                            className={`px-3 py-1.5 text-sm rounded-lg border ${
                              fechaHora === iso
                                ? 'border-primary-400 text-primary-400'
                                : 'border-surface-border text-ink hover:border-ink/40'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-3">3. Tus datos</label>
          </div>
          <input
            className="input-field"
            placeholder="Nombre"
            required
            value={form.nombreCliente}
            onChange={(e) => setForm({ ...form, nombreCliente: e.target.value })}
          />
          <input
            className="input-field"
            placeholder="Teléfono"
            required
            value={form.telefonoCliente}
            onChange={(e) => setForm({ ...form, telefonoCliente: e.target.value })}
          />
          <input
            className="input-field sm:col-span-2"
            type="email"
            placeholder="Email"
            required
            value={form.emailCliente}
            onChange={(e) => setForm({ ...form, emailCliente: e.target.value })}
          />
          <textarea
            className="input-field sm:col-span-2"
            rows={3}
            placeholder="Notas (idea, tamaño, zona…)"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3">4. Pago de seña</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMetodoPago('whatsapp')}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                metodoPago === 'whatsapp' ? 'border-primary-400 bg-primary-400/10' : 'border-surface-border'
              }`}
            >
              <FaWhatsapp className="text-[#25D366]" size={22} />
              <div className="text-left">
                <p className="font-semibold text-sm">WhatsApp</p>
                <p className="text-xs text-ink-soft">Coordinás la seña con el estudio</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('mercadopago')}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                metodoPago === 'mercadopago' ? 'border-primary-400 bg-primary-400/10' : 'border-surface-border'
              }`}
            >
              <FaCreditCard className="text-sky-400" size={20} />
              <div className="text-left">
                <p className="font-semibold text-sm">Mercado Pago</p>
                <p className="text-xs text-ink-soft">Pagás la seña online</p>
              </div>
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full sm:w-auto">
          {isLoading ? 'Enviando…' : `Solicitar turno · ${formatCurrency(settings?.montoSenia ?? 0)}`}
        </button>
      </form>
    </div>
  );
};

export default Turnos;
