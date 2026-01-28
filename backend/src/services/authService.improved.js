const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ⚠️ CRITICAL: Never use hardcoded secrets in production
// These must come from environment variables
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  // Validation for development vs production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!secret || secret === 'test-secret-key') {
    if (isProduction) {
      throw new Error('❌ CRITICAL: JWT_SECRET is not properly configured for production');
    }
    console.warn('⚠️  WARNING: Using default secret key (development only)');
    return 'test-secret-key'; // Only for development
  }
  
  if (secret.length < 32) {
    const message = `JWT_SECRET must be at least 32 characters (currently ${secret.length})`;
    if (isProduction) {
      throw new Error(`❌ CRITICAL: ${message}`);
    }
    console.warn(`⚠️  WARNING: ${message}`);
  }
  
  return secret;
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!secret || secret === 'test-secret-key') {
    if (isProduction) {
      throw new Error('❌ CRITICAL: JWT_REFRESH_SECRET is not properly configured for production');
    }
    console.warn('⚠️  WARNING: Using default refresh secret (development only)');
    return 'test-secret-key'; // Only for development
  }
  
  return secret;
};

const authService = {
  // Generate access token
  generateAccessToken: (user) => {
    try {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          type: 'access',
        },
        getJWTSecret(),
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '15m',
          algorithm: 'HS256',
        }
      );
      return token;
    } catch (err) {
      console.error('Error generating access token:', err.message);
      throw new Error('Failed to generate access token');
    }
  },

  // Generate refresh token
  generateRefreshToken: (user) => {
    try {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: 'refresh',
        },
        getRefreshSecret(),
        { 
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
          algorithm: 'HS256',
        }
      );
      return token;
    } catch (err) {
      console.error('Error generating refresh token:', err.message);
      throw new Error('Failed to generate refresh token');
    }
  },

  // Verify access token
  verifyAccessToken: (token) => {
    try {
      const decoded = jwt.verify(token, getJWTSecret());
      
      // Ensure token type is correct
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw err;
    }
  },

  // Verify refresh token
  verifyRefreshToken: (token) => {
    try {
      const decoded = jwt.verify(token, getRefreshSecret());
      
      // Ensure token type is correct
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw err;
    }
  },

  // Hash password
  hashPassword: async (password) => {
    const saltRounds = parseInt(process.env.PASSWORD_HASH_ROUNDS || '10');
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (err) {
      console.error('Error hashing password:', err.message);
      throw new Error('Failed to hash password');
    }
  },

  // Compare password
  comparePassword: async (plainPassword, hashedPassword) => {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (err) {
      console.error('Error comparing password:', err.message);
      return false;
    }
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    const errors = [];
    
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    
    if (process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false') {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
    }
    
    if (process.env.PASSWORD_REQUIRE_NUMBERS !== 'false') {
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }
    }
    
    if (process.env.PASSWORD_REQUIRE_SPECIAL !== 'false') {
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Create user (database operation)
  createUser: async (db, email, username, passwordHash, phone, referralCode = null) => {
    // Support both mock and real database
    if (db.createUser) {
      return await db.createUser(email, username, passwordHash, phone, referralCode);
    }
    // Fallback for real database
    throw new Error('Database method not implemented');
  },

  // Get user by email
  getUserByEmail: async (db, email) => {
    if (db.getUserByEmail) {
      return await db.getUserByEmail(email);
    }
    throw new Error('Database method not implemented');
  },

  // Get user by username
  getUserByUsername: async (db, username) => {
    if (db.getUserByUsername) {
      return await db.getUserByUsername(username);
    }
    throw new Error('Database method not implemented');
  },

  // Get user by ID
  getUserById: async (db, userId) => {
    if (db.getUser) {
      return await db.getUser(userId);
    }
    throw new Error('Database method not implemented');
  },
};

module.exports = authService;
