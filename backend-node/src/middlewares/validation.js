/**
 * @fileoverview Enhanced validation middleware
 * @description Comprehensive input validation and sanitization
 */

const { body, validationResult } = require('express-validator');

/**
 * Enhanced password validation with complexity requirements
 */
const validatePassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

/**
 * Enhanced registration validation
 */
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Please provide a valid email address'),
  ...validatePassword
];

/**
 * Login validation
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password too long')
];

/**
 * Flow creation validation
 */
const validateFlowCreation = [
  body('founder_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Founder name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-'.]+$/)
    .withMessage('Founder name contains invalid characters')
    .escape(),
  body('company_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s&.\-']+$/)
    .withMessage('Company name contains invalid characters')
    .escape(),
  body('interview_transcript')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('Interview transcript must be between 10 and 10,000 characters')
    .escape(),
  body('tone')
    .isIn(['Professional', 'Casual', 'Friendly', 'Technical', 'Enthusiastic'])
    .withMessage('Invalid tone selected')
];

/**
 * Version selection validation
 */
const validateVersionSelection = [
  body('runId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid run ID')
    .escape(),
  body('selectedVersionRunId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid version run ID')
    .escape(),
  body('workbookId')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid workbook ID')
    .escape()
];

/**
 * Validation result handler middleware
 * Returns validation errors if any exist
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateFlowCreation,
  validateVersionSelection,
  handleValidationErrors
};