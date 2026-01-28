const express = require('express');
const db = require('../db');
const router = express.Router();

// Like post
router.post('/:postId/like', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    // Check if already liked
    const isLiked = await db.isPostLiked(userId, parseInt(postId));

    if (isLiked) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_LIKED', message: 'You already liked this post' }
      });
    }

    // Create like
    await db.likePost(userId, parseInt(postId));

    res.status(201).json({
      success: true,
      data: {
        post_id: postId,
        liked: true
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Unlike post
router.delete('/:postId/like', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    await db.unlikePost(userId, parseInt(postId));

    res.json({
      success: true,
      data: {
        post_id: postId,
        liked: false
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get post likes
router.get('/:postId/likes', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const allLikes = [];
    // Likes tracking would go here
    const paginatedLikes = allLikes.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        likes: paginatedLikes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allLikes.length
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

module.exports = router;
