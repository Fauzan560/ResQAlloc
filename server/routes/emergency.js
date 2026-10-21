const express = require('express');
const router = express.Router();
const {
  createEmergencyCase,
  getEmergencyCases,
  getEmergencyCase,
  updateEmergencyStatus,
  selectHospital,
  getEmergencyStats
} = require('../controllers/emergencyController');
const { protect, optionalAuth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes
router.post('/', protect, roleCheck('responder', 'admin'), createEmergencyCase);
router.get('/', protect, getEmergencyCases);
router.get('/stats/overview', protect, roleCheck('admin'), getEmergencyStats);
router.get('/:id', protect, getEmergencyCase);
router.put('/:id/status', protect, updateEmergencyStatus);
router.post('/:id/select-hospital', protect, roleCheck('responder', 'admin'), selectHospital);

// Public emergency report (simplified - creates basic case)
router.post('/public-report', optionalAuth, async (req, res) => {
  try {
    const EmergencyCase = require('../models/EmergencyCase');
    const { chiefComplaint, location, contactPhone, description } = req.body;

    if (!chiefComplaint || !location?.latitude || !location?.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide emergency description and location'
      });
    }

    // Create a basic public report (not full emergency case)
    const report = await EmergencyCase.create({
      chiefComplaint,
      symptoms: description ? [description] : [],
      patient: { contactPhone: contactPhone || '' },
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
        address: location.address || ''
      },
      status: 'created',
      createdBy: req.user?._id || null,
      notes: 'Public emergency report - awaiting responder assignment'
    });

    res.status(201).json({
      success: true,
      data: {
        caseId: report.caseId,
        message: 'Emergency report submitted. Please call 112 (India Emergency) or 108 (Ambulance) immediately.',
        emergencyNumbers: {
          india_emergency: '112',
          ambulance: '108',
          police: '100',
          fire: '101'
        },
        importantNote: 'This application is for academic demonstration only. In a real emergency, always call emergency services directly.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting report',
      error: error.message
    });
  }
});

module.exports = router;
