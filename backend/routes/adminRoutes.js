const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateObjectId, validateRejection } = require('../middleware/validate');

// All admin routes require authentication and admin role
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/employees', adminController.getAllEmployees);
router.get('/leaves', adminController.getAllLeaves);
router.get('/leaves/:id', validateObjectId('id'), adminController.getLeaveDetail);
router.patch('/leaves/:id/approve', validateObjectId('id'), adminController.approveLeave);
router.patch('/leaves/:id/reject', validateObjectId('id'), validateRejection, adminController.rejectLeave);

module.exports = router;
