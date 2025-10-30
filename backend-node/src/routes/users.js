const express = require('express');
const auth = require('../middlewares/auth');
const User = require('../models/user');
const { apiLimiter } = require('../middlewares/rateLimiter');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();

// Get current user
router.get('/me', 
    apiLimiter,
    auth, 
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User profile accessed:', { 
            userId: req.user.userId,
            timestamp: new Date().toISOString()
        });

        res.json(user);
    })
);

module.exports = router;