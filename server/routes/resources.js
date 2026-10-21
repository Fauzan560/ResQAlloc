const express = require('express');
const router = express.Router();
const { getResources, updateResources, getAllResources } = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public - get resources for a specific hospital
router.get('/:hospitalId', getResources);

// Admin - get all resources
router.get('/', protect, roleCheck('admin'), getAllResources);

// Hospital staff or admin - update resources
router.put('/:hospitalId', protect, roleCheck('hospital_staff', 'admin'), updateResources);

module.exports = router;
