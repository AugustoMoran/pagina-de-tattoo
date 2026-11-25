const StudioSettings = require('../models/StudioSettings');

const getSettings = async (req, res, next) => {
  try {
    const settings = await StudioSettings.getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      'montoSenia',
      'mensajeTurnoWhatsApp',
      'whatsappNumero',
      'instagram',
      'direccion',
      'nombreEstudio',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const settings = await StudioSettings.findOneAndUpdate(
      { key: 'default' },
      { $set: updates },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
