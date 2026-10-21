const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, updateUser, getAuditLogs } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All admin routes require admin role
router.use(protect, roleCheck('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
