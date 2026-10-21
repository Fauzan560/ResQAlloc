const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  emergencyCase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyCase',
    required: true
  },
  fromHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  toHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high'
  },
  
  // Patient summary for receiving hospital
  patientSummary: {
    chiefComplaint: String,
    ktasLevel: Number,
    vitals: Object,
    specialRequirements: [String]
  },

  // Matching info
  matchScore: Number,
  matchReasons: [String],
  missingCapabilities: [String],
  isFallback: { type: Boolean, default: false },
  
  // Route info
  estimatedDistance: Number,  // km
  estimatedTime: Number,     // minutes

  // Response
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responseNotes: String,
  respondedAt: Date,

  // Created by (responder or system)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  notes: String
}, {
  timestamps: true
});

referralSchema.index({ toHospital: 1, status: 1 });
referralSchema.index({ emergencyCase: 1 });

module.exports = mongoose.model('Referral', referralSchema);
