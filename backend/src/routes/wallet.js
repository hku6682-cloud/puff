const express = require('express');
const db = require('../db');
const router = express.Router();

// Get wallet
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const wallet = await db.getWallet(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wallet not found' }
      });
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;

    const transactions = [];
    // Transaction history placeholder for mock database

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: 1,
          limit: 20,
          total: 0
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get earning rules
router.get('/rules', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        rules: {
          minimum_likes_to_earn: 500,
          earning_per_like: 0.30,
          earning_cap_per_post: 1000.00,
          daily_earning_limit: 5000.00,
          minimum_account_age_days: 7,
          minimum_posts_before_earning: 1,
          minimum_followers_for_multiplier: 100,
          verified_user_multiplier: 1.5
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Add coins (for testing/admin)
router.post('/add-coins', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid amount' }
      });
    }

    // Update wallet
    const wallet = await db.addCoins(userId, parseInt(amount));

    res.json({
      success: true,
      data: {
        balance_coins: wallet.balance_coins,
        amount_added: amount
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Request withdrawal
router.post('/request-withdrawal', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, upi_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid amount' }
      });
    }

    if (!upi_id || upi_id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'UPI ID is required' }
      });
    }

    const result = await db.requestWithdrawal(userId, amount, upi_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'WITHDRAWAL_ERROR', message: result.error }
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get user's withdrawal requests
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.userId;

    const withdrawals = await db.getUserWithdrawalRequests(userId);

    res.json({
      success: true,
      data: { withdrawals }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get all withdrawal requests (Admin only)
router.get('/admin/withdrawal-requests', async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);

    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const requests = await db.getWithdrawalRequests();

    res.json({
      success: true,
      data: { requests }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Approve withdrawal request (Admin only)
router.put('/admin/withdrawal-requests/:requestId/approve', async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);

    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const { requestId } = req.params;
    const { notes } = req.body;

    const result = await db.approveWithdrawal(parseInt(requestId), notes || '');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_ERROR', message: result.error }
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Reject withdrawal request (Admin only)
router.put('/admin/withdrawal-requests/:requestId/reject', async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);

    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const { requestId } = req.params;
    const { notes } = req.body;

    const result = await db.rejectWithdrawal(parseInt(requestId), notes || '');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_ERROR', message: result.error }
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Complete withdrawal (Admin only) - mark as completed after transferring money
router.put('/admin/withdrawal-requests/:requestId/complete', async (req, res) => {
  try {
    const user = await db.getUserById(req.user.userId);

    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const { requestId } = req.params;

    const result = await db.completeWithdrawal(parseInt(requestId));

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'REQUEST_ERROR', message: result.error }
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

module.exports = router;
