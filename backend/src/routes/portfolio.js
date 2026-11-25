const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getPortfolio,
  getAllPortfolioAdmin,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getStyles,
} = require('../controllers/portfolioController');

router.get('/', getPortfolio);
router.get('/styles', getStyles);
router.get('/admin/all', protect, adminOnly, getAllPortfolioAdmin);
router.post('/', protect, adminOnly, createPortfolioItem);
router.put('/:id', protect, adminOnly, updatePortfolioItem);
router.delete('/:id', protect, adminOnly, deletePortfolioItem);

module.exports = router;
