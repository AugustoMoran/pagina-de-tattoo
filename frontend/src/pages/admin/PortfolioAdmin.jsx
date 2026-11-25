import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetAdminPortfolioQuery,
  useCreatePortfolioItemMutation,
  useUpdatePortfolioItemMutation,
  useDeletePortfolioItemMutation,
  useGetArtistsQuery,
} from '../../services/studioApi';
import { useUploadImageMutation } from '../../services/cartApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';

const empty = {
  titulo: '',
  descripcion: '',
  estilo: '',
  artista: '',
  destacado: false,
  orden: 0,
  imagen: { url: '', publicId: '' },
  isActive: true,
};

const PortfolioAdmin = () => {
  const { data: items = [] } = useGetAdminPortfolioQuery();
  const { data: artists = [] } = useGetArtistsQuery({ all: 'true' });
  const [createItem] = useCreatePortfolioItemMutation();
  const [updateItem] = useUpdatePortfolioItemMutation();
  const [deleteItem] = useDeletePortfolioItemMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [show, setShow] = useState(false);

  const openNew = () => { setEditingId(null); setForm(empty); setShow(true); };
  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      estilo: item.estilo || '',
      artista: item.artista?._id || item.artista || '',
      destacado: !!item.destacado,
      orden: item.orden || 0,
      imagen: item.imagen || { url: '', publicId: '' },
      isActive: item.isActive !== false,
    });
    setShow(true);
  };

  const onPhoto = async (file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url, publicId } = await uploadImage(fd).unwrap();
      setForm((f) => ({ ...f, imagen: { url, publicId } }));
      toast.success('Imagen subida');
    } catch {
      toast.error('Error al subir');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.imagen?.url) {
      toast.error('Subí una imagen');
      return;
    }
    const body = {
      ...form,
      artista: form.artista || null,
      orden: Number(form.orden) || 0,
    };
    try {
      if (editingId) {
        await updateItem({ id: editingId, ...body }).unwrap();
        toast.success('Actualizado');
      } else {
        await createItem(body).unwrap();
        toast.success('Creado');
      }
      setShow(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Portfolio</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePlus /> Nuevo trabajo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item._id} className="card relative group">
            <img src={item.imagen?.url} alt="" className="aspect-[3/4] w-full object-cover" />
            <div className="p-2">
              <p className="text-sm font-medium truncate">{item.titulo || 'Sin título'}</p>
              <p className="text-xs text-ink-soft">{item.estilo}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(item)} className="p-1.5 rounded bg-black/70 text-white"><HiOutlinePencil size={14} /></button>
              <button
                onClick={async () => {
                  if (!confirm('¿Eliminar?')) return;
                  await deleteItem(item._id);
                  toast.success('Eliminado');
                }}
                className="p-1.5 rounded bg-red-600/90 text-white"
              >
                <HiOutlineTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-surface border border-surface-border rounded-xl p-6 w-full max-w-md space-y-3">
            <h2 className="font-display text-xl font-bold">{editingId ? 'Editar' : 'Nuevo'} trabajo</h2>
            <input className="input-field" placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <input className="input-field" placeholder="Estilo (blackwork, fine line…)" value={form.estilo} onChange={(e) => setForm({ ...form, estilo: e.target.value })} />
            <select className="input-field" value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })}>
              <option value="">Sin artista</option>
              {artists.map((a) => <option key={a._id} value={a._id}>{a.nombre}</option>)}
            </select>
            <textarea className="input-field" rows={2} placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <input type="number" className="input-field" placeholder="Orden" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.destacado} onChange={(e) => setForm({ ...form, destacado: e.target.checked })} />
              Destacado en home
            </label>
            <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
            {form.imagen?.url && <img src={form.imagen.url} alt="" className="w-full max-h-48 object-cover rounded-lg" />}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={() => setShow(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default PortfolioAdmin;
