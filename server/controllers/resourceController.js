const HospitalResource = require('../models/HospitalResource');
const Hospital = require('../models/Hospital');
const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/resources/:hospitalId
 * @desc    Get resource availability for a hospital
 * @access  Public
 */
exports.getResources = async (req, res) => {
  try {
    const resource = await HospitalResource.findOne({ hospital: req.params.hospitalId })
      .populate('hospital', 'name type area')
      .populate('lastUpdatedBy', 'name');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource data not found for this hospital'
      });
    }

    res.json({
      success: true,
      data: resource,
      dataDisclaimer: resource.dataSource === 'synthetic'
        ? 'Resource availability data is SYNTHETIC and for demonstration purposes only'
        : `Data source: ${resource.dataSource}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/resources/:hospitalId
 * @desc    Update resource availability
 * @access  Private (hospital_staff for their hospital, admin for any)
 */
exports.updateResources = async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;

    // Check authorization
    if (req.user.role === 'hospital_staff') {
      if (!req.user.assignedHospital || 
          req.user.assignedHospital.toString() !== hospitalId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update resources for your assigned hospital'
        });
      }
    }

    const updates = {
      ...req.body,
      lastUpdatedBy: req.user._id,
      dataSource: 'staff_reported'
    };

    const resource = await HospitalResource.findOneAndUpdate(
      { hospital: hospitalId },
      updates,
      { new: true, upsert: true, runValidators: true }
    );

    await AuditLog.log({
      action: 'resource_updated',
      description: `Resources updated for hospital ${hospitalId}`,
      user: req.user._id,
      targetModel: 'HospitalResource',
      targetId: resource._id,
      metadata: { updatedFields: Object.keys(req.body) }
    });

    res.json({
      success: true,
      data: resource,
      message: 'Resources updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating resources',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/resources
 * @desc    Get all hospital resources summary
 * @access  Private (admin)
 */
exports.getAllResources = async (req, res) => {
  try {
    const resources = await HospitalResource.find()
      .populate('hospital', 'name type area hasEmergency')
      .populate('lastUpdatedBy', 'name')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: resources,
      dataNote: 'Resource availability data may be synthetic. Check dataSource field for each entry.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: error.message
    });
  }
};

module.exports = exports;
