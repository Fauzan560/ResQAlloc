const User = require('../models/User');
const Hospital = require('../models/Hospital');
const EmergencyCase = require('../models/EmergencyCase');
const HospitalResource = require('../models/HospitalResource');
const Referral = require('../models/Referral');
const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview
 * @access  Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const [
      userCount,
      hospitalCount,
      emergencyCount,
      referralCount,
      recentCases,
      recentLogs,
      usersByRole,
      casesByStatus
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Hospital.countDocuments({ isActive: true }),
      EmergencyCase.countDocuments(),
      Referral.countDocuments(),
      EmergencyCase.find()
        .populate('recommendedHospital', 'name area')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      AuditLog.find()
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      EmergencyCase.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          hospitals: hospitalCount,
          emergencyCases: emergencyCount,
          referrals: referralCount
        },
        usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
        casesByStatus: casesByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        recentCases,
        recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading dashboard', error: error.message });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    let query = {};
    
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('assignedHospital', 'name area')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (role, status, etc.)
 * @access  Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, role, isActive, assignedHospital, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, isActive, assignedHospital, phone },
      { new: true, runValidators: true }
    ).populate('assignedHospital', 'name area');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await AuditLog.log({
      action: 'user_updated',
      description: `User ${user.name} updated by admin`,
      user: req.user._id,
      targetModel: 'User',
      targetId: user._id,
      metadata: { updatedFields: Object.keys(req.body) }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Admin
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action } = req.query;
    let query = {};
    if (action) query.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
  }
};

module.exports = exports;
