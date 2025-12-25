const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use an environment variable in production; fall back to a dev default.
const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '2h';

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate input (enhanced with more fields)
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Email already registered.',
        success: false 
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user with additional fields
    const user = await User.create({ 
      name: name || email.split('@')[0], // Default name from email
      email, 
      phone: phone || '',
      password: hashed,
      role: 'user'
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({ 
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ 
      error: 'Registration failed.', 
      details: err.message,
      success: false
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required.',
        success: false
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ 
      error: 'Invalid credentials',
      success: false
    });

    // Check if user has a password (legacy users or social auth might not)
    if (!user.password) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        success: false
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ 
      error: 'Invalid credentials',
      success: false
    });

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({ 
      success: true,
      token, 
      email: user.email,
      name: user.name,
      id: user._id
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'Login failed.', 
      details: err.message,
      success: false
    });
  }
};

// New method: Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      details: err.message
    });
  }
};

// New method: Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: err.message
    });
  }
};

// New method: Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'Password change not allowed for this account'
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: err.message
    });
  }
};