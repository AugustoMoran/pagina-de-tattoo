import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useAddProductImageMutation,
  useRemoveProductImageMutation,
  useAddProductVideoMutation,
  useRemoveProductVideoMutation,
  useGetProductSuggestionsQuery,
} from '../../services/productsApi';
import { useUploadImageMutation } from '../../services/cartApi';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineFilm,
} from 'react-icons/hi';

const MAX_IMAGES = 7;
const TALLAS_ROPA = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const TALLAS_NUM = ['1', '2', '3', '4', '5', '6', '7', '8'];
const MEDIDAS_MM = ['1.2', '1.6', '2', '2.5', '3', '4', '5', '6', '8', '10', '12', '14', '16'];

const EMPTY = {
  nombre: '',
  descripcion: '',
  precio: '',
  precioOferta: '',
  stock: '',
  categoria: '',
  tags: '',
  atributos: { usaTallas: false, usaColores: false, usaMedidas: false },
  tallas: { habilitadas: [], rango: '' },
  medidas: { habilitadas: [], unidad: 'mm', etiqueta: 'Medida' },
  colores: [],
};

const inferAtributos = (p) => {
  if (p.atributos && (p.atributos.usaTallas || p.atributos.usaColores || p.atributos.usaMedidas)) {
    return {
      usaTallas: !!p.atributos.usaTallas,
      usaColores: !!p.atributos.usaColores,
      usaMedidas: !!p.atributos.usaMedidas,
    };
  }
  return {
    usaTallas: (p.tallas?.habilitadas || []).length > 0,
    usaColores: (p.colores || []).length > 0,
    usaMedidas: (p.medidas?.habilitadas || []).length > 0,
  };
};

const normalizeForm = (formData) => ({
  nombre: String(formData.nombre || ''),
  descripcion: String(formData.descripcion || ''),
  precio: String(formData.precio ?? ''),
  precioOferta: String(formData.precioOferta ?? ''),
  stock: String(formData.stock ?? ''),
  categoria: String(formData.categoria || ''),
  tags: String(formData.tags || ''),
  atributos: formData.atributos || { usaTallas: false, usaColores: false, usaMedidas: false },
  tallas: formData.tallas || { habilitadas: [], rango: '' },
  medidas: formData.medidas || { habilitadas: [], unidad: 'mm', etiqueta: 'Medida' },
  colores: (formData.colores || []).map((c) => ({
    ...c,
    imagen: c.imagen || { url: '', publicId: '' },
  })),
});

const AttrToggle = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-3 p-3 rounded-lg border border-surface-border bg-pearl/40 cursor-pointer hover:border-primary-400/40 transition-colors">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 accent-primary-400"
    />
    <span>
      <span className="block text-sm font-medium text-ink">{label}</span>
      {hint && <span className="block text-xs text-ink-soft mt-0.5">{hint}</span>}
    </span>
  </label>
);

