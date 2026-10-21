const fetch = require('node-fetch');
const EmergencyCase = require('../models/EmergencyCase');
const Hospital = require('../models/Hospital');
const Referral = require('../models/Referral');
const AuditLog = require('../models/AuditLog');
const { matchHospitals, deriveRequiredSpecialties } = require('../utils/hospitalMatcher');
const { getRoute, getMultipleRoutes } = require('../utils/routingService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * @route   POST /api/emergency
 * @desc    Create a new emergency case and run full pipeline
 * @access  Private (responder, admin)
 */
exports.createEmergencyCase = async (req, res) => {
  try {
    const {
      patient,
      chiefComplaint,
      symptoms,
      vitals,
      location, // { latitude, longitude, address }
      notes
    } = req.body;

    // Validate location
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Emergency location (latitude, longitude) is required'
      });
    }

    // 1. Create the emergency case
    const emergencyCase = new EmergencyCase({
      patient: patient || {},
      chiefComplaint,
      symptoms: symptoms || [],
      vitals: vitals || {},
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
        address: location.address || ''
      },
      notes,
      createdBy: req.user._id,
      status: 'assessing'
    });

    await emergencyCase.save();

    // 2. Get KTAS severity prediction from ML service
    let severityResult;
    try {
      const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint,
          symptoms: symptoms || [],
          vitals: vitals || {},
          patient: {
            age: patient?.age,
            gender: patient?.gender
          }
        }),
        timeout: 10000
      });

      if (mlResponse.ok) {
        severityResult = await mlResponse.json();
      } else {
        throw new Error('ML service returned error');
      }
    } catch (mlError) {
      console.warn('ML service unavailable, using fallback severity assessment:', mlError.message);
      // Fallback severity classification
      severityResult = fallbackSeverityClassification(chiefComplaint, symptoms, vitals);
    }

    // Update case with severity
    emergencyCase.severity = {
      ktasLevel: severityResult.ktas_level,
      ktasLabel: severityResult.ktas_label,
      confidence: severityResult.confidence,
      isDemo: severityResult.is_demo !== false,
      predictedAt: new Date(),
      requiredCapabilities: severityResult.required_capabilities || []
    };
    emergencyCase.status = 'matching';
    await emergencyCase.save();

    await AuditLog.log({
      action: 'severity_predicted',
      description: `KTAS Level ${severityResult.ktas_level} predicted for case ${emergencyCase.caseId}`,
      user: req.user._id,
      targetModel: 'EmergencyCase',
      targetId: emergencyCase._id,
      metadata: { ktasLevel: severityResult.ktas_level, isDemo: severityResult.is_demo }
    });

    // 3. Match hospitals
    const matchResult = await matchHospitals(emergencyCase);

    // 4. Get routes for top matches
    const topMatches = matchResult.matches.slice(0, 5);
    const matchedHospitalIds = topMatches.map(m => m.hospital);
    const matchedHospitals = await Hospital.find({ _id: { $in: matchedHospitalIds } });
    const hospitalMap = {};
    matchedHospitals.forEach(h => { hospitalMap[h._id.toString()] = h; });

    // Get routes for top matches
    for (const match of topMatches) {
      const hospital = hospitalMap[match.hospital.toString()];
      if (hospital) {
        try {
          const route = await getRoute(
            parseFloat(location.latitude),
            parseFloat(location.longitude),
            hospital.location.coordinates[1],
            hospital.location.coordinates[0]
          );
          match.estimatedTime = route.duration;
          match.distance = route.distance;
          match.route = route;
        } catch (routeError) {
          // Keep haversine distance if routing fails
        }
      }
    }

    // Update case with match results
    emergencyCase.matchResults = topMatches.map(m => ({
      hospital: m.hospital,
      rank: m.rank,
      score: m.score,
      distance: m.distance,
      estimatedTime: m.estimatedTime,
      matchReasons: m.reasons,
      missingCapabilities: m.missingCapabilities,
      isFallback: m.isFallback
    }));

    // Set recommended hospital (top match)
    if (topMatches.length > 0) {
      emergencyCase.recommendedHospital = topMatches[0].hospital;
      
      // Get route for recommended hospital
      const recHospital = hospitalMap[topMatches[0].hospital.toString()];
      if (recHospital && topMatches[0].route) {
        emergencyCase.route = {
          distance: topMatches[0].route.distance,
          duration: topMatches[0].route.duration,
          geometry: topMatches[0].route.geometry,
          source: topMatches[0].route.source
        };
      }
    }

    emergencyCase.status = 'matched';
    await emergencyCase.save();

    await AuditLog.log({
      action: 'hospitals_matched',
      description: `${topMatches.length} hospitals matched for case ${emergencyCase.caseId}`,
      user: req.user._id,
      targetModel: 'EmergencyCase',
      targetId: emergencyCase._id,
      metadata: {
        matchCount: topMatches.length,
        usedFallback: matchResult.usedFallback,
        topHospital: matchedHospitals[0]?.name
      }
    });

    // Populate hospital details in response
    const populatedCase = await EmergencyCase.findById(emergencyCase._id)
      .populate('matchResults.hospital', 'name type area specialties hasEmergency hasTraumaCenter hasBloodBank totalBeds icuBeds ventilators locationVerified capacityVerified')
      .populate('recommendedHospital', 'name type area specialties hasEmergency hasTraumaCenter location')
      .populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      data: {
        emergencyCase: populatedCase,
        severity: severityResult,
        matching: {
          totalEvaluated: matchResult.totalHospitalsEvaluated,
          matchCount: matchResult.matches.length,
          usedFallback: matchResult.usedFallback,
          fallbackExplanation: matchResult.fallbackExplanation,
          requiredSpecialties: matchResult.requiredSpecialties,
          fallbackOptions: matchResult.fallbacks
        }
      }
    });

  } catch (error) {
    console.error('Emergency case creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emergency case',
      error: error.message
    });
  }
};

