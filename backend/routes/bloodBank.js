const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRequest, getRequests, updateRequest, getSuggestedDonors,
  registerDonor, getDonors, updateDonor, deleteDonor,
  getInventory, updateInventory, lookupDonor, donateAgain,
  getDonorMatches,
} = require('../controllers/bloodBankController');

// Blood Requests
router.post('/requests', protect, createRequest);
router.get('/requests', protect, getRequests);
router.put('/requests/:id', protect, authorize('admin', 'superadmin'), updateRequest);
router.get('/requests/:id/donors', protect, getSuggestedDonors);

// Donors — public registration (no auth required)
router.post('/donors/public', registerDonor);
router.get('/donors/lookup', lookupDonor);
router.get('/donors/match',  protect, getDonorMatches);   // must be before /:id
router.put('/donors/:id/donate', donateAgain);

router.post('/donors', protect, registerDonor);
router.get('/donors', protect, getDonors);
router.put('/donors/:id', protect, updateDonor);
router.delete('/donors/:id', protect, authorize('admin', 'superadmin'), deleteDonor);

// Inventory
router.get('/inventory', protect, getInventory);
router.put('/inventory/:bloodGroup', protect, authorize('admin', 'superadmin'), updateInventory);

module.exports = router;