const ProductsAdmin = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const sinStock = searchParams.get('sinStock') === '1';

  const { data, isLoading } = useGetProductsQuery({
    page,
    limit: 12,
    search: search || undefined,
    categoria: filterCat || undefined,
    sinStock: sinStock || undefined,
  });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);

  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addImage] = useAddProductImageMutation();
  const [removeImage] = useRemoveProductImageMutation();
  const [addVideo] = useAddProductVideoMutation();
  const [removeVideo] = useRemoveProductVideoMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState([]);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [tallaPreset, setTallaPreset] = useState('ropa');
  const [customTalla, setCustomTalla] = useState('');
  const [customMedida, setCustomMedida] = useState('');
  const [nuevoColor, setNuevoColor] = useState({
    nombre: '',
    codigo: '#C45C26',
    habilitado: true,
    imagen: { url: '', publicId: '' },
  });
  const [uploadingColorImg, setUploadingColorImg] = useState(null);

  const existingImages = editingProduct?.imagenes || [];
  const existingVideos = editingProduct?.videos || [];
  const totalImages = existingImages.length + newImagePreviews.length;
  const totalVideos = existingVideos.length + newVideoPreviews.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetMedia = () => {
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setNewVideoFiles([]);
    setNewVideoPreviews([]);
  };

  const openNew = () => {
    setShowForm(true);
    setEditing(null);
    setEditingProduct(null);
    setForm(EMPTY);
    resetMedia();
    setNuevoColor({ nombre: '', codigo: '#C45C26', habilitado: true, imagen: { url: '', publicId: '' } });
    setCustomTalla('');
    setCustomMedida('');
    setTallaPreset('ropa');
  };

  const setAttr = (key, value) => {
    setForm((prev) => ({
      ...prev,
      atributos: { ...prev.atributos, [key]: value },
    }));
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - totalImages;
    const toAdd = files.slice(0, remaining);
    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVideos = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - totalVideos;
    const toAdd = files.slice(0, remaining);
    setNewVideoFiles((prev) => [...prev, ...toAdd]);
    setNewVideoPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
    e.target.value = '';
  };

  const removeNewVideo = (index) => {
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTalla = (talla) => {
    setForm((prev) => {
      const habilitadas = prev.tallas.habilitadas.includes(talla)
        ? prev.tallas.habilitadas.filter((t) => t !== talla)
        : [...prev.tallas.habilitadas, talla];
      return { ...prev, tallas: { ...prev.tallas, habilitadas } };
    });
  };

  const addCustomTalla = () => {
    const t = customTalla.trim().toUpperCase();
    if (!t) return;
    if (form.tallas.habilitadas.includes(t)) {
      toast.error('Esa talla ya está agregada');
      return;
    }
    setForm((prev) => ({
      ...prev,
      tallas: { ...prev.tallas, habilitadas: [...prev.tallas.habilitadas, t] },
    }));
    setCustomTalla('');
  };

  const toggleMedida = (m) => {
    setForm((prev) => {
      const habilitadas = prev.medidas.habilitadas.includes(m)
        ? prev.medidas.habilitadas.filter((x) => x !== m)
        : [...prev.medidas.habilitadas, m];
      return { ...prev, medidas: { ...prev.medidas, habilitadas } };
    });
  };

  const addCustomMedida = () => {
    const m = customMedida.trim().replace(',', '.');
    if (!m) return;
    if (form.medidas.habilitadas.includes(m)) {
      toast.error('Esa medida ya está agregada');
      return;
    }
    setForm((prev) => ({
      ...prev,
      medidas: { ...prev.medidas, habilitadas: [...prev.medidas.habilitadas, m] },
    }));
    setCustomMedida('');
  };

  const agregarColor = () => {
    if (!nuevoColor.nombre.trim()) {
      toast.error('El color debe tener un nombre');
      return;
    }
    if (form.colores.length >= 8) {
      toast.error('Máximo 8 colores por producto');
      return;
    }
    setForm((prev) => ({
      ...prev,
      colores: [
        ...prev.colores,
        {
          nombre: nuevoColor.nombre.trim(),
          codigo: nuevoColor.codigo || '#000000',
          habilitado: true,
          imagen: nuevoColor.imagen || { url: '', publicId: '' },
        },
      ],
    }));
    setNuevoColor({ nombre: '', codigo: '#C45C26', habilitado: true, imagen: { url: '', publicId: '' } });
  };

  const uploadColorImage = async (target, file) => {
    if (!file) return;
    setUploadingColorImg(target);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url, publicId } = await uploadImage(fd).unwrap();
      if (target === 'nuevo') {
        setNuevoColor((prev) => ({ ...prev, imagen: { url, publicId } }));
      } else {
        setForm((prev) => {
          const colores = [...prev.colores];
          colores[target] = { ...colores[target], imagen: { url, publicId } };
          return { ...prev, colores };
        });
      }
      toast.success('Imagen de color cargada');
    } catch {
      toast.error('Error al subir imagen del color');
    } finally {
      setUploadingColorImg(null);
    }
  };

  const clearColorImage = (index) => {
    setForm((prev) => {
      const colores = [...prev.colores];
      colores[index] = { ...colores[index], imagen: { url: '', publicId: '' } };
      return { ...prev, colores };
    });
  };

  const removerColor = (index) => {
    setForm((prev) => ({
      ...prev,
      colores: prev.colores.filter((_, i) => i !== index),
    }));
  };

  const toggleColorHabilitado = (index) => {
    setForm((prev) => {
      const colores = [...prev.colores];
      colores[index] = { ...colores[index], habilitado: !colores[index].habilitado };
      return { ...prev, colores };
    });
  };

  const handleRemoveExistingImage = async (publicId) => {
    if (!editingProduct) return;
    try {
      await removeImage({ id: editingProduct._id, publicId }).unwrap();
      setEditingProduct((prev) => ({
        ...prev,
        imagenes: prev.imagenes.filter((img) => img.publicId !== publicId),
      }));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleRemoveExistingVideo = async (publicId) => {
    if (!editingProduct) return;
    try {
      await removeVideo({ id: editingProduct._id, publicId }).unwrap();
      setEditingProduct((prev) => ({
        ...prev,
        videos: prev.videos.filter((vid) => vid.publicId !== publicId),
      }));
      toast.success('Video eliminado');
    } catch {
      toast.error('Error al eliminar video');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!form.nombre.trim() || !form.precio) {
        toast.error('Nombre y Precio son requeridos');
        setUploading(false);
        return;
      }

      const { usaTallas, usaColores, usaMedidas } = form.atributos;

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        precio: Number(form.precio),
        precioOferta: form.precioOferta ? Number(form.precioOferta) : undefined,
        stock: Number(form.stock) || 0,
        categoria: form.categoria || undefined,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        atributos: { usaTallas, usaColores, usaMedidas },
        tallas: usaTallas ? form.tallas : { habilitadas: [], rango: '' },
        medidas: usaMedidas
          ? form.medidas
          : { habilitadas: [], unidad: form.medidas.unidad || 'mm', etiqueta: form.medidas.etiqueta || 'Medida' },
        colores: usaColores ? form.colores : [],
      };

      let productId = editing;
      if (editing) {
        await updateProduct({ id: editing, ...payload }).unwrap();
        toast.success('Producto actualizado');
      } else {
        const created = await createProduct(payload).unwrap();
        productId = created._id;
        toast.success('Producto creado');
      }

      for (const file of newImageFiles) {
        const fd = new FormData();
        fd.append('image', file);
        const { url, publicId } = await uploadImage(fd).unwrap();
        await addImage({ id: productId, url, publicId }).unwrap();
      }

      for (const file of newVideoFiles) {
        const fd = new FormData();
        fd.append('image', file);
        const { url, publicId } = await uploadImage(fd).unwrap();
        await addVideo({ id: productId, url, publicId }).unwrap();
      }

      setForm(EMPTY);
      setEditing(null);
      setEditingProduct(null);
      setShowForm(false);
      resetMedia();
      setNuevoColor({ nombre: '', codigo: '#C45C26', habilitado: true, imagen: { url: '', publicId: '' } });
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (p) => {
    setForm(
      normalizeForm({
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        precioOferta: p.precioOferta ?? '',
        stock: p.stock,
        categoria: p.categoria?._id || p.categoria || '',
        tags: p.tags?.join(', ') || '',
        atributos: inferAtributos(p),
        tallas: p.tallas || { habilitadas: [], rango: '' },
        medidas: p.medidas || { habilitadas: [], unidad: 'mm', etiqueta: 'Medida' },
        colores: p.colores || [],
      })
    );
    setEditing(p._id);
    setEditingProduct(p);
    setShowForm(true);
    resetMedia();
    setNuevoColor({ nombre: '', codigo: '#C45C26', habilitado: true, imagen: { url: '', publicId: '' } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Eliminado');
    } catch {
      toast.error('Error');
    }
  };

  const handleRestock = async (p) => {
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) {
      toast.error('Ingresá una cantidad válida');
      return;
    }
    try {
      await updateProduct({ id: p._id, stock: qty }).unwrap();
      toast.success(`Stock actualizado a ${qty}`);
      setRestockId(null);
      setRestockQty('');
    } catch {
      toast.error('Error al actualizar stock');
    }
  };

  const handleSuggestionClick = async (suggestionProduct) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${suggestionProduct._id}`);
      const fullProduct = await response.json();
      handleEdit(fullProduct);
      setSearch('');
      setShowSuggestions(false);
      toast.success(`Editando: ${fullProduct.nombre}`);
    } catch {
      toast.error('Error al cargar producto');
    }
  };

  const tallaOptions = tallaPreset === 'ropa' ? TALLAS_ROPA : tallaPreset === 'num' ? TALLAS_NUM : [];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">Insumos / Productos</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]" ref={suggestionsRef}>
          <HiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="input-field pl-9"
          />

          {showSuggestions && search.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-surface-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-surface-border last:border-b-0 text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-pearl">
                    {product.imagenes?.[0]?.url ? (
                      <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-soft">
                        <HiOutlineSearch size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{product.nombre}</p>
                    <p className="text-xs text-ink-soft">
                      $
                      {(product.precioOferta || product.precio).toLocaleString('es-AR')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && search.trim().length > 0 && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-surface-border rounded-lg shadow-xl z-50 p-4 text-center text-sm text-ink-soft">
              No se encontraron productos
            </div>
          )}
        </div>
        <select
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
          className="input-field w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {(search || filterCat) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilterCat('');
              setPage(1);
            }}
            className="btn-secondary text-sm"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="icon-btn">
              <HiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input-field"
                required
                placeholder="ej: Remera MDFK, Arito hoop, Bajo Jazz Bass"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Precio *</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.precio}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || !isNaN(v)) setForm({ ...form, precio: v });
                }}
                className="input-field"
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Precio oferta</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.precioOferta}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || !isNaN(v)) setForm({ ...form, precioOferta: v });
                }}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Stock</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d+$/.test(v)) setForm({ ...form, stock: v });
                }}
                className="input-field"
                required
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="input-field"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Tags (separados por coma)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="input-field"
                placeholder="merch, piercing, instrumentos"
              />
            </div>

            {/* Attribute toggles */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <p className="text-sm font-medium text-ink mb-1">Variantes del producto</p>
                <p className="text-xs text-ink-soft mb-3">
                  Activá solo lo que aplique. Remera → talles + colores. Arito → medidas (mm) + colores. Bajo → nada o solo color.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <AttrToggle
                  checked={form.atributos.usaTallas}
                  onChange={(v) => setAttr('usaTallas', v)}
                  label="Talles / tallas"
                  hint="Ropa, calzado, etc."
                />
                <AttrToggle
                  checked={form.atributos.usaMedidas}
                  onChange={(v) => setAttr('usaMedidas', v)}
                  label="Medidas (mm)"
                  hint="Aritos, piercing, gauges"
                />
                <AttrToggle
                  checked={form.atributos.usaColores}
                  onChange={(v) => setAttr('usaColores', v)}
                  label="Colores"
                  hint="Con foto opcional por color"
                />
              </div>
            </div>

            {/* Tallas */}
            {form.atributos.usaTallas && (
              <div className="md:col-span-2 p-4 rounded-xl border border-surface-border bg-pearl/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">Talles habilitados</p>
                  <div className="flex gap-1">
                    {[
                      { id: 'ropa', label: 'Ropa' },
                      { id: 'num', label: 'Numérico' },
                      { id: 'custom', label: 'Solo custom' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTallaPreset(p.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          tallaPreset === p.id
                            ? 'border-primary-400 bg-primary-400/15 text-primary-400'
                            : 'border-surface-border text-ink-soft hover:border-ink/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {tallaOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tallaOptions.map((talla) => (
                      <button
                        key={talla}
                        type="button"
                        onClick={() => toggleTalla(talla)}
                        className={`min-w-[2.75rem] px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.tallas.habilitadas.includes(talla)
                            ? 'border-primary-400 bg-primary-400/20 text-primary-400'
                            : 'border-surface-border bg-surface text-ink-soft hover:border-ink/40'
                        }`}
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTalla}
                    onChange={(e) => setCustomTalla(e.target.value)}
                    className="input-field text-sm flex-1"
                    placeholder="Talle custom (ej: XXXL, 42)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTalla();
                      }
                    }}
                  />
                  <button type="button" onClick={addCustomTalla} className="btn-secondary text-sm whitespace-nowrap">
                    Agregar
                  </button>
                </div>

                {form.tallas.habilitadas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tallas.habilitadas.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-400/15 text-primary-400 text-xs font-medium"
                      >
                        {t}
                        <button type="button" onClick={() => toggleTalla(t)} className="hover:text-ink">
                          <HiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-ink-soft mb-1">Rango / nota (opcional)</label>
                  <input
                    type="text"
                    value={form.tallas.rango}
                    onChange={(e) => setForm({ ...form, tallas: { ...form.tallas, rango: e.target.value } })}
                    className="input-field text-sm"
                    placeholder="ej: XS–XXL unisex"
                  />
                </div>
              </div>
            )}

            {/* Medidas mm */}
            {form.atributos.usaMedidas && (
              <div className="md:col-span-2 p-4 rounded-xl border border-surface-border bg-pearl/30 space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs text-ink-soft mb-1">Etiqueta</label>
                    <input
                      type="text"
                      value={form.medidas.etiqueta}
                      onChange={(e) =>
                        setForm({ ...form, medidas: { ...form.medidas, etiqueta: e.target.value } })
                      }
                      className="input-field text-sm"
                      placeholder="Medida / Diámetro / Gauge"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-ink-soft mb-1">Unidad</label>
                    <input
                      type="text"
                      value={form.medidas.unidad}
                      onChange={(e) =>
                        setForm({ ...form, medidas: { ...form.medidas, unidad: e.target.value } })
                      }
                      className="input-field text-sm"
                      placeholder="mm"
                    />
                  </div>
                </div>

                <p className="text-sm font-semibold text-ink">
                  Medidas en {form.medidas.unidad || 'mm'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {MEDIDAS_MM.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMedida(m)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.medidas.habilitadas.includes(m)
                          ? 'border-primary-400 bg-primary-400/20 text-primary-400'
                          : 'border-surface-border bg-surface text-ink-soft hover:border-ink/40'
                      }`}
                    >
                      {m}
                      {form.medidas.unidad || 'mm'}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMedida}
                    onChange={(e) => setCustomMedida(e.target.value)}
                    className="input-field text-sm flex-1"
                    placeholder="Medida custom (ej: 18)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomMedida();
                      }
                    }}
                  />
                  <button type="button" onClick={addCustomMedida} className="btn-secondary text-sm whitespace-nowrap">
                    Agregar
                  </button>
                </div>

                {form.medidas.habilitadas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.medidas.habilitadas.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary-400/15 text-primary-400 text-xs font-medium"
                      >
                        {m}
                        {form.medidas.unidad || 'mm'}
                        <button type="button" onClick={() => toggleMedida(m)} className="hover:text-ink">
                          <HiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Colores + imagen por color */}
            {form.atributos.usaColores && (
              <div className="md:col-span-2 p-4 rounded-xl border border-surface-border bg-pearl/30 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Colores ({form.colores.length}/8)
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Podés asignar una foto distinta a cada color; en la tienda se muestra al elegirlo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-lg border border-surface-border bg-surface">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Nombre</label>
                    <input
                      type="text"
                      value={nuevoColor.nombre}
                      onChange={(e) => setNuevoColor({ ...nuevoColor, nombre: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Negro, Dorado…"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Código</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={nuevoColor.codigo}
                        onChange={(e) => setNuevoColor({ ...nuevoColor, codigo: e.target.value })}
                        className="w-11 h-10 rounded border border-surface-border bg-surface cursor-pointer"
                      />
                      <input
                        type="text"
                        value={nuevoColor.codigo}
                        onChange={(e) => setNuevoColor({ ...nuevoColor, codigo: e.target.value })}
                        className="input-field text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Foto del color</label>
                    <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-dashed border-surface-border cursor-pointer hover:border-primary-400 transition-colors text-xs text-ink-soft">
                      {uploadingColorImg === 'nuevo' ? (
                        'Subiendo…'
                      ) : nuevoColor.imagen?.url ? (
                        <>
                          <img src={nuevoColor.imagen.url} alt="" className="w-7 h-7 rounded object-cover" />
                          Cambiar
                        </>
                      ) : (
                        <>
                          <HiOutlinePhotograph size={16} /> Subir imagen
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadColorImage('nuevo', e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={agregarColor}
                      disabled={form.colores.length >= 8}
                      className="w-full btn-primary text-sm"
                    >
                      + Agregar color
                    </button>
                  </div>
                </div>

                {form.colores.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {form.colores.map((color, i) => (
                      <div
                        key={`${color.nombre}-${i}`}
                        className="flex gap-3 p-3 rounded-lg border border-surface-border bg-surface"
                      >
                        <div className="relative flex-shrink-0">
                          {color.imagen?.url ? (
                            <img
                              src={color.imagen.url}
                              alt={color.nombre}
                              className="w-16 h-16 rounded-lg object-cover border border-surface-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg border border-dashed border-surface-border flex items-center justify-center bg-pearl">
                              <HiOutlinePhotograph size={20} className="text-ink-soft" />
                            </div>
                          )}
                          <div
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface"
                            style={{ backgroundColor: color.codigo }}
                            title={color.codigo}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-sm font-medium text-ink truncate">{color.nombre}</p>
                          <div className="flex flex-wrap gap-2">
                            <label className="text-xs text-primary-400 cursor-pointer hover:underline">
                              {uploadingColorImg === i ? 'Subiendo…' : color.imagen?.url ? 'Cambiar foto' : 'Subir foto'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => uploadColorImage(i, e.target.files?.[0])}
                              />
                            </label>
                            {color.imagen?.url && (
                              <button
                                type="button"
                                onClick={() => clearColorImage(i)}
                                className="text-xs text-ink-soft hover:text-red-400"
                              >
                                Quitar foto
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={color.habilitado}
                                onChange={() => toggleColorHabilitado(i)}
                                className="w-3.5 h-3.5 accent-primary-400"
                              />
                              <span className="text-xs text-ink-soft">Activo</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removerColor(i)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400"
                            >
                              <HiX size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gallery */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-2">
                Imágenes generales{' '}
                <span className="text-ink-soft font-normal">
                  ({totalImages}/{MAX_IMAGES})
                </span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {existingImages.map((img) => (
                  <div key={img.publicId} className="relative aspect-square">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border border-surface-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.publicId)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover rounded-lg border border-surface-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {totalImages < MAX_IMAGES && (
                  <label className="aspect-square border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePlus size={18} className="text-ink-soft" />
                    <span className="text-xs text-ink-soft mt-1">Agregar</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handleAddImages} />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-2">
                Vídeos <span className="text-ink-soft font-normal">({totalVideos}/3)</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {existingVideos.map((vid) => (
                  <div key={vid.publicId} className="relative aspect-square">
                    <video src={vid.url} className="w-full h-full object-cover rounded-lg border border-surface-border bg-black" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <HiOutlineFilm size={24} className="text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingVideo(vid.publicId)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {newVideoPreviews.map((vidData, i) => (
                  <div key={i} className="relative aspect-square">
                    <video
                      src={vidData.url}
                      className="w-full h-full object-cover rounded-lg border border-surface-border bg-black"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <HiOutlineFilm size={24} className="text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewVideo(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {totalVideos < 3 && (
                  <label className="aspect-square border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePlus size={18} className="text-ink-soft" />
                    <span className="text-xs text-ink-soft mt-1">Agregar</span>
                    <input type="file" accept="video/*" multiple className="sr-only" onChange={handleAddVideos} />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-ink-soft">
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Variantes</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-4 bg-pearl rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : (
              (data?.products || []).map((p) => {
                const attrs = inferAtributos(p);
                const chips = [
                  attrs.usaTallas && 'Talles',
                  attrs.usaMedidas && 'mm',
                  attrs.usaColores && 'Colores',
                ].filter(Boolean);
                return (
                  <tr key={p._id} className="border-b border-surface-border last:border-0 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-pearl flex-shrink-0">
                          {p.imagenes?.[0]?.url ? (
                            <img src={p.imagenes[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlinePhotograph size={14} className="text-ink-soft" />
                            </div>
                          )}
                        </div>
                        {p.imagenes?.length > 1 && (
                          <span className="text-xs text-ink-soft">+{p.imagenes.length - 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{p.nombre}</td>
                    <td className="px-4 py-3">
                      {chips.length ? (
                        <div className="flex flex-wrap gap-1">
                          {chips.map((c) => (
                            <span key={c} className="badge bg-primary-400/15 text-primary-400">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft">Simple</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">{formatCurrency(p.precioOferta || p.precio)}</td>
                    <td className="px-4 py-3">
                      {restockId === p._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={restockQty}
                            onChange={(e) => setRestockQty(e.target.value)}
                            className="w-16 text-xs input-field px-2 py-1"
                            placeholder="Cant."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRestock(p)}
                            className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRestockId(null);
                              setRestockQty('');
                            }}
                            className="text-xs px-2 py-1 rounded-lg bg-pearl text-ink-soft hover:text-ink"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`badge text-xs ${
                              p.stock > 5
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : p.stock > 0
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {p.stock}
                          </span>
                          {p.stock <= 5 && (
                            <button
                              type="button"
                              onClick={() => {
                                setRestockId(p._id);
                                setRestockQty('');
                              }}
                              title="Reponer stock"
                              className="p-1 rounded-lg hover:bg-primary-400/10 text-primary-400"
                            >
                              <HiOutlineRefresh size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(p)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-ink-soft hover:text-ink"
                        >
                          <HiOutlinePencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                page === i + 1
                  ? 'bg-primary-400 text-white'
                  : 'bg-surface border border-surface-border text-ink-soft hover:border-ink/40'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsAdmin;
