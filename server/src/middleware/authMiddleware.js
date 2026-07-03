// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // Check if token exists in Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request object (excluding password)
    req.user = await User.findById(decoded.id).select('-password');

    next(); // Pass control to the next middleware or route handler

  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token is invalid or expired' });
  }
};

module.exports = { protect };