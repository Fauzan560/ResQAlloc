const mongoose = require('mongoose');

const emergencyCaseSchema = new mongoose.Schema({
  // Case identification
  caseId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'assessing', 'matching', 'referred', 'in_transit', 'arrived', 'completed', 'cancelled'],
    default: 'created'
  },

  // Patient information
  patient: {
    name: { type: String, default: 'Unknown' },
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other', 'unknown'], default: 'unknown' },
    bloodGroup: String,
    contactPhone: String,
    medicalHistory: String,
    allergies: String,
    currentMedications: String
  },

  // Emergency details
  chiefComplaint: {
    type: String,
    required: [true, 'Chief complaint is required']
  },
  symptoms: [String],
  
  // Vital signs
  vitals: {
    heartRate: Number,        // bpm
    systolicBP: Number,       // mmHg
    diastolicBP: Number,      // mmHg
    respiratoryRate: Number,   // breaths per minute
    temperature: Number,       // °C
    oxygenSaturation: Number,  // %
    glasgowComaScale: Number,  // 3-15
    painScale: Number          // 0-10
  },

  // KTAS Severity Assessment
  severity: {
    ktasLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      // 1=Resuscitation, 2=Emergency, 3=Urgent, 4=Less Urgent, 5=Non-Urgent
    },
    ktasLabel: String,
    confidence: Number,        // 0-1 prediction confidence
    isDemo: {
      type: Boolean,
      default: true
      // IMPORTANT: Set to true when using demo/simulated model
    },
    predictedAt: Date,
    requiredCapabilities: [String]  // derived from severity + symptoms
  },

  // Emergency location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },

  // Hospital matching results
  matchResults: [{
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital'
    },
    rank: Number,
    score: Number,
    distance: Number,         // km
    estimatedTime: Number,    // minutes
    matchReasons: [String],
    missingCapabilities: [String],
    isFallback: { type: Boolean, default: false }
  }],

  // Selected/recommended hospital
  recommendedHospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },

  // Route information
  route: {
    distance: Number,        // km
    duration: Number,         // minutes
    geometry: Object,         // GeoJSON line for map display
    source: { type: String, default: 'OSRM' }
  },

  // Responder info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  notes: String,
  
  completedAt: Date
}, {
  timestamps: true
});

// Geospatial index
emergencyCaseSchema.index({ location: '2dsphere' });
emergencyCaseSchema.index({ status: 1, createdAt: -1 });

// Auto-generate case ID before validation
emergencyCaseSchema.pre('validate', function(next) {
  if (!this.caseId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.caseId = `RQA-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('EmergencyCase', emergencyCaseSchema);
