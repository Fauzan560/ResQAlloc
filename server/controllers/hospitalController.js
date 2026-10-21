const Hospital = require('../models/Hospital');
const HospitalResource = require('../models/HospitalResource');
const AuditLog = require('../models/AuditLog');

/**
 * @route   GET /api/hospitals
 * @desc    Get all hospitals with filtering, search, and pagination
 * @access  Public
 */
exports.getHospitals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      specialty,
      hasEmergency,
      hasTraumaCenter,
      hasBloodBank,
      area,
      sortBy = 'name',
      order = 'asc',
      lat,
      lon,
      maxDistance // km
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { specialties: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (type) query.type = type;
    if (specialty) query.specialties = { $regex: specialty, $options: 'i' };
    if (hasEmergency === 'true') query.hasEmergency = true;
    if (hasTraumaCenter === 'true') query.hasTraumaCenter = true;
    if (hasBloodBank === 'true') query.hasBloodBank = true;
    if (area) query.area = { $regex: area, $options: 'i' };

    // Geospatial query
    if (lat && lon) {
      const maxDist = (parseFloat(maxDistance) || 50) * 1000; // Convert km to meters
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          $maxDistance: maxDist
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Hospital.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: hospitals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/hospitals/:id
 * @desc    Get a single hospital with its resource data
 * @access  Public
 */
exports.getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Get resource availability
    const resources = await HospitalResource.findOne({ hospital: hospital._id });

    res.json({
      success: true,
      data: {
        ...hospital.toObject(),
        resources: resources || null,
        dataDisclaimer: {
          locationStatus: hospital.locationVerified,
          capacityStatus: hospital.capacityVerified,
          message: hospital.capacityVerified === 'synthetic'
            ? 'Capacity and resource data is synthetic (generated for demonstration purposes)'
            : 'Data source: ' + hospital.capacityVerified
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/hospitals
 * @desc    Create a new hospital
 * @access  Admin
 */
exports.createHospital = async (req, res) => {
  try {
    const hospitalData = {
      ...req.body,
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      }
    };

    const hospital = await Hospital.create(hospitalData);

    // Create default resource entry
    await HospitalResource.create({
      hospital: hospital._id,
      generalBeds: { total: hospital.totalBeds, available: Math.floor(hospital.totalBeds * 0.3) },
      icuBeds: { total: hospital.icuBeds, available: Math.floor(hospital.icuBeds * 0.3) },
      ventilators: { total: hospital.ventilators, available: Math.floor(hospital.ventilators * 0.4) },
      operatingTheaters: { total: hospital.operatingTheaters, available: Math.floor(hospital.operatingTheaters * 0.5) },
      ambulancesAvailable: Math.floor(hospital.ambulances * 0.5),
      dataSource: 'synthetic'
    });

    await AuditLog.log({
      action: 'hospital_created',
      description: `Hospital ${hospital.name} created`,
      user: req.user._id,
      targetModel: 'Hospital',
      targetId: hospital._id
    });

    res.status(201).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating hospital',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/hospitals/:id
 * @desc    Update a hospital
 * @access  Admin
 */
exports.updateHospital = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.body.latitude && req.body.longitude) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    await AuditLog.log({
      action: 'hospital_updated',
      description: `Hospital ${hospital.name} updated`,
      user: req.user._id,
      targetModel: 'Hospital',
      targetId: hospital._id,
      metadata: { updatedFields: Object.keys(req.body) }
    });

    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hospital',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/hospitals/:id
 * @desc    Soft-delete a hospital
 * @access  Admin
 */
exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    await AuditLog.log({
      action: 'hospital_deleted',
      description: `Hospital ${hospital.name} deactivated`,
      user: req.user._id,
      targetModel: 'Hospital',
      targetId: hospital._id
    });

    res.json({
      success: true,
      message: 'Hospital deactivated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/hospitals/stats/overview
 * @desc    Get hospital statistics
 * @access  Public
 */
exports.getHospitalStats = async (req, res) => {
  try {
    const [total, byType, withEmergency, withTrauma, withBloodBank] = await Promise.all([
      Hospital.countDocuments({ isActive: true }),
      Hospital.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Hospital.countDocuments({ isActive: true, hasEmergency: true }),
      Hospital.countDocuments({ isActive: true, hasTraumaCenter: true }),
      Hospital.countDocuments({ isActive: true, hasBloodBank: true })
    ]);

    const totalBeds = await Hospital.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalBeds' }, icu: { $sum: '$icuBeds' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalHospitals: total,
        byType: byType.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
        withEmergency,
        withTraumaCenter: withTrauma,
        withBloodBank,
        totalBeds: totalBeds[0]?.total || 0,
        totalICUBeds: totalBeds[0]?.icu || 0,
        dataNote: 'All capacity figures are synthetic and for demonstration only'
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
