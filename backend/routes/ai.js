const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { suggestConditions } = require('../controllers/aiController');

router.post('/suggest', protect, suggestConditions);

module.exports = router;
