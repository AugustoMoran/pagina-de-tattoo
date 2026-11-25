const PortfolioItem = require('../models/PortfolioItem');

const getPortfolio = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.estilo) filter.estilo = req.query.estilo;
    if (req.query.artista) filter.artista = req.query.artista;
    if (req.query.destacado === 'true') filter.destacado = true;

    const items = await PortfolioItem.find(filter)
      .populate('artista', 'nombre foto especialidades')
      .sort({ orden: 1, createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

const getAllPortfolioAdmin = async (req, res, next) => {
  try {
    const items = await PortfolioItem.find()
      .populate('artista', 'nombre')
      .sort({ orden: 1, createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

const createPortfolioItem = async (req, res, next) => {
  try {
    const item = await PortfolioItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const updatePortfolioItem = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Trabajo no encontrado.' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const deletePortfolioItem = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Trabajo no encontrado.' });
    res.json({ message: 'Trabajo eliminado.' });
  } catch (error) {
    next(error);
  }
};

const getStyles = async (req, res, next) => {
  try {
    const styles = await PortfolioItem.distinct('estilo', { isActive: true, estilo: { $ne: '' } });
    res.json(styles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolio,
  getAllPortfolioAdmin,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getStyles,
};
