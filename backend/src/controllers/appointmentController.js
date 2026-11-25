const Appointment = require('../models/Appointment');
const Artist = require('../models/Artist');
const StudioSettings = require('../models/StudioSettings');
const mercadopagoService = require('../services/mercadopagoService');

const createAppointment = async (req, res, next) => {
  try {
    const {
      artistaId,
      fechaHora,
      nombreCliente,
      emailCliente,
      telefonoCliente,
      notas,
      metodoPago,
    } = req.body;

    if (!artistaId || !fechaHora || !nombreCliente || !emailCliente || !telefonoCliente || !metodoPago) {
      return res.status(400).json({ message: 'Faltan datos obligatorios del turno.' });
    }

    const artist = await Artist.findById(artistaId);
    if (!artist || !artist.isActive) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }

    const slotDate = new Date(fechaHora);
    const clash = await Appointment.findOne({
      artista: artistaId,
      fechaHora: slotDate,
      estado: { $in: ['solicitado', 'confirmado'] },
    });
    if (clash) {
      return res.status(409).json({ message: 'Ese horario ya no está disponible.' });
    }

    const settings = await StudioSettings.getSettings();
    const appointment = await Appointment.create({
      artista: artistaId,
      fechaHora: slotDate,
      nombreCliente,
      emailCliente,
      telefonoCliente,
      notas: notas || '',
      metodoPago,
      montoSenia: settings.montoSenia,
      usuario: req.user?._id || null,
      estado: 'solicitado',
      estadoPago: 'pendiente',
    });

    await appointment.populate('artista', 'nombre');

    let mpData = null;
    if (metodoPago === 'mercadopago') {
      if (!process.env.MP_ACCESS_TOKEN) {
        return res.status(400).json({
          message: 'Mercado Pago no está configurado. Usá WhatsApp para la seña o cargá MP_ACCESS_TOKEN.',
        });
      }
      try {
        const pref = await mercadopagoService.createSeniaPreference(appointment);
        mpData = { preferenceId: pref.id, initPoint: pref.init_point };
        appointment.mpPreferenceId = pref.id;
        await appointment.save();
      } catch (mpErr) {
        return res.status(502).json({
          message: 'No se pudo crear el pago de seña en Mercado Pago. Probá por WhatsApp.',
          detail: mpErr.message,
        });
      }
    }

    const waNumber = settings.whatsappNumero || process.env.WHATSAPP_NUMBER;
    const fechaStr = slotDate.toLocaleString('es-AR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const msg = (settings.mensajeTurnoWhatsApp || '')
      .replace(/\{\{codigo\}\}/g, appointment.codigo)
      .replace(/\{\{artista\}\}/g, appointment.artista?.nombre || '')
      .replace(/\{\{fecha\}\}/g, fechaStr)
      .replace(/\{\{senia\}\}/g, String(appointment.montoSenia))
      .replace(/\{\{nombre\}\}/g, nombreCliente)
      .replace(/\{\{telefono\}\}/g, telefonoCliente);

    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

    res.status(201).json({
      appointment,
      mpData,
      whatsappUrl,
    });
  } catch (error) {
    next(error);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const filter = req.user
      ? { $or: [{ usuario: req.user._id }, { emailCliente: req.user.email }] }
      : { emailCliente: req.query.email };
    if (!req.user && !req.query.email) {
      return res.status(400).json({ message: 'Email requerido.' });
    }
    const list = await Appointment.find(filter)
      .populate('artista', 'nombre foto')
      .sort({ fechaHora: -1 });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

const getAllAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, estado, artista } = req.query;
    const filter = {};
    if (estado) filter.estado = estado;
    if (artista) filter.artista = artista;

    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('artista', 'nombre')
        .sort({ fechaHora: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);
    res.json({ appointments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const allowed = ['estado', 'estadoPago', 'notas', 'fechaHora', 'artista'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('artista', 'nombre');
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado.' });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

/** Release slot so it becomes available again */
const releaseAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { estado: 'liberado', estadoPago: 'liberado' },
      { new: true }
    ).populate('artista', 'nombre');
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado.' });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

const confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { estado: 'confirmado', estadoPago: 'aprobado' },
      { new: true }
    ).populate('artista', 'nombre');
    if (!appointment) return res.status(404).json({ message: 'Turno no encontrado.' });
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointment,
  releaseAppointment,
  confirmAppointment,
};
