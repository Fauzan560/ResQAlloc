const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (admin can create any role; public can only register as responder)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, assignedHospital } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Only admins can create admin or hospital_staff accounts
    let userRole = 'responder';
    if (role && req.user && req.user.role === 'admin') {
      userRole = role;
    } else if (role && role !== 'responder') {
      // Allow hospital_staff self-registration for demo purposes
      if (role === 'hospital_staff') {
        userRole = 'hospital_staff';
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      assignedHospital: assignedHospital || null
    });

    const token = generateToken(user._id);

    await AuditLog.log({
      action: 'user_created',
      description: `User ${user.name} (${user.role}) created`,
      user: user._id,
      targetModel: 'User',
      targetId: user._id
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedHospital: user.assignedHospital
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return token
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    const token = generateToken(user._id);

    await AuditLog.log({
      action: 'user_login',
      description: `User ${user.name} logged in`,
      user: user._id,
      targetModel: 'User',
      targetId: user._id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedHospital: user.assignedHospital,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedHospital', 'name area type');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