/**
 * Fallback severity classification when ML service is unavailable.
 * Uses simple rule-based heuristics.
 * CLEARLY LABELED AS DEMONSTRATION MODE.
 */
function fallbackSeverityClassification(chiefComplaint, symptoms, vitals) {
  const complaint = (chiefComplaint || '').toLowerCase();
  const allSymptoms = (symptoms || []).map(s => s.toLowerCase());
  const allText = [complaint, ...allSymptoms].join(' ');

  let ktasLevel = 3; // Default: Urgent

  // Level 1 - Resuscitation
  const critical = ['cardiac arrest', 'not breathing', 'unconscious', 'severe bleeding', 'anaphylaxis', 'drowning'];
  if (critical.some(c => allText.includes(c))) {
    ktasLevel = 1;
  }
  // Check critical vitals
  else if (vitals) {
    if (vitals.glasgowComaScale && vitals.glasgowComaScale <= 8) ktasLevel = 1;
    else if (vitals.oxygenSaturation && vitals.oxygenSaturation < 85) ktasLevel = 1;
    else if (vitals.heartRate && (vitals.heartRate > 150 || vitals.heartRate < 40)) ktasLevel = 1;
  }

  // Level 2 - Emergency
  if (ktasLevel > 2) {
    const emergency = ['chest pain', 'stroke', 'heart attack', 'severe pain', 'head injury', 'seizure', 'overdose', 'major burn', 'stabbing', 'gunshot'];
    if (emergency.some(e => allText.includes(e))) {
      ktasLevel = 2;
    }
    if (vitals) {
      if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) ktasLevel = 2;
      if (vitals.systolicBP && vitals.systolicBP < 80) ktasLevel = 2;
      if (vitals.temperature && vitals.temperature > 40) ktasLevel = 2;
    }
  }

  // Level 4 - Less Urgent
  if (ktasLevel === 3) {
    const lessUrgent = ['minor cut', 'mild pain', 'rash', 'cold', 'cough', 'sore throat', 'sprain', 'minor burn'];
    if (lessUrgent.some(l => allText.includes(l))) {
      ktasLevel = 4;
    }
  }

  // Level 5 - Non-Urgent
  if (ktasLevel === 3) {
    const nonUrgent = ['prescription refill', 'follow-up', 'check-up', 'vaccination', 'routine'];
    if (nonUrgent.some(n => allText.includes(n))) {
      ktasLevel = 5;
    }
  }

  const labels = {
    1: 'Resuscitation',
    2: 'Emergency',
    3: 'Urgent',
    4: 'Less Urgent',
    5: 'Non-Urgent'
  };

  const requiredCapabilities = deriveRequiredSpecialties(symptoms, chiefComplaint);

  return {
    ktas_level: ktasLevel,
    ktas_label: labels[ktasLevel],
    confidence: 0.6, // Lower confidence for rule-based
    is_demo: true,
    model_type: 'rule_based_fallback',
    message: 'DEMO MODE: Severity assessed using rule-based fallback (ML service unavailable)',
    required_capabilities: requiredCapabilities
  };
}

/**
 * @route   GET /api/emergency
 * @desc    Get all emergency cases (with filters)
 * @access  Private
 */
