const express = require('express');
const postService = require('../services/postService');
const router = express.Router();

// Create post
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { caption, image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Image URL required' }
      });
    }

    const post = await postService.createPost(userId, caption, image_url);

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await postService.getPostById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' }
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get feed
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await postService.getFeed(userId, limit, offset);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
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

// Update post
router.put('/:postId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { caption } = req.body;

    // Check ownership
    const post = await db.getPost(parseInt(postId));

    if (!post || post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to update this post' }
      });
    }

    const updatedPost = await postService.updatePost(postId, caption);

    res.json({
      success: true,
      data: updatedPost
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;

    // Check ownership
    const post = await db.getPost(parseInt(postId));

    if (!post || post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this post' }
      });
    }

    await postService.deletePost(postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get discover feed - ranked by reach algorithm
router.get('/discover/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const db = require('../db');

    const posts = await db.getDiscoverFeed(parseInt(limit), parseInt(offset));

    // Enrich with user data
    const enrichedPosts = posts.map(post => {
      const user = db.users?.get?.(post.user_id) || users.get(post.user_id);
      return {
        ...post,
        user: user ? {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          profile_photo_url: user.profile_photo_url,
          follower_count: user.follower_count,
        } : null,
      };
    });

    res.json({
      success: true,
      data: {
        posts: enrichedPosts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
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

// Save post interest (interested / not interested)
router.post('/:postId/interest', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { postId } = req.params;
    const { interested } = req.body;

    if (interested === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'interested field is required' }
      });
    }

    const db = require('../db');
    await db.savePostInterest(userId, postId, interested);

    res.json({
      success: true,
      message: `Marked post as ${interested ? 'interested' : 'not interested'}`,
      data: {
        post_id: postId,
        interested
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
