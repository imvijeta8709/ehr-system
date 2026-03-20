const User = require('../models/User');
const Appointment = require('../models/Appointment');

// GET /api/users/patients — doctor sees only their own patients; admin sees all
exports.getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let patientIds = null;

    // Doctors only see patients they have appointments with
    if (req.user.role === 'doctor') {
      const appointments = await Appointment.find({ doctor: req.user._id }).distinct('patient');
      patientIds = appointments;
    }

    const query = { role: 'patient' };

    // Scope to doctor's own patients
    if (patientIds !== null) {
      query._id = { $in: patientIds };
    }

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total    = await User.countDocuments(query);
    const patients = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/doctors — any authenticated user can list doctors (read-only)
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: { $in: ['doctor', 'admin'] } }).select('-password');
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    const targetUser = await User.findById(targetId).select('role');
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Patients can only update their own profile
    if (requester.role === 'patient' && requester._id.toString() !== targetId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Doctors can only update their own profile — not other doctors' or admins'
    if (requester.role === 'doctor') {
      if (requester._id.toString() !== targetId) {
        return res.status(403).json({
          success: false,
          message: 'Doctors can only edit their own profile',
        });
      }
    }

    // Prevent role or password changes through this endpoint
    const { password, role, ...updateData } = req.body;

    // Strip empty strings so optional enum fields (e.g. gender) don't fail validation
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

    const updated = await User.findByIdAndUpdate(targetId, cleanData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/users/:id/avatar — upload profile picture
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Only allow the user themselves (or admin) to update avatar
    const targetId = req.params.id;
    if (req.user.role === 'patient' || req.user.role === 'doctor') {
      if (req.user._id.toString() !== targetId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      targetId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ success: true, avatar: avatarUrl, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/users/:id — admin only
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/analytics — admin/doctor: appointment trends for last 6 months
exports.getAnalytics = async (req, res) => {
  try {
    const months = 6;
    const now = new Date();
    const labels = [];
    const appointmentCounts = [];
    const patientCounts = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      labels.push(start.toLocaleString('default', { month: 'short', year: '2-digit' }));

      const apptQuery = { date: { $gte: start, $lte: end } };
      if (req.user.role === 'doctor') apptQuery.doctor = req.user._id;

      const [appts, patients] = await Promise.all([
        Appointment.countDocuments(apptQuery),
        User.countDocuments({ role: 'patient', createdAt: { $gte: start, $lte: end } }),
      ]);
      appointmentCounts.push(appts);
      patientCounts.push(patients);
    }

    res.json({ success: true, labels, appointmentCounts, patientCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/users/stats — admin/doctor
exports.getDashboardStats = async (req, res) => {
  try {
    let totalPatients;

    if (req.user.role === 'doctor') {
      // Count only this doctor's patients
      const patientIds = await Appointment.find({ doctor: req.user._id }).distinct('patient');
      totalPatients = patientIds.length;
    } else {
      totalPatients = await User.countDocuments({ role: 'patient' });
    }

    const [totalDoctors, activePatients] = await Promise.all([
      User.countDocuments({ role: { $in: ['doctor', 'admin'] } }),
      User.countDocuments({ role: 'patient', isActive: true }),
    ]);

    res.json({ success: true, stats: { totalPatients, totalDoctors, activePatients } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