exports.getEmergencyCases = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity } = req.query;
    
    let query = {};
    
    // Responders see only their own cases, admins see all
    if (req.user.role === 'responder') {
      query.createdBy = req.user._id;
    }
    
    if (status) query.status = status;
    if (severity) query['severity.ktasLevel'] = parseInt(severity);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [cases, total] = await Promise.all([
      EmergencyCase.find(query)
        .populate('recommendedHospital', 'name type area')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EmergencyCase.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: cases,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency cases',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/emergency/:id
 * @desc    Get a single emergency case with full details
 * @access  Private
 */
exports.getEmergencyCase = async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id)
      .populate('matchResults.hospital', 'name type area specialties hasEmergency hasTraumaCenter hasBloodBank totalBeds icuBeds ventilators location locationVerified capacityVerified phone')
      .populate('recommendedHospital', 'name type area specialties hasEmergency hasTraumaCenter location phone')
      .populate('createdBy', 'name email role')
      .populate('respondedBy', 'name email role');

    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    // Check access
    if (req.user.role === 'responder' && 
        emergencyCase.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: emergencyCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency case',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/emergency/:id/status
 * @desc    Update emergency case status
 * @access  Private
 */
exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const emergencyCase = await EmergencyCase.findById(req.params.id);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        message: 'Emergency case not found'
      });
    }

    emergencyCase.status = status;
    if (notes) emergencyCase.notes = notes;
    if (status === 'completed') emergencyCase.completedAt = new Date();

    await emergencyCase.save();

    await AuditLog.log({
      action: 'emergency_updated',
      description: `Emergency case ${emergencyCase.caseId} status updated to ${status}`,
      user: req.user._id,
      targetModel: 'EmergencyCase',
      targetId: emergencyCase._id
    });

    res.json({
      success: true,
      data: emergencyCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating emergency case',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/emergency/:id/select-hospital
 * @desc    Select a hospital from recommendations and create referral
 * @access  Private (responder, admin)
 */
exports.selectHospital = async (req, res) => {
  try {
    const { hospitalId } = req.body;

    const emergencyCase = await EmergencyCase.findById(req.params.id);
    if (!emergencyCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    // Find the match result for this hospital
    const matchResult = emergencyCase.matchResults.find(
      m => m.hospital.toString() === hospitalId
    );

    // Update emergency case
    emergencyCase.recommendedHospital = hospitalId;
    emergencyCase.status = 'referred';

    // Get route
    const [patientLon, patientLat] = emergencyCase.location.coordinates;
    const route = await getRoute(
      patientLat, patientLon,
      hospital.location.coordinates[1],
      hospital.location.coordinates[0]
    );
    emergencyCase.route = {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      source: route.source
    };

    await emergencyCase.save();

    // Create referral
    const referral = await Referral.create({
      emergencyCase: emergencyCase._id,
      toHospital: hospitalId,
      priority: emergencyCase.severity.ktasLevel <= 2 ? 'critical' : 
                emergencyCase.severity.ktasLevel === 3 ? 'high' : 'medium',
      patientSummary: {
        chiefComplaint: emergencyCase.chiefComplaint,
        ktasLevel: emergencyCase.severity.ktasLevel,
        vitals: emergencyCase.vitals,
        specialRequirements: emergencyCase.severity.requiredCapabilities
      },
      matchScore: matchResult?.score,
      matchReasons: matchResult?.matchReasons,
      missingCapabilities: matchResult?.missingCapabilities,
      isFallback: matchResult?.isFallback || false,
      estimatedDistance: route.distance,
      estimatedTime: route.duration,
      createdBy: req.user._id
    });

    await AuditLog.log({
      action: 'referral_created',
      description: `Referral created for case ${emergencyCase.caseId} to ${hospital.name}`,
      user: req.user._id,
      targetModel: 'Referral',
      targetId: referral._id
    });

    res.json({
      success: true,
      data: {
        emergencyCase,
        referral,
        route,
        hospital: {
          _id: hospital._id,
          name: hospital.name,
          type: hospital.type,
          area: hospital.area,
          phone: hospital.phone,
          location: hospital.location
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error selecting hospital',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/emergency/stats/overview
 * @desc    Get emergency case statistics
 * @access  Private (admin)
 */
exports.getEmergencyStats = async (req, res) => {
  try {
    const [total, byStatus, bySeverity, today] = await Promise.all([
      EmergencyCase.countDocuments(),
      EmergencyCase.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      EmergencyCase.aggregate([
        { $group: { _id: '$severity.ktasLevel', count: { $sum: 1 } } }
      ]),
      EmergencyCase.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        today,
        byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        bySeverity: bySeverity.reduce((acc, s) => ({ ...acc, [`KTAS-${s._id}`]: s.count }), {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};

module.exports = exports;
