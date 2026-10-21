const express = require('express');
const router = express.Router();
const { getReferrals, getReferral, respondToReferral } = require('../controllers/referralController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', protect, getReferrals);
router.get('/:id', protect, getReferral);
router.put('/:id/respond', protect, roleCheck('hospital_staff', 'admin'), respondToReferral);

module.exports = router;
