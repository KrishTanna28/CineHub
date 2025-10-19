import { body, validationResult } from 'express-validator';

// Validation middleware to check for errors
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Registration validation rules
export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters')
];

// Login validation rules
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Update profile validation rules
export const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Change password validation rules
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Movie ID validation
export const movieIdValidation = [
  body('movieId')
    .notEmpty()
    .withMessage('Movie ID is required')
    .isString()
    .withMessage('Movie ID must be a string')
];

// Rating validation
export const ratingValidation = [
  body('movieId')
    .notEmpty()
    .withMessage('Movie ID is required'),
  
  body('rating')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10')
];
