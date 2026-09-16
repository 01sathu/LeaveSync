const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateLogin } = require('../middleware/validate');

router.post('/login', validateLogin, authController.login);

module.exports = router;
