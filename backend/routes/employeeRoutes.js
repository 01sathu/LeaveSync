const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/profile', employeeController.getProfile);
router.get('/leave-balance', employeeController.getLeaveBalance);

module.exports = router;
