const mongoose = require('mongoose');

const weeklySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun … 6=Sat
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "18:00"
    slotMinutes: { type: Number, default: 60, min: 15 },
  },
  { _id: false }
);

const artistSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    especialidades: [{ type: String, trim: true }],
    foto: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    instagram: { type: String, default: '' },
    // Recurring weekly template (empty = that day has no recurring hours)
    weeklyAvailability: [weeklySlotSchema],
    // One-off open slots (manual)
    extraSlots: [{ type: Date }],
    // Block specific slot start times
    blockedSlots: [{ type: Date }],
    // Full days off as YYYY-MM-DD (local studio calendar)
    blockedDays: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Artist', artistSchema);
