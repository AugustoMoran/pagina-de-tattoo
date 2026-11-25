const express = require('express');
const router = express.Router();
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const {
  createAppointment,
  getMyAppointments,
  getAllAppointments,
  updateAppointment,
  releaseAppointment,
  confirmAppointment,
} = require('../controllers/appointmentController');

router.post('/', optionalAuth, createAppointment);
router.get('/mine', optionalAuth, getMyAppointments);
router.get('/', protect, adminOnly, getAllAppointments);
router.put('/:id', protect, adminOnly, updateAppointment);
router.post('/:id/release', protect, adminOnly, releaseAppointment);
router.post('/:id/confirm', protect, adminOnly, confirmAppointment);

module.exports = router;
