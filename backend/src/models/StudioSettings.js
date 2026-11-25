const mongoose = require('mongoose');

const studioSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    montoSenia: { type: Number, default: 10000, min: 0 },
    mensajeTurnoWhatsApp: {
      type: String,
      default:
        'Hola! Solicité un turno en MDFK Tattoo.\nCódigo: {{codigo}}\nArtista: {{artista}}\nFecha: {{fecha}}\nSeña: ${{senia}}\nNombre: {{nombre}}\nTel: {{telefono}}',
    },
    whatsappNumero: { type: String, default: '5491137764237' },
    instagram: { type: String, default: 'https://instagram.com/mdfk.tattoo' },
    direccion: { type: String, default: '' },
    nombreEstudio: { type: String, default: 'MDFK Tattoo' },
  },
  { timestamps: true }
);

studioSettingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne({ key: 'default' });
  if (!doc) {
    doc = await this.create({ key: 'default' });
  }
  return doc;
};

module.exports = mongoose.model('StudioSettings', studioSettingsSchema);
