import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetAllAppointmentsQuery,
  useConfirmAppointmentMutation,
  useReleaseAppointmentMutation,
  useGetArtistsQuery,
} from '../../services/studioApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const AppointmentsAdmin = () => {
  const [estado, setEstado] = useState('');
  const [artista, setArtista] = useState('');
  const { data, isLoading } = useGetAllAppointmentsQuery({
    ...(estado ? { estado } : {}),
    ...(artista ? { artista } : {}),
  });
  const { data: artists = [] } = useGetArtistsQuery({ all: 'true' });
  const [confirmAppt] = useConfirmAppointmentMutation();
  const [releaseAppt] = useReleaseAppointmentMutation();

  const list = data?.appointments || [];

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Solicitudes de turnos</h1>
          <p className="text-sm text-ink-soft mt-1">
            Pedidos de clientes. Para armar horarios disponibles usá{' '}
            <a href="/admin/agenda" className="text-primary-400 underline">
              Agenda
            </a>
            .
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input-field w-auto" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {['solicitado', 'confirmado', 'cancelado', 'completado', 'liberado'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={artista} onChange={(e) => setArtista(e.target.value)}>
          <option value="">Todos los artistas</option>
          {artists.map((a) => <option key={a._id} value={a._id}>{a.nombre}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-ink-soft">Cargando…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Artista</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Seña</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a._id} className="border-b border-surface-border/60">
                  <td className="px-4 py-3 font-mono text-xs">{a.codigo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.nombreCliente}</p>
                    <p className="text-xs text-ink-soft">{a.telefonoCliente}</p>
                  </td>
                  <td className="px-4 py-3">{a.artista?.nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(a.fechaHora).toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(a.montoSenia)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{a.metodoPago}</span>
                    <br />
                    <span className="text-xs text-ink-soft">{a.estadoPago}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-white/5 text-ink-soft">{a.estado}</span>
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {a.estado === 'solicitado' && (
                      <button
                        className="text-xs text-emerald-400 hover:underline"
                        onClick={async () => {
                          await confirmAppt(a._id);
                          toast.success('Turno confirmado');
                        }}
                      >
                        Confirmar
                      </button>
                    )}
                    {['solicitado', 'confirmado'].includes(a.estado) && (
                      <button
                        className="text-xs text-amber-400 hover:underline"
                        onClick={async () => {
                          if (!confirm('¿Liberar este horario?')) return;
                          await releaseAppt(a._id);
                          toast.success('Horario liberado');
                        }}
                      >
                        Liberar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-soft">Sin turnos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AppointmentsAdmin;
