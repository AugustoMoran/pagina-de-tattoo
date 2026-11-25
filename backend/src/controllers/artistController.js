const Artist = require('../models/Artist');
const Appointment = require('../models/Appointment');

const getArtists = async (req, res, next) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const artists = await Artist.find(filter).sort({ orden: 1, nombre: 1 });
    res.json(artists);
  } catch (error) {
    next(error);
  }
};

const getArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ message: 'Artista no encontrado.' });
    res.json(artist);
  } catch (error) {
    next(error);
  }
};

const createArtist = async (req, res, next) => {
  try {
    const artist = await Artist.create(req.body);
    res.status(201).json(artist);
  } catch (error) {
    next(error);
  }
};

const updateArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!artist) return res.status(404).json({ message: 'Artista no encontrado.' });
    res.json(artist);
  } catch (error) {
    next(error);
  }
};

const deleteArtist = async (req, res, next) => {
  try {
    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!artist) return res.status(404).json({ message: 'Artista no encontrado.' });
    res.json({ message: 'Artista desactivado.', artist });
  } catch (error) {
    next(error);
  }
};

/** Local calendar day key YYYY-MM-DD */
function dayKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slotKey(date) {
  return new Date(date).toISOString();
}

/**
 * Hybrid availability:
 * weekly template + extraSlots − blockedDays − blockedSlots − booked appointments
 */
const getAvailability = async (req, res, next) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist || !artist.isActive) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }

    const from = req.query.from ? new Date(req.query.from) : new Date();
    const to = req.query.to
      ? new Date(req.query.to)
      : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

    const appointments = await Appointment.find({
      artista: artist._id,
      fechaHora: { $gte: from, $lte: to },
      estado: { $in: ['solicitado', 'confirmado'] },
    }).select('fechaHora');

    const booked = new Set(appointments.map((a) => slotKey(a.fechaHora)));
    const blocked = new Set((artist.blockedSlots || []).map((d) => slotKey(d)));
    const blockedDays = new Set(artist.blockedDays || []);

    const now = new Date();
    const slots = [];
    const seen = new Set();

    const pushSlot = (dt) => {
      if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return;
      if (dt <= now || dt < from || dt > to) return;
      if (blockedDays.has(dayKey(dt))) return;
      const iso = slotKey(dt);
      if (booked.has(iso) || blocked.has(iso) || seen.has(iso)) return;
      seen.add(iso);
      slots.push(iso);
    };

    // Expand weekly template day by day
    const cursorDay = new Date(from);
    cursorDay.setHours(0, 0, 0, 0);
    const endDay = new Date(to);
    endDay.setHours(23, 59, 59, 999);

    for (let d = new Date(cursorDay); d <= endDay; d.setDate(d.getDate() + 1)) {
      if (blockedDays.has(dayKey(d))) continue;
      const day = d.getDay();
      const templates = (artist.weeklyAvailability || []).filter((w) => w.dayOfWeek === day);
      for (const t of templates) {
        const [sh, sm] = String(t.startTime).split(':').map(Number);
        const [eh, em] = String(t.endTime).split(':').map(Number);
        const slotMin = Number(t.slotMinutes) || 60;
        let cursor = new Date(d);
        cursor.setHours(sh, sm || 0, 0, 0);
        const end = new Date(d);
        end.setHours(eh, em || 0, 0, 0);
        while (cursor < end) {
          pushSlot(new Date(cursor));
          cursor = new Date(cursor.getTime() + slotMin * 60 * 1000);
        }
      }
    }

    // Extra one-off openings
    for (const extra of artist.extraSlots || []) {
      pushSlot(new Date(extra));
    }

    slots.sort();
    res.json({
      artistId: artist._id,
      slots,
      meta: {
        weeklyBands: (artist.weeklyAvailability || []).length,
        extraSlots: (artist.extraSlots || []).length,
        blockedDays: (artist.blockedDays || []).length,
        blockedSlots: (artist.blockedSlots || []).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getArtists,
  getArtist,
  createArtist,
  updateArtist,
  deleteArtist,
  getAvailability,
};
