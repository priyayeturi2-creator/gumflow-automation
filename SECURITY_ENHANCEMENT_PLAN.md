# Security Enhancement Plan for Gumflow Automation

## Immediate Fixes Required

### 1. Secure Token Storage (Critical)
Replace localStorage JWT storage with secure alternatives:

#### Option A: HTTP-Only Cookies (Recommended)
```javascript
// Backend: Set cookie instead of returning token
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 60 * 1000 // 30 minutes
});

// Frontend: Remove localStorage usage - cookies handled automatically
```

#### Option B: Secure Session Storage with Encryption
```javascript
// Use crypto-js for encryption
import CryptoJS from 'crypto-js';

const setSecureToken = (token) => {
  const encrypted = CryptoJS.AES.encrypt(token, process.env.REACT_APP_SECRET_KEY).toString();
  sessionStorage.setItem('secure_token', encrypted);
};
```

### 2. Input Validation Middleware
```javascript
// backend-node/src/middlewares/validation.js
const { body, validationResult } = require('express-validator');

const validateFlowCreation = [
  body('founder_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Invalid founder name'),
  body('company_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .escape()
    .matches(/^[a-zA-Z0-9\s&.-]+$/)
    .withMessage('Invalid company name'),
  body('interview_transcript')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .escape()
    .withMessage('Interview transcript must be 10-10000 characters'),
  body('tone')
    .isIn(['Professional', 'Casual', 'Friendly', 'Technical', 'Enthusiastic'])
    .withMessage('Invalid tone selected')
];
```

### 3. Rate Limiting Implementation
```javascript
// backend-node/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later'
});

module.exports = { authLimiter, apiLimiter };
```

### 4. Remove Sensitive Logging
```javascript
// Replace in auth.js
// REMOVE: console.log(req.body)
// ADD: 
const sanitizedLog = { email: req.body.email, timestamp: new Date() };
console.log('Registration attempt:', sanitizedLog);
```

### 5. Enhanced Password Validation
```javascript
const validatePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];
```

### 6. HTTPS Enforcement
```javascript
// backend-node/src/middlewares/security.js
const helmet = require('helmet');

const securityMiddleware = (app) => {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true
    }
  }));
};
```

### 7. Improved Error Handling
```javascript
// backend-node/src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      message: 'An internal server error occurred',
      error_id: require('crypto').randomUUID()
    });
  } else {
    res.status(500).json({ 
      message: err.message,
      stack: err.stack 
    });
  }
};
```

### 8. Environment-based CORS
```javascript
// backend-node/src/config/cors.js
const getCorsConfig = () => {
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  return {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
};
```

## Updated Environment Variables

### Backend .env
```bash
# Security Configuration
JWT_SECRET=your_cryptographically_secure_256_bit_secret_here
JWT_EXPIRY=30m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# Session Configuration
SESSION_SECRET=your_session_secret_here
SESSION_MAX_AGE=1800000

# Security Headers
FORCE_HTTPS=true
```

### Frontend .env
```bash
# Remove sensitive keys from frontend
# Use only public configuration
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_ENVIRONMENT=production
```

## Implementation Priority

1. **Week 1**: Token storage security + Remove sensitive logging
2. **Week 2**: Input validation + Rate limiting  
3. **Week 3**: HTTPS enforcement + Error handling
4. **Week 4**: Enhanced password rules + Session management

## Testing Security Fixes

### Security Testing Checklist
- [ ] XSS vulnerability tests
- [ ] CSRF protection verification  
- [ ] SQL/NoSQL injection attempts
- [ ] Authentication bypass attempts
- [ ] Rate limiting verification
- [ ] Input validation edge cases
- [ ] Error message information leakage
- [ ] Token storage security validation

## Monitoring and Alerting

Consider implementing:
- Failed authentication attempt monitoring
- Unusual API usage pattern detection  
- Security header compliance checking
- Regular security dependency updates
- Automated vulnerability scanning