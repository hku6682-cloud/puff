const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Admin middleware - check if user is admin
const isAdmin = (req, res, next) => {
  // Get user from database to check admin status
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }
  
  // This will be checked in the route handlers
  next();
};

// Get all users with details (Admin Only)
router.get('/admin/dashboard/users', isAdmin, async (req, res) => {
  try {
    // Check if current user is admin
    const currentUser = await db.getUserById(req.user.userId);
    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const users = await db.getAllUsers();
    
    // Include password hash and admin info
    const usersWithDetails = users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      phone: user.phone,
      password_hash: user.password_hash, // Include for admin view
      is_admin: user.is_admin,
      is_active: user.is_active,
      post_count: user.post_count,
      follower_count: user.follower_count,
      following_count: user.following_count,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    res.json({
      success: true,
      data: {
        total_users: usersWithDetails.length,
        active_users: usersWithDetails.filter(u => u.is_active).length,
        users: usersWithDetails
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get all users (for discovery)
router.get('/list/all', async (req, res) => {
  try {
    const users = await db.getAllUsers();

    res.json({
      success: true,
      data: {
        users: users.filter(u => u.id !== req.user?.userId) // Exclude current user
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await db.getUserById(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get current user
router.get('/me/profile', async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await db.getUserById(userId);

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Update profile
router.put('/me/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { display_name, bio, profile_photo_url } = req.body;

    const user = await db.getUserById(userId);
    if (user) {
      user.display_name = display_name || user.display_name;
      user.bio = bio || user.bio;
      user.profile_photo_url = profile_photo_url || user.profile_photo_url;
      user.updated_at = new Date().toISOString();
      await db.updateUser(userId, user);
    }

    res.json({
      success: true,
      data: { message: 'Profile updated' }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get user posts
router.get('/:userId/posts', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await db.getUserPosts(parseInt(userId), parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        posts: posts || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: posts?.length || 0,
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

// Get user followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await db.getFollowers(parseInt(userId));

    res.json({
      success: true,
      data: {
        followers: followers || []
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get user following
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await db.getFollowing(parseInt(userId));

    res.json({
      success: true,
      data: {
        following: following || []
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Follow user
router.post('/:userId/follow', async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userId } = req.params;

    if (parseInt(followerId) === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Cannot follow yourself' }
      });
    }

    await db.followUser(followerId, parseInt(userId));

    res.status(201).json({
      success: true,
      data: {
        user_id: userId,
        following: true
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Unfollow user
router.delete('/:userId/follow', async (req, res) => {
  try {
    const followerId = req.user.userId;
    const { userId } = req.params;

    await db.unfollowUser(followerId, parseInt(userId));

    res.json({
      success: true,
      data: {
        user_id: userId,
        following: false
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get post details with likes and comments
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await db.getPostById(parseInt(postId));

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' }
      });
    }

    const user = await db.getUserById(post.user_id);
    const likers = await db.getLikers(post.id);
    const comments = await db.getComments(post.id);
    const isLiked = req.user ? await db.isPostLiked(req.user.userId, post.id) : false;

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          },
          likers,
          comments,
          isLiked,
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

// Add comment to post
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Comment text is required' }
      });
    }

    const post = await db.getPostById(parseInt(postId));
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' }
      });
    }

    const comment = await db.createComment(userId, parseInt(postId), text);
    const user = await db.getUserById(userId);

    res.json({
      success: true,
      data: {
        comment: {
          ...comment,
          user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          }
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

// Get comments for a post
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await db.getComments(parseInt(postId));

    res.json({
      success: true,
      data: { comments }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get likers for a post
router.get('/posts/:postId/likers', async (req, res) => {
  try {
    const { postId } = req.params;
    const likers = await db.getLikers(parseInt(postId));

    res.json({
      success: true,
      data: { likers }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Search for users by username, display name, or email
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }

    const users = await db.searchUsers(q.trim(), parseInt(limit));

    res.json({
      success: true,
      data: { users: users || [] }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get suggested users (admin-curated list)
router.get('/suggested', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const suggestedUsers = await db.getSuggestedUsers(userId);

    res.json({
      success: true,
      data: { users: suggestedUsers || [] }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get onboarding status
router.get('/onboarding/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        onboarding_completed: user.onboarding_completed,
        following_count: user.following_count,
        required_follows: 5
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Complete onboarding
router.post('/onboarding/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Check if user has followed at least 5 people
    if (user.following_count < 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: `You must follow at least 5 people. Currently following ${user.following_count}.` }
      });
    }

    // Mark onboarding as complete
    await db.completeOnboarding(userId);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboarding_completed: true
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get suggested posts for onboarding
router.get('/onboarding/suggested-posts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    const suggestedPosts = await db.getSuggestedPostsForOnboarding(userId, limit);

    res.json({
      success: true,
      data: { posts: suggestedPosts }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

module.exports = router;
