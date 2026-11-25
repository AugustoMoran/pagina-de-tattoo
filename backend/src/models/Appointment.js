const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    artista: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
    fechaHora: { type: Date, required: true },
    duracionMinutos: { type: Number, default: 60 },

    // Client (guest or registered)
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    nombreCliente: { type: String, required: true, trim: true },
    emailCliente: { type: String, required: true, trim: true, lowercase: true },
    telefonoCliente: { type: String, required: true, trim: true },
    notas: { type: String, default: '' },

    // Deposit (seña)
    montoSenia: { type: Number, required: true, min: 0 },
    metodoPago: { type: String, enum: ['mercadopago', 'whatsapp'], required: true },
    estadoPago: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado', 'liberado'],
      default: 'pendiente',
    },
    estado: {
      type: String,
      enum: ['solicitado', 'confirmado', 'cancelado', 'completado', 'liberado'],
      default: 'solicitado',
    },

    mpPreferenceId: { type: String, default: null },
    mpPaymentId: { type: String, default: null },
    codigo: { type: String, unique: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ artista: 1, fechaHora: 1 });
appointmentSchema.index({ estado: 1, estadoPago: 1 });

appointmentSchema.pre('save', function (next) {
  if (!this.codigo) {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.codigo = `TRN-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
