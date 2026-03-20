const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const {
  createAppointment, getAppointments, getAppointmentById,
  updateAppointment, getAppointmentStats,
} = require('../controllers/appointmentController');

router.get('/stats', protect, getAppointmentStats);
router.post('/',     protect, checkPermission('appointments', 'create'), createAppointment);
router.get('/',      protect, checkPermission('appointments', 'view'),   getAppointments);
router.get('/:id',   protect, checkPermission('appointments', 'view'),   getAppointmentById);
router.put('/:id',   protect, checkPermission('appointments', 'edit'),   updateAppointment);

module.exports = router;
