const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middlewares/validation');
const { authLimiter } = require('../middlewares/rateLimiter');
const { asyncHandler } = require('../middlewares/errorHandler');
const { sanitizeRequestForLogging } = require('../middlewares/security');

const router = express.Router();

// Register route
router.post('/register', 
  authLimiter,
  validateRegistration, 
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Log registration attempt (sanitized)
    const sanitizedLog = sanitizeRequestForLogging(req);
    console.log('Registration attempt:', sanitizedLog);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered',
        error: 'DUPLICATE_EMAIL'
      });
    }

    // Create new user
    const user = new User({ email, password });
    await user.save();

    // Log successful registration
    console.log('Registration successful:', { 
      userId: user._id, 
      email: user.email, 
      timestamp: new Date().toISOString() 
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  })
);

// Login route
router.post('/login', 
  authLimiter,
  validateLogin,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Log login attempt (sanitized)
    const sanitizedLog = sanitizeRequestForLogging(req);
    console.log('Login attempt:', sanitizedLog);

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Login failed - user not found:', { email, timestamp: new Date().toISOString() });
      return res.status(401).json({ 
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed - invalid password:', { 
        userId: user._id, 
        email, 
        timestamp: new Date().toISOString() 
      });
      return res.status(401).json({ 
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT with shorter expiry
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '30m' }
    );

    // Log successful login
    console.log('Login successful:', { 
      userId: user._id, 
      email: user.email, 
      timestamp: new Date().toISOString() 
    });

    // Set secure cookie for token storage
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: '/'
    });

    res.json({
      message: 'Login successful',
      access_token: token, // Still provide for backward compatibility
      token_type: 'bearer',
      expires_in: 30 * 60, // 30 minutes in seconds
      user: {
        id: user._id,
        email: user.email
      }
    });
  })
);

// Logout route (clear cookie)
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  });
  
  res.json({
    message: 'Logout successful'
  });
});

module.exports = router;