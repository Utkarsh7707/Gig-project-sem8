const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if the frontend sent a Bearer token in the headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token string (remove the "Bearer " part)
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user in the database. 
      // NOTE: 'decoded.id' must exactly match how you signed it in authController!
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Success! Move on to the actual route controller
    } catch (error) {
      console.error("JWT Error:", error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };