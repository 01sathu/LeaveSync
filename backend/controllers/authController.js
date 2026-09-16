const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email and explicitly select password
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
  }

  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

module.exports = {
  login,
};
