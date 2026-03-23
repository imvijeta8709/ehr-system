const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableSlots, getSchedule, getMySchedule,
  setSchedule, setOverride,
} = require('../controllers/availabilityController');

// Doctor fetches own schedule — must be before /:doctorId
router.get('/me/schedule', protect, authorize('doctor', 'admin', 'superadmin'), getMySchedule);

// Doctor manages own schedule
router.put('/',           protect, authorize('doctor', 'admin', 'superadmin'), setSchedule);
router.patch('/override', protect, authorize('doctor', 'admin', 'superadmin'), setOverride);

// Authenticated users check available slots / full schedule for a doctor
router.get('/:doctorId',          protect, getAvailableSlots);
router.get('/:doctorId/schedule', protect, getSchedule);

module.exports = router;
