const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateObjectId, validateLeaveApplication } = require('../middleware/validate');

router.use(authMiddleware);

router.post('/', validateLeaveApplication, leaveController.applyLeave);
router.get('/my', leaveController.getMyLeaves);
router.get('/:id', validateObjectId('id'), leaveController.getLeaveById);

module.exports = router;
