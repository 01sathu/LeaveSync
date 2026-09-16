const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leave_management_db';
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB for seeding: ${mongoUri}`);

    // Clear existing data for clean seed
    await User.deleteMany({});
    await LeaveRequest.deleteMany({});
    console.log('Cleared existing User and LeaveRequest collections.');

    // Seed Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      leaveBalance: {
        casual: { total: 12, used: 0 },
        sick: { total: 10, used: 0 },
        earned: { total: 15, used: 0 },
      },
    });

    // Seed Employee 1
    const employee1 = await User.create({
      name: 'Asha Rao',
      email: 'asha.rao@example.com',
      password: 'Employee@123',
      role: 'employee',
      leaveBalance: {
        casual: { total: 12, used: 0 },
        sick: { total: 10, used: 0 },
        earned: { total: 15, used: 0 },
      },
    });

    // Seed Employee 2
    const employee2 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      password: 'Employee@123',
      role: 'employee',
      leaveBalance: {
        casual: { total: 12, used: 0 },
        sick: { total: 10, used: 0 },
        earned: { total: 15, used: 0 },
      },
    });

    // Seed sample leave requests to demonstrate pending, approved, and rejected states
    // Sample 1: Approved Earned leave for Asha Rao
    const approvedLeave = await LeaveRequest.create({
      employeeId: employee1._id,
      leaveType: 'Earned',
      startDate: new Date('2026-04-10'),
      endDate: new Date('2026-04-12'),
      totalDays: 3,
      reason: 'Family wedding event',
      status: 'Approved',
      reviewedBy: admin._id,
      reviewedAt: new Date('2026-04-02'),
    });
    // Update employee1's balance for the approved leave
    await User.findByIdAndUpdate(employee1._id, {
      $inc: { 'leaveBalance.earned.used': 3 },
    });

    // Sample 2: Pending Casual leave for Asha Rao
    await LeaveRequest.create({
      employeeId: employee1._id,
      leaveType: 'Casual',
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-05-16'),
      totalDays: 2,
      reason: 'Personal home maintenance',
      status: 'Pending',
    });

    // Sample 3: Pending Sick leave for Rahul Verma
    await LeaveRequest.create({
      employeeId: employee2._id,
      leaveType: 'Sick',
      startDate: new Date('2026-05-20'),
      endDate: new Date('2026-05-21'),
      totalDays: 2,
      reason: 'Doctor scheduled checkup',
      status: 'Pending',
    });

    console.log('✅ Database seeded successfully!');
    console.log('Accounts created:');
    console.log('  Admin:    admin@example.com / Admin@123');
    console.log('  Employee: asha.rao@example.com / Employee@123');
    console.log('  Employee: rahul.verma@example.com / Employee@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
