const db = require('../db');

const postService = {
  // Create post
  createPost: async (userId, caption, imageUrl) => {
    return await db.createPost(userId, caption, imageUrl);
  },

  // Get post by ID
  getPostById: async (postId) => {
    return await db.getPostById(parseInt(postId));
  },

  // Get user's posts
  getUserPosts: async (userId, limit = 20, offset = 0) => {
    return await db.getUserPosts(userId, limit, offset);
  },

  // Get feed
  getFeed: async (userId, limit = 20, offset = 0) => {
    return await db.getFeed(userId, limit, offset);
  },

  // Update post
  updatePost: async (postId, caption) => {
    if (db.updatePost) {
      return await db.updatePost(postId, caption);
    }
    const post = await db.getPost(postId);
    if (post) {
      post.caption = caption;
      post.updated_at = new Date().toISOString();
      posts.set(postId, post);
      return post;
    }
    return null;
  },

  // Delete post
  deletePost: async (postId) => {
    if (db.deletePost) {
      return await db.deletePost(postId);
    }
    return null;
  },

  // Update like count
  updateLikeCount: async (postId) => {
    // No-op for mock database
    return true;
  }
};

module.exports = postService;
