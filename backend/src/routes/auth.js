const express = require('express');
const authService = require('../services/authService');
const db = require('../db');
const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, phone, referral_code } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' }
      });
    }

    // Validate referral code if provided
    if (referral_code) {
      const codeValidation = await db.validateReferralCode(referral_code);
      if (!codeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REFERRAL', message: 'Invalid referral code' }
        });
      }
    }

    // Check if user exists
    const existing = await authService.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Email already registered' }
      });
    }

    // Check username
    const existingUsername = await authService.getUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_USERNAME', message: 'Username already taken' }
      });
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user with referral code
    const user = await authService.createUser(email, username, passwordHash, phone, referral_code);

    // Skip database wallet creation for mock DB (it's auto-created)
    // Only for real PostgreSQL
    if (!db.isMock) {
      try {
        // Create user_info
        await db.query(
          `INSERT INTO user_info (user_id, display_name) VALUES ($1, $2)`,
          [user.id, username]
        );

        // Create wallet
        await db.query(
          `INSERT INTO wallet (user_id) VALUES ($1)`,
          [user.id]
        );
      } catch (err) {
        console.warn('Could not create user_info or wallet:', err.message);
      }
    }
    // For mock database, wallet and user_info are auto-created

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user.id);

    res.status(201).json({
      success: true,
      data: {
        user_id: user.id,
        email: user.email,
        username: user.username,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing email or password' }
      });
    }

    const user = await authService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }

    const isMatch = await authService.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }

    // Update last login
    await authService.updateLastLogin(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user.id);

    res.json({
      success: true,
      data: {
        user_id: user.id,
        username: user.username,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Refresh token required' }
      });
    }

    const decoded = require('jsonwebtoken').verify(
      refresh_token,
      process.env.JWT_SECRET || 'test-secret-key'
    );

    const { accessToken, refreshToken } = authService.generateTokens(decoded.userId);

    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 900
      }
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' }
    });
  }
});

// Forgot Password - Request Reset Token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
    }

    const user = await authService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({
        success: true,
        message: 'If an account with that email exists, you will receive password reset instructions.'
      });
    }

    // Create password reset token
    const resetToken = await db.createPasswordResetToken(user.id);

    // In production, send email with reset link
    // For now, return token (in real app, this would be sent via email)
    // Reset link format: http://localhost:5173/reset-password?token=RESET_TOKEN
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      resetToken // In development only - remove in production
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token and new password are required' }
      });
    }

    // Verify token
    const userId = await db.verifyPasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Password reset token is invalid or expired' }
      });
    }

    // Hash new password
    const passwordHash = await authService.hashPassword(newPassword);

    // Reset password
    const success = await db.resetPassword(token, passwordHash);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: { code: 'RESET_FAILED', message: 'Failed to reset password' }
      });
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

module.exports = router;
