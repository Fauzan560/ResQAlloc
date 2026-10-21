const express = require('express');
const router = express.Router();
const {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  getHospitalStats
} = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/', getHospitals);
router.get('/stats/overview', getHospitalStats);
router.get('/:id', getHospital);

// Admin-only routes
router.post('/', protect, roleCheck('admin'), createHospital);
router.put('/:id', protect, roleCheck('admin'), updateHospital);
router.delete('/:id', protect, roleCheck('admin'), deleteHospital);

module.exports = router;
