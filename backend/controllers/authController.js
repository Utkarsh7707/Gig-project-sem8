const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Default: WORKER)
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Normalize the email manually just to be extra safe before querying
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Manual Check
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

   // Replace this:
// const assignedRole = role === 'AGGREGATOR' || role === 'ADMIN' ? role : 'WORKER';
// const user = await User.create({ name, email, password, role: assignedRole });

// With this:
const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'WORKER';
const user = await User.create({ name, email, password, role: assignedRole });

    res.status(201).json({ message: 'User registered successfully. Please log in.' });

  } catch (error) {
    // 3. Database-Level Check: Catch MongoDB's strict duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // The frontend will use this to redirect to the correct dashboard
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};