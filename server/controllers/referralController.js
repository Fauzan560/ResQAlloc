const Referral = require('../models/Referral');
const EmergencyCase = require('../models/EmergencyCase');
const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/referrals
 * @desc    Get referrals (filtered by user role)
 * @access  Private
 */
exports.getReferrals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    let query = {};

    // Hospital staff sees referrals for their hospital
    if (req.user.role === 'hospital_staff' && req.user.assignedHospital) {
      query.toHospital = req.user.assignedHospital;
    }
    // Responders see referrals they created
    else if (req.user.role === 'responder') {
      query.createdBy = req.user._id;
    }
    // Admin sees all

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [referrals, total] = await Promise.all([
      Referral.find(query)
        .populate('emergencyCase', 'caseId chiefComplaint severity.ktasLevel severity.ktasLabel status patient.name')
        .populate('toHospital', 'name type area phone')
        .populate('fromHospital', 'name type area')
        .populate('createdBy', 'name email')
        .populate('respondedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Referral.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: referrals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching referrals',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/referrals/:id
 * @desc    Get a single referral
 * @access  Private
 */
exports.getReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('emergencyCase')
      .populate('toHospital', 'name type area phone specialties location')
      .populate('fromHospital', 'name type area')
      .populate('createdBy', 'name email')
      .populate('respondedBy', 'name email');

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    res.json({
      success: true,
      data: referral
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching referral',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/referrals/:id/respond
 * @desc    Accept or reject a referral (hospital staff)
 * @access  Private (hospital_staff, admin)
 */
exports.respondToReferral = async (req, res) => {
  try {
    const { action, responseNotes } = req.body; // action: 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "accept" or "reject"'
      });
    }

    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    // Check authorization
    if (req.user.role === 'hospital_staff') {
      if (!req.user.assignedHospital || 
          req.user.assignedHospital.toString() !== referral.toHospital.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only respond to referrals for your assigned hospital'
        });
      }
    }

    referral.status = action === 'accept' ? 'accepted' : 'rejected';
    referral.respondedBy = req.user._id;
    referral.responseNotes = responseNotes || '';
    referral.respondedAt = new Date();
    await referral.save();

    // Update emergency case status
    if (action === 'accept') {
      await EmergencyCase.findByIdAndUpdate(referral.emergencyCase, {
        status: 'in_transit'
      });
    }

    await AuditLog.log({
      action: action === 'accept' ? 'referral_accepted' : 'referral_rejected',
      description: `Referral ${referral._id} ${action}ed`,
      user: req.user._id,
      targetModel: 'Referral',
      targetId: referral._id
    });

    res.json({
      success: true,
      data: referral,
      message: `Referral ${action}ed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error responding to referral',
      error: error.message
    });
  }
};

module.exports = exports;
