/**
 * @fileoverview Security middleware for headers and HTTPS enforcement
 * @description Implements security best practices with Helmet and HTTPS enforcement
 */

const helmet = require('helmet');

/**
 * HTTPS enforcement middleware for production
 */
const httpsEnforcement = (req, res, next) => {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is already HTTPS
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
  }
  next();
};

/**
 * Security headers middleware using Helmet
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.gumloop.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // X-Frame-Options
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // Cache Control
  crossOriginEmbedderPolicy: false, // Disable for external API calls
});

/**
 * Cache control middleware
 */
const cacheControl = (req, res, next) => {
  // Set cache control headers for API responses
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
};

/**
 * Sanitize request data for logging (remove sensitive information)
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request data
 */
const sanitizeRequestForLogging = (req) => {
  const sanitized = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.userId || 'anonymous'
  };

  // Only include sanitized body data for specific endpoints
  if (req.body && Object.keys(req.body).length > 0) {
    const { password, token, ...safeBody } = req.body;
    
    // Further sanitize sensitive fields
    if (safeBody.interview_transcript) {
      safeBody.interview_transcript = `[${safeBody.interview_transcript.length} characters]`;
    }
    
    sanitized.body = safeBody;
  }

  return sanitized;
};

/**
 * Security logging middleware
 */
const securityLogger = (req, res, next) => {
  // Log security-relevant events
  if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/register')) {
    const sanitizedRequest = sanitizeRequestForLogging(req);
    console.log('Security Event:', JSON.stringify(sanitizedRequest, null, 2));
  }
  
  next();
};

/**
 * Combined security middleware array
 */
const securityMiddleware = [
  httpsEnforcement,
  securityHeaders,
  cacheControl,
  securityLogger
];

module.exports = securityMiddleware;
module.exports.sanitizeRequestForLogging = sanitizeRequestForLogging;