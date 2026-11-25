import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetArtistsQuery,
  useCreateArtistMutation,
  useUpdateArtistMutation,
  useDeleteArtistMutation,
} from '../../services/studioApi';
import { useUploadImageMutation } from '../../services/cartApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiOutlineCalendar } from 'react-icons/hi';

const empty = {
  nombre: '',
  bio: '',
  especialidades: '',
  instagram: '',
  foto: { url: '', publicId: '' },
  isActive: true,
  orden: 0,
};

const ArtistsAdmin = () => {
  const { data: artists = [], isLoading } = useGetArtistsQuery({ all: 'true' });
  const [createArtist] = useCreateArtistMutation();
  const [updateArtist] = useUpdateArtistMutation();
  const [deleteArtist] = useDeleteArtistMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [show, setShow] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm(empty);
    setShow(true);
  };

  const openEdit = (a) => {
    setEditingId(a._id);
    setForm({
      nombre: a.nombre,
      bio: a.bio || '',
      especialidades: (a.especialidades || []).join(', '),
      instagram: a.instagram || '',
      foto: a.foto || { url: '', publicId: '' },
      isActive: a.isActive !== false,
      orden: a.orden || 0,
    });
    setShow(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const body = {
      nombre: form.nombre,
      bio: form.bio,
      instagram: form.instagram,
      foto: form.foto,
      isActive: form.isActive,
      orden: Number(form.orden) || 0,
      especialidades: form.especialidades
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) {
        await updateArtist({ id: editingId, ...body }).unwrap();
        toast.success('Artista actualizado');
      } else {
        await createArtist({
          ...body,
          weeklyAvailability: [
            { dayOfWeek: 1, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
            { dayOfWeek: 2, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
            { dayOfWeek: 3, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
            { dayOfWeek: 4, startTime: '11:00', endTime: '19:00', slotMinutes: 60 },
            { dayOfWeek: 5, startTime: '11:00', endTime: '18:00', slotMinutes: 60 },
          ],
        }).unwrap();
        toast.success('Artista creado. Configurá su agenda en Agenda.');
      }
      setShow(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar');
    }
  };

  const onPhoto = async (file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url, publicId } = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, foto: { url, publicId } }));
      toast.success('Foto subida');
    } catch {
      toast.error('Error al subir foto');
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Artistas</h1>
          <p className="text-sm text-ink-soft mt-1">
            Perfil del artista. Los horarios se gestionan en{' '}
            <Link to="/admin/agenda" className="text-primary-400 underline">
              Agenda
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/agenda" className="btn-secondary text-sm flex items-center gap-2">
            <HiOutlineCalendar /> Agenda
          </Link>
          <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
            <HiOutlinePlus /> Nuevo artista
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-ink-soft">Cargando…</p>
      ) : (
        <div className="grid gap-3">
          {artists.map((a) => (
            <div key={a._id} className="card p-4 flex items-center gap-4">
              {a.foto?.url ? (
                <img src={a.foto.url} alt="" className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-pearl-dark" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{a.nombre}</p>
                <p className="text-xs text-ink-soft truncate">
                  {(a.especialidades || []).join(' · ') || 'Sin especialidades'}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {a.weeklyAvailability?.length || 0} franjas semanales ·{' '}
                  {a.extraSlots?.length || 0} extras · {a.blockedDays?.length || 0} días bloqueados
                </p>
              </div>
              <Link
                to="/admin/agenda"
                className="text-xs text-primary-400 hover:underline hidden sm:inline"
              >
                Editar agenda
              </Link>
              <button onClick={() => openEdit(a)} className="icon-btn" aria-label="Editar">
                <HiOutlinePencil size={18} />
              </button>
              <button
                onClick={async () => {
                  if (!confirm('¿Desactivar artista?')) return;
                  await deleteArtist(a._id);
                  toast.success('Desactivado');
                }}
                className="icon-btn text-red-400"
                aria-label="Desactivar"
              >
                <HiOutlineTrash size={18} />
              </button>
            </div>
          ))}
          {artists.length === 0 && <p className="text-ink-soft">No hay artistas. Creá el primero.</p>}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4">
          <form
            onSubmit={save}
            className="bg-surface border border-surface-border rounded-xl p-6 w-full max-w-md my-8 space-y-4"
          >
            <h2 className="font-display text-xl font-bold">
              {editingId ? 'Editar' : 'Nuevo'} artista
            </h2>
            <input
              className="input-field"
              placeholder="Nombre"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <textarea
              className="input-field"
              rows={2}
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Especialidades (separadas por coma)"
              value={form.especialidades}
              onChange={(e) => setForm({ ...form, especialidades: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Instagram"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium mb-1 block">Foto</label>
              <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {form.foto?.url && (
                <img src={form.foto.url} alt="" className="mt-2 w-20 h-20 object-cover rounded-lg" />
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary">
                Guardar
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default ArtistsAdmin;
