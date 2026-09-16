const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const leaveBalanceTypeSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      required: true,
      min: [0, 'Total leave cannot be negative'],
    },
    used: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Used leave cannot be negative'],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['employee', 'admin'],
        message: 'Role must be either employee or admin',
      },
      default: 'employee',
      required: true,
    },
    leaveBalance: {
      casual: {
        type: leaveBalanceTypeSchema,
        default: () => ({ total: 12, used: 0 }),
      },
      sick: {
        type: leaveBalanceTypeSchema,
        default: () => ({ total: 10, used: 0 }),
      },
      earned: {
        type: leaveBalanceTypeSchema,
        default: () => ({ total: 15, used: 0 }),
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
