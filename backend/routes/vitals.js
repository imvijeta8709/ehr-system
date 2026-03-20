const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const { createVitals, getVitals, deleteVitals } = require('../controllers/vitalsController');

router.post('/',      protect, checkPermission('vitals', 'create'), createVitals);
router.get('/',       protect, checkPermission('vitals', 'view'),   getVitals);
router.delete('/:id', protect, checkPermission('vitals', 'delete'), deleteVitals);

module.exports = router;
