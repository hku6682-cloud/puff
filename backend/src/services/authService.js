const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const authService = {
  // Hash password
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  // Compare password
  comparePassword: async (password, hash) => {
    return bcrypt.compare(password, hash);
  },

  // Generate tokens
  generateTokens: (userId) => {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  },

  // Create user
  createUser: async (email, username, passwordHash, phone = null, referralCode = null) => {
    // Support both mock and real database
    if (db.createUser) {
      return await db.createUser(email, username, passwordHash, phone, referralCode);
    }
    
    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username`,
      [email, username, passwordHash, phone]
    );
    return result.rows[0];
  },

  // Get user by email
  getUserByEmail: async (email) => {
    // Support both mock and real database
    if (db.getUserByEmail) {
      return await db.getUserByEmail(email);
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  // Get user by username
  getUserByUsername: async (username) => {
    // Support both mock and real database
    if (db.getUserByUsername) {
      return await db.getUserByUsername(username);
    }

    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  },

  // Get user by ID
  getUserById: async (id) => {
    // Support both mock and real database
    if (db.getUserById) {
      return await db.getUserById(id);
    }

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Update last login
  updateLastLogin: async (userId) => {
    if (db.updateLastLogin) {
      return await db.updateLastLogin(userId);
    }
    // For real database fallback
    if (!db.isMock && typeof db.query === 'function') {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    }
  }
};

module.exports = authService;
