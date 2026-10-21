const mongoose = require('mongoose');

/**
 * HospitalResource tracks the real-time (simulated) resource availability
 * for each hospital. Hospital staff can update these values.
 * 
 * NOTE: All availability data is SYNTHETIC and for demonstration only.
 * This does not reflect actual hospital resource availability.
 */
const hospitalResourceSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    unique: true
  },
  
  // Bed availability (SYNTHETIC DATA)
  generalBeds: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  icuBeds: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  ventilators: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  operatingTheaters: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },

  // Staff availability (SYNTHETIC DATA)
  emergencyDoctors: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  surgeons: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  nurses: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },

  // Special resources
  bloodBankStatus: {
    type: String,
    enum: ['available', 'limited', 'unavailable'],
    default: 'available'
  },
  ambulancesAvailable: {
    type: Number,
    default: 0
  },

  // Status
  acceptingEmergencies: {
    type: Boolean,
    default: true
  },
  divertStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
    // none = accepting all, partial = limited, full = diverting all
  },

  // Data quality label
  dataSource: {
    type: String,
    enum: ['synthetic', 'staff_reported', 'automated'],
    default: 'synthetic'
  },

  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HospitalResource', hospitalResourceSchema);
