const BloodRequest   = require('../models/BloodRequest');
const Donor          = require('../models/Donor');
const BloodInventory = require('../models/BloodInventory');
const Notification   = require('../models/Notification');
const AuditLog       = require('../models/AuditLog');
const { getConfig, calcBloodTotal } = require('../utils/billingService');

// Blood group compatibility map (who can receive from whom)
const COMPATIBLE = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

// ── Blood Requests ──────────────────────────────────────────────

// POST /api/blood/requests
exports.createRequest = async (req, res) => {
  try {
    const { bloodGroup, units, urgency, hospital, location, reason, patient } = req.body;

    // Check inventory
    const inv = await BloodInventory.findOne({ bloodGroup });
    if (inv && inv.units < units) {
      return res.status(400).json({
        success: false,
        message: `Only ${inv.units} unit(s) of ${bloodGroup} available in inventory`,
      });
    }

    const request = await BloodRequest.create({
      requestedBy: req.user._id,
      patient: patient || (req.user.role === 'patient' ? req.user._id : undefined),
      bloodGroup, units, urgency, hospital, location, reason,
    });

    await request.populate('requestedBy', 'name email role');

    AuditLog.create({ user: req.user._id, action: 'CREATE_BLOOD_REQUEST', resource: 'BloodRequest', resourceId: request._id, ip: req.ip }).catch(() => {});

    res.status(201).json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blood/requests
exports.getRequests = async (req, res) => {
  try {
    const { status, bloodGroup, page = 1, limit = 10 } = req.query;
    const query = {};

    // Non-admins see only their own requests
    if (req.user.role === 'patient') query.requestedBy = req.user._id;
    else if (req.user.role === 'doctor') query.requestedBy = req.user._id;

    if (status)     query.status     = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const total    = await BloodRequest.countDocuments(query);
    const requests = await BloodRequest.find(query)
      .populate('requestedBy', 'name email role')
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/blood/requests/:id — admin: approve/reject/fulfill
exports.updateRequest = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const prevStatus = request.status;

    // ── Approve: validate inventory and calculate billing ─────────
    if (status === 'approved' && prevStatus !== 'approved') {
      // Check stock without deducting — deduction happens after payment
      const inv = await BloodInventory.findOne({ bloodGroup: request.bloodGroup });
      const available = inv?.units ?? 0;
      if (available < request.units) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${available} unit(s) of ${request.bloodGroup} available, but ${request.units} requested.`,
        });
      }

      // Calculate billing
      const config = await getConfig('blood');
      request.pricePerUnit    = config.pricePerUnit;
      request.emergencyCharge = config.emergencyCharge;
      request.totalAmount     = calcBloodTotal(request.units, config.pricePerUnit, config.emergencyCharge);
      request.paymentStatus   = 'pending';
    }

    // ── Reject: no inventory change needed (deduction only happens at payment) ─
    // ── Fulfill: handled by billing payment endpoint ──────────────

    request.status    = status || request.status;
    request.adminNote = adminNote !== undefined ? adminNote : request.adminNote;
    await request.save();
    await request.populate('requestedBy', 'name email role');

    // Notify requester
    Notification.create({
      user: request.requestedBy._id,
      title: 'Blood Request Update',
      message: `Your blood request for ${request.units} unit(s) of ${request.bloodGroup} has been ${request.status}.`,
      type: 'general',
      link: '/app/blood-bank',
    }).catch(() => {});

    AuditLog.create({
      user: req.user._id,
      action: `BLOOD_REQUEST_${status.toUpperCase()}`,
      resource: 'BloodRequest',
      resourceId: request._id,
      ip: req.ip,
    }).catch(() => {});

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blood/requests/:id/donors — suggested donors for a request
exports.getSuggestedDonors = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const compatibleGroups = COMPATIBLE[request.bloodGroup] || [request.bloodGroup];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const donors = await Donor.find({
      bloodGroup: { $in: compatibleGroups },
      isAvailable: true,
      $or: [
        { lastDonationDate: { $lte: ninetyDaysAgo } },
        { lastDonationDate: null },
        { lastDonationDate: { $exists: false } },
      ],
    }).limit(10);

    res.json({ success: true, donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Donors ──────────────────────────────────────────────────────

// Helper: adjust inventory by delta for a blood group
async function adjustInventory(bloodGroup, delta, userId) {
  if (!delta || delta === 0) return;
  const inv = await BloodInventory.findOneAndUpdate(
    { bloodGroup },
    { $inc: { units: delta }, lastUpdatedBy: userId },
    { new: true, upsert: true }
  );
  // Clamp to 0 — never go negative
  if (inv.units < 0) {
    inv.units = 0;
    await inv.save();
  }
}

// POST /api/blood/donors  (also used by public route — req.user may be undefined)
exports.registerDonor = async (req, res) => {
  try {
    const { totalDonatedUnits = 0, bloodGroup } = req.body;
    if (totalDonatedUnits < 0) return res.status(400).json({ success: false, message: 'Donated units cannot be negative' });

    const donorData = { ...req.body, totalDonatedUnits };
    if (req.user?._id) donorData.user = req.user._id;
    const donor = await Donor.create(donorData);

    // Add donated units to inventory
    if (totalDonatedUnits > 0) await adjustInventory(bloodGroup, totalDonatedUnits, req.user?._id ?? null);

    res.status(201).json({ success: true, donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blood/donors/lookup?q=phone_or_email  (public)
exports.lookupDonor = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query required' });
    const donor = await Donor.findOne({
      $or: [
        { phone: q.trim() },
        { email: q.trim().toLowerCase() },
      ],
    });
    res.json({ success: true, donor: donor || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/blood/donors/:id/donate  (public — returning donor)
exports.donateAgain = async (req, res) => {
  try {
    const { lastDonationDate, unitsToAdd = 1 } = req.body;
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    // 90-day rule
    if (donor.lastDonationDate) {
      const days = (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);
      if (days < 90) {
        return res.status(400).json({
          success: false,
          message: `You must wait ${Math.ceil(90 - days)} more day(s) before donating again.`,
        });
      }
    }

    if (!lastDonationDate) return res.status(400).json({ success: false, message: 'Donation date is required' });
    if (unitsToAdd < 1) return res.status(400).json({ success: false, message: 'Units must be at least 1' });

    donor.lastDonationDate = new Date(lastDonationDate);
    donor.totalDonatedUnits = (donor.totalDonatedUnits || 0) + Number(unitsToAdd);
    await donor.save();

    await adjustInventory(donor.bloodGroup, Number(unitsToAdd), null);

    res.json({ success: true, donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blood/donors
exports.getDonors = async (req, res) => {
  try {
    const { bloodGroup, location, available, search, page = 1, limit = 10, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};
    if (bloodGroup) query.bloodGroup  = bloodGroup;
    if (location)   query.location    = { $regex: location, $options: 'i' };
    if (available === 'true') query.isAvailable = true;
    if (search)     query.name        = { $regex: search, $options: 'i' };
    if (dateFrom || dateTo) {
      query.lastDonationDate = {};
      if (dateFrom) query.lastDonationDate.$gte = new Date(dateFrom);
      if (dateTo)   query.lastDonationDate.$lte = new Date(new Date(dateTo).setHours(23, 59, 59));
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const total  = await Donor.countDocuments(query);
    const donors = await Donor.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, total, pages: Math.ceil(total / limit), donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/blood/donors/:id
exports.updateDonor = async (req, res) => {
  try {
    const existing = await Donor.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Donor not found' });

    const newUnits = req.body.totalDonatedUnits !== undefined ? Number(req.body.totalDonatedUnits) : existing.totalDonatedUnits;
    if (newUnits < 0) return res.status(400).json({ success: false, message: 'Donated units cannot be negative' });

    const delta = newUnits - existing.totalDonatedUnits;
    const bloodGroup = req.body.bloodGroup || existing.bloodGroup;

    // If blood group changed, reverse old group and add to new group
    if (req.body.bloodGroup && req.body.bloodGroup !== existing.bloodGroup) {
      await adjustInventory(existing.bloodGroup, -existing.totalDonatedUnits, req.user._id);
      await adjustInventory(bloodGroup, newUnits, req.user._id);
    } else if (delta !== 0) {
      await adjustInventory(bloodGroup, delta, req.user._id);
    }

    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/blood/donors/:id — admin only
exports.deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    // Reverse their donated units from inventory
    if (donor.totalDonatedUnits > 0) await adjustInventory(donor.bloodGroup, -donor.totalDonatedUnits, req.user._id);

    await donor.deleteOne();
    res.json({ success: true, message: 'Donor removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Inventory ───────────────────────────────────────────────────

// GET /api/blood/inventory
exports.getInventory = async (req, res) => {
  try {
    const inventory = await BloodInventory.find().sort({ bloodGroup: 1 });
    res.json({ success: true, inventory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/blood/inventory/:bloodGroup — admin: set units
exports.updateInventory = async (req, res) => {
  try {
    const { units, lowStockThreshold } = req.body;
    if (units !== undefined && units < 0) return res.status(400).json({ success: false, message: 'Units cannot be negative' });

    const update = { lastUpdatedBy: req.user._id };
    if (units !== undefined) update.units = units;
    if (lowStockThreshold !== undefined) update.lowStockThreshold = lowStockThreshold;

    const inv = await BloodInventory.findOneAndUpdate(
      { bloodGroup: req.params.bloodGroup },
      update,
      { new: true, upsert: true }
    );
    res.json({ success: true, inventory: inv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/blood/donors/match?bloodGroup=A+&location=Delhi — find eligible donors by group+location
exports.getDonorMatches = async (req, res) => {
  try {
    const { bloodGroup, location, compatible } = req.query;
    if (!bloodGroup) return res.status(400).json({ success: false, message: 'bloodGroup required' });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // compatible=true → include compatible groups (for requests), else exact match (for direct search)
    let groups = [bloodGroup];
    if (compatible === 'true') {
      groups = COMPATIBLE[bloodGroup] || [bloodGroup];
    }

    const query = {
      bloodGroup: { $in: groups },
      isAvailable: true,
      $or: [
        { lastDonationDate: { $lte: ninetyDaysAgo } },
        { lastDonationDate: null },
        { lastDonationDate: { $exists: false } },
      ],
    };

    if (location) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    const donors = await Donor.find(query).sort({ totalDonatedUnits: -1 }).limit(20);
    res.json({ success: true, donors, total: donors.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
