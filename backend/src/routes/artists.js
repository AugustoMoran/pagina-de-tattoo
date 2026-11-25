const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getArtists,
  getArtist,
  createArtist,
  updateArtist,
  deleteArtist,
  getAvailability,
} = require('../controllers/artistController');

router.get('/', getArtists);
router.get('/:id', getArtist);
router.get('/:id/availability', getAvailability);
router.post('/', protect, adminOnly, createArtist);
router.put('/:id', protect, adminOnly, updateArtist);
router.delete('/:id', protect, adminOnly, deleteArtist);

module.exports = router;
