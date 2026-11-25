import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../services/studioApi';
import toast from 'react-hot-toast';

const SettingsAdmin = () => {
  const { data } = useGetSettingsQuery();
  const [updateSettings, { isLoading }] = useUpdateSettingsMutation();
  const [form, setForm] = useState({
    montoSenia: 10000,
    mensajeTurnoWhatsApp: '',
    whatsappNumero: '',
    instagram: '',
    direccion: '',
    nombreEstudio: 'MDFK Tattoo',
  });

  useEffect(() => {
    if (data) {
      setForm({
        montoSenia: data.montoSenia ?? 10000,
        mensajeTurnoWhatsApp: data.mensajeTurnoWhatsApp || '',
        whatsappNumero: data.whatsappNumero || '',
        instagram: data.instagram || '',
        direccion: data.direccion || '',
        nombreEstudio: data.nombreEstudio || 'MDFK Tattoo',
      });
    }
  }, [data]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        ...form,
        montoSenia: Number(form.montoSenia),
      }).unwrap();
      toast.success('Configuración guardada');
    } catch {
      toast.error('No se pudo guardar');
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Configuración del estudio</h1>
      <form onSubmit={save} className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Monto de seña (ARS)</label>
          <input
            type="number"
            min={0}
            className="input-field"
            value={form.montoSenia}
            onChange={(e) => setForm({ ...form, montoSenia: e.target.value })}
          />
          <p className="text-xs text-ink-soft mt-1">Podés cambiarlo cuando quieras; aplica a turnos nuevos.</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">WhatsApp (con código país)</label>
          <input className="input-field" value={form.whatsappNumero} onChange={(e) => setForm({ ...form, whatsappNumero: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Instagram URL</label>
          <input className="input-field" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Dirección</label>
          <input className="input-field" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="La cargás cuando la tengas" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Mensaje WhatsApp de turno</label>
          <textarea
            className="input-field font-mono text-xs"
            rows={6}
            value={form.mensajeTurnoWhatsApp}
            onChange={(e) => setForm({ ...form, mensajeTurnoWhatsApp: e.target.value })}
          />
          <p className="text-xs text-ink-soft mt-1">
            Variables: {'{{codigo}} {{artista}} {{fecha}} {{senia}} {{nombre}} {{telefono}}'}
          </p>
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </AdminLayout>
  );
};

export default SettingsAdmin;
