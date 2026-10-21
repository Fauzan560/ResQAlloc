const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  csvId: {
    type: Number,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Government', 'Private', 'Charitable', 'Teaching'],
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    default: 'Hyderabad'
  },
  state: {
    type: String,
    default: 'Telangana'
  },
  pincode: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON format
      required: true
    }
  },
  // IMPORTANT: Flags for data transparency
  locationVerified: {
    type: String,
    enum: ['verified', 'approximate', 'unverified'],
    default: 'approximate',
    // NOTE: Most coordinates in the dataset are approximate/synthetic
  },
  capacityVerified: {
    type: String,
    enum: ['verified', 'synthetic', 'unverified'],
    default: 'synthetic',
    // NOTE: Capacity numbers are synthetic for demonstration purposes
  },
  phone: String,
  email: String,
  website: String,
  specialties: [{
    type: String,
    trim: true
  }],
  hasEmergency: {
    type: Boolean,
    default: false
  },
  hasTraumaCenter: {
    type: Boolean,
    default: false
  },
  hasBloodBank: {
    type: Boolean,
    default: false
  },
  // Capacity fields (labeled as synthetic in dataset)
  totalBeds: {
    type: Number,
    default: 0
  },
  icuBeds: {
    type: Number,
    default: 0
  },
  ventilators: {
    type: Number,
    default: 0
  },
  ambulances: {
    type: Number,
    default: 0
  },
  operatingTheaters: {
    type: Number,
    default: 0
  },
  establishedYear: Number,
  accreditation: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
hospitalSchema.index({ location: '2dsphere' });

// Text index for search
hospitalSchema.index({ name: 'text', area: 'text', specialties: 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
