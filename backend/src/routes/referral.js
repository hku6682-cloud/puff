const express = require('express');
const db = require('../db');
const router = express.Router();

// Get user's referral code
router.get('/code', async (req, res) => {
  try {
    const userId = req.user.userId;
    const codeData = await db.getUserReferralCode(userId);
    
    if (!codeData) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Referral code not found' }
      });
    }

    res.json({
      success: true,
      data: {
        referral_code: codeData.code,
        referral_link: `http://localhost:5173/signup?ref=${codeData.code}`,
        usage_count: codeData.usageCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get referral statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await db.getReferralStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const validation = await db.validateReferralCode(code);

    res.json({
      success: true,
      data: validation
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

module.exports = router;
