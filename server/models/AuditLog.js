const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'user_login', 'user_logout', 'user_created', 'user_updated',
      'hospital_created', 'hospital_updated', 'hospital_deleted',
      'emergency_created', 'emergency_updated', 'emergency_completed',
      'severity_predicted', 'hospitals_matched',
      'referral_created', 'referral_accepted', 'referral_rejected',
      'resource_updated',
      'data_imported', 'system_event'
    ]
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetModel: {
    type: String,
    enum: ['User', 'Hospital', 'EmergencyCase', 'HospitalResource', 'Referral', 'System']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional context
  },
  ipAddress: String
}, {
  timestamps: true
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, action: 1 });

// Static method to create audit log entries easily
auditLogSchema.statics.log = async function(data) {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw - audit logging should not break the main flow
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
