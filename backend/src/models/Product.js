const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const colorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    codigo: { type: String, required: true },
    habilitado: { type: Boolean, default: true },
    // Image shown when this color is selected (Cloudinary)
    imagen: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    precio: { type: Number, required: true, min: 0 },
    precioOferta: { type: Number, default: null, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    imagenes: [mediaSchema],
    videos: [mediaSchema],
    tags: [{ type: String, trim: true }],

    // Which variant dimensions apply (remera → tallas, arito → medidas/colores, instrumento → ninguno o colores)
    atributos: {
      usaTallas: { type: Boolean, default: false },
      usaColores: { type: Boolean, default: false },
      usaMedidas: { type: Boolean, default: false },
    },

    tallas: {
      habilitadas: [{ type: String, trim: true }],
      rango: { type: String, default: '' },
    },
    // Piercing / jewelry sizes (stored as numeric strings, unit separate)
    medidas: {
      habilitadas: [{ type: String, trim: true }],
      unidad: { type: String, default: 'mm', trim: true },
      etiqueta: { type: String, default: 'Medida', trim: true },
    },
    colores: [colorSchema],

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    vendidos: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ nombre: 'text', descripcion: 'text', tags: 'text' });

productSchema.methods.softDelete = async function () {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
