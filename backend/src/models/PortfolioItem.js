const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema(
  {
    titulo: { type: String, default: '', trim: true },
    descripcion: { type: String, default: '' },
    estilo: { type: String, default: '', trim: true }, // blackwork, fine line, etc.
    artista: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null },
    imagen: {
      url: { type: String, required: true },
      publicId: { type: String, default: '' },
    },
    destacado: { type: Boolean, default: false },
    orden: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PortfolioItem', portfolioItemSchema);
