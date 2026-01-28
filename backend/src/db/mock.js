// Mock database for testing without PostgreSQL
// In production, replace this with real PostgreSQL connection

const users = new Map();
const posts = new Map();
const likes = new Map();
const comments = new Map();
const wallets = new Map();
const followers = new Map();
const notifications = new Map();
const rewardMilestones = new Map(); // Track which milestones a post has reached
const suggestedUsers = new Map(); // Admin-curated suggested users (adminId -> [userIds])
const postViews = new Map(); // Track post views for engagement rate (postId -> viewCount)
const withdrawalRequests = new Map(); // Withdrawal requests (id -> request data)
const passwordResetTokens = new Map(); // Password reset tokens (token -> {userId, expiresAt})
const referralCodes = new Map(); // Referral codes (code -> {userId, createdAt, usageCount})
const referrals = new Map(); // Referral tracking (id -> {referrerId, referredUserId, status, earnedAmount, createdAt})
const postInterests = new Map(); // Post interests (userId_postId -> {userId, postId, interested: true/false, createdAt})

let userIdCounter = 1;
let postIdCounter = 1;
let likeIdCounter = 1;
let commentIdCounter = 1;
let notificationIdCounter = 1;
let withdrawalRequestIdCounter = 1;
let referralIdCounter = 1;

const mockDb = {
  isMock: true, // Flag to identify mock database
  
  // User operations
  createUser: async (email, username, passwordHash, phone, referralCode = null) => {
    const id = userIdCounter++;
    const user = {
      id,
      email,
      username,
      password_hash: passwordHash,
      phone,
      display_name: username,
      bio: '',
      profile_photo_url: '',
      post_count: 0,
      follower_count: 0,
      following_count: 0,
      is_admin: false,
      is_active: true,
      referral_code: mockDb.generateReferralCode(),
      referred_by: null,
      onboarding_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Track referral if code provided
    if (referralCode) {
      const referrerCode = referralCodes.get(referralCode);
      if (referrerCode) {
        user.referred_by = referrerCode.userId;
        // Track the referral
        const referralId = referralIdCounter++;
        referrals.set(referralId, {
          id: referralId,
          referrer_id: referrerCode.userId,
          referred_user_id: id,
          status: 'completed',
          earned_amount: 50, // Rs. 50 bonus for successful referral
          created_at: new Date(),
        });
        // Update referrer wallet
        const referrerWallet = wallets.get(referrerCode.userId);
        if (referrerWallet) {
          referrerWallet.balance_coins += 50;
          referrerWallet.total_earned += 50;
        }
        // Increment usage count
        referrerCode.usageCount = (referrerCode.usageCount || 0) + 1;
      }
    }
    
    users.set(id, user);
    // Create wallet for new user
    wallets.set(id, {
      id,
      user_id: id,
      balance_coins: 0,
      total_earned: 0,
      total_withdrawn: 0,
    });
    return user;
  },

  getUserByEmail: async (email) => {
    for (const user of users.values()) {
      if (user.email === email) return user;
    }
    return null;
  },

  getUserByUsername: async (username) => {
    for (const user of users.values()) {
      if (user.username === username) return user;
    }
    return null;
  },

  getUserById: async (id) => {
    const user = users.get(id);
    if (!user) return null;
    
    // Count posts
    let postCount = 0;
    posts.forEach(p => {
      if (p.user_id === id) postCount++;
    });
    
    // Count followers
    let followerCount = 0;
    followers.forEach((v, k) => {
      if (k.endsWith(`-${id}`)) followerCount++;
    });
    
    // Count following
    let followingCount = 0;
    followers.forEach((v, k) => {
      if (k.startsWith(`${id}-`)) followingCount++;
    });
    
    return {
      ...user,
      post_count: postCount,
      follower_count: followerCount,
      following_count: followingCount,
    };
  },

  getAllUsers: async () => {
    return Array.from(users.values()).map(user => {
      // Count followers (entries where user.id is the followed person)
      let followerCount = 0;
      followers.forEach((v, k) => {
        if (k.endsWith(`-${user.id}`)) followerCount++;
      });
      
      // Count following (entries where user.id is the follower)
      let followingCount = 0;
      followers.forEach((v, k) => {
        if (k.startsWith(`${user.id}-`)) followingCount++;
      });
      
      return {
        ...user,
        follower_count: followerCount,
        following_count: followingCount,
      };
    });
  },
  createPost: async (userId, caption, imageUrl) => {
    const id = postIdCounter++;
    const post = {
      id,
      user_id: userId,
      caption,
      image_url: imageUrl,
      created_at: new Date(),
      like_count: 0,
      view_count: 1,
    };
    posts.set(id, post);
    
    // Update user's post count
    const user = users.get(userId);
    if (user) {
      user.post_count = (user.post_count || 0) + 1;
      users.set(userId, user);
    }
    
    return post;
  },

  getPost: async (id) => {
    return posts.get(id) || null;
  },

  getAllPosts: async () => {
    // Return posts sorted by creation date (for profile/admin views)
    return Array.from(posts.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  },

  getAllPostsRanked: async (limit = 20, offset = 0) => {
    // Return posts ranked by reach algorithm (for discover/public feed)
    return mockDb.getDiscoverFeed(limit, offset);
  },

  updatePost: async (id, caption) => {
    const post = posts.get(id);
    if (post) {
      post.caption = caption;
      posts.set(id, post);
      return post;
    }
    return null;
  },

  deletePost: async (id) => {
    return posts.delete(id);
  },

  // Like operations
  likePost: async (userId, postId) => {
    const key = `${userId}-${postId}`;
    if (!likes.has(key)) {
      const post = posts.get(postId);
      if (post) {
        post.like_count += 1;
        posts.set(postId, post);
        
        // Check if post reached 500 likes milestone
        if (post.like_count === 500 && !rewardMilestones.has(`${postId}-500`)) {
          // Mark milestone as reached
          rewardMilestones.set(`${postId}-500`, true);
          
          // Add coins to user wallet
          const wallet = wallets.get(post.user_id);
          if (wallet) {
            const reward = 20; // Rs. 20 for 500 likes
            wallet.balance_coins += reward;
            wallet.total_earned += reward;
            wallets.set(post.user_id, wallet);
            
            // Create notification for the milestone
            const notifId = notificationIdCounter++;
            notifications.set(notifId, {
              id: notifId,
              user_id: post.user_id,
              type: 'milestone_earned',
              title: '🎉 Milestone Reached!',
              message: `Your post reached 500 likes! You earned Rs. 20`,
              related_post_id: postId,
              is_read: false,
              created_at: new Date(),
            });
          }
        }
      }
      likes.set(key, { user_id: userId, post_id: postId });
      
      // Create "like" notification for post owner
      const post2 = posts.get(postId);
      if (post2) {
        const notifId = notificationIdCounter++;
        notifications.set(notifId, {
          id: notifId,
          user_id: post2.user_id,
          type: 'like',
          title: '❤️ Someone liked your post',
          message: `Your post received a new like!`,
          related_user_id: userId,
          related_post_id: postId,
          is_read: false,
          created_at: new Date(),
        });
      }
      
      return true;
    }
    return false;
  },

  unlikePost: async (userId, postId) => {
    const key = `${userId}-${postId}`;
    if (likes.has(key)) {
      const post = posts.get(postId);
      if (post && post.like_count > 0) {
        post.like_count -= 1;
        posts.set(postId, post);
      }
      likes.delete(key);
      return true;
    }
    return false;
  },

  isPostLiked: async (userId, postId) => {
    return likes.has(`${userId}-${postId}`);
  },

  // Comment operations
  createComment: async (userId, postId, text) => {
    const id = commentIdCounter++;
    const comment = {
      id,
      user_id: userId,
      post_id: postId,
      text,
      created_at: new Date(),
    };
    comments.set(id, comment);
    return comment;
  },

  getComments: async (postId) => {
    const postComments = [];
    comments.forEach((comment) => {
      if (comment.post_id === postId) {
        const user = users.get(comment.user_id);
        postComments.push({
          id: comment.id,
          user_id: comment.user_id,
          post_id: comment.post_id,
          text: comment.text,
          created_at: comment.created_at,
          user: user ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          } : null,
        });
      }
    });
    return postComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  },

  deleteComment: async (commentId) => {
    return comments.delete(commentId);
  },

  getLikers: async (postId) => {
    const likers = [];
    likes.forEach((v, k) => {
      const [userId, likedPostId] = k.split('-');
      if (parseInt(likedPostId) === postId) {
        const user = users.get(parseInt(userId));
        if (user) {
          likers.push({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          });
        }
      }
    });
    return likers;
  },

  // Wallet operations
  getWallet: async (userId) => {
    return wallets.get(userId) || null;
  },

  addCoins: async (userId, amount) => {
    const wallet = wallets.get(userId);
    if (wallet) {
      wallet.balance_coins += amount;
      wallet.total_earned += amount;
      wallets.set(userId, wallet);
      return wallet;
    }
    return null;
  },

  // Withdrawal operations
  requestWithdrawal: async (userId, amount, upiId) => {
    const wallet = await mockDb.getWallet(userId);
    
    // Validate withdrawal request
    if (!wallet || wallet.balance_coins < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    if (amount < 20) {
      return { success: false, error: 'Minimum withdrawal is Rs. 20' };
    }
    
    if (!upiId || upiId.trim().length === 0) {
      return { success: false, error: 'UPI ID is required' };
    }
    
    const user = users.get(userId);
    const requestId = withdrawalRequestIdCounter++;
    
    const withdrawalRequest = {
      id: requestId,
      user_id: userId,
      username: user.username,
      display_name: user.display_name,
      amount: amount,
      upi_id: upiId,
      status: 'pending', // pending, approved, rejected, completed
      available_balance: wallet.balance_coins,
      created_at: new Date(),
      updated_at: new Date(),
      notes: '',
    };
    
    withdrawalRequests.set(requestId, withdrawalRequest);
    
    // Create notification for admin
    const adminUsers = Array.from(users.values()).filter(u => u.is_admin);
    adminUsers.forEach(admin => {
      const notifId = notificationIdCounter++;
      notifications.set(notifId, {
        id: notifId,
        user_id: admin.id,
        type: 'withdrawal_request',
        title: '💰 Withdrawal Request',
        message: `${user.display_name} requested withdrawal of Rs. ${amount}`,
        related_user_id: userId,
        withdrawal_request_id: requestId,
        is_read: false,
        created_at: new Date(),
      });
    });
    
    return {
      success: true,
      data: withdrawalRequest,
    };
  },

  getWithdrawalRequests: async (filters = {}) => {
    const allRequests = Array.from(withdrawalRequests.values());
    
    // Filter by status if provided
    if (filters.status) {
      return allRequests.filter(r => r.status === filters.status);
    }
    
    // Return all requests sorted by date (newest first)
    return allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getWithdrawalRequest: async (requestId) => {
    return withdrawalRequests.get(requestId) || null;
  },

  getUserWithdrawalRequests: async (userId) => {
    return Array.from(withdrawalRequests.values())
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  approveWithdrawal: async (requestId, notes = '') => {
    const request = withdrawalRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Withdrawal request not found' };
    }
    
    if (request.status !== 'pending') {
      return { success: false, error: 'Can only approve pending requests' };
    }
    
    request.status = 'approved';
    request.notes = notes;
    request.updated_at = new Date();
    withdrawalRequests.set(requestId, request);
    
    // Create notification for user
    const notifId = notificationIdCounter++;
    notifications.set(notifId, {
      id: notifId,
      user_id: request.user_id,
      type: 'withdrawal_approved',
      title: '✅ Withdrawal Approved',
      message: `Your withdrawal request of Rs. ${request.amount} has been approved. Amount will be transferred to ${request.upi_id}`,
      related_user_id: null,
      is_read: false,
      created_at: new Date(),
    });
    
    return { success: true, data: request };
  },

  rejectWithdrawal: async (requestId, notes = '') => {
    const request = withdrawalRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Withdrawal request not found' };
    }
    
    if (request.status !== 'pending') {
      return { success: false, error: 'Can only reject pending requests' };
    }
    
    request.status = 'rejected';
    request.notes = notes;
    request.updated_at = new Date();
    withdrawalRequests.set(requestId, request);
    
    // Create notification for user
    const notifId = notificationIdCounter++;
    notifications.set(notifId, {
      id: notifId,
      user_id: request.user_id,
      type: 'withdrawal_rejected',
      title: '❌ Withdrawal Rejected',
      message: `Your withdrawal request of Rs. ${request.amount} has been rejected. Your balance remains intact.`,
      related_user_id: null,
      is_read: false,
      created_at: new Date(),
    });
    
    return { success: true, data: request };
  },

  completeWithdrawal: async (requestId) => {
    const request = withdrawalRequests.get(requestId);
    if (!request) {
      return { success: false, error: 'Withdrawal request not found' };
    }
    
    if (request.status !== 'approved') {
      return { success: false, error: 'Can only complete approved requests' };
    }
    
    // Deduct amount from wallet
    const wallet = await mockDb.getWallet(request.user_id);
    if (wallet) {
      wallet.balance_coins -= request.amount;
      wallet.total_withdrawn = (wallet.total_withdrawn || 0) + request.amount;
      wallets.set(request.user_id, wallet);
    }
    
    request.status = 'completed';
    request.updated_at = new Date();
    withdrawalRequests.set(requestId, request);
    
    // Create notification for user
    const notifId = notificationIdCounter++;
    notifications.set(notifId, {
      id: notifId,
      user_id: request.user_id,
      type: 'withdrawal_completed',
      title: '🎉 Withdrawal Completed',
      message: `Rs. ${request.amount} has been transferred to your UPI ID ${request.upi_id}`,
      related_user_id: null,
      is_read: false,
      created_at: new Date(),
    });
    
    return { success: true, data: request };
  },

  // Follow operations
  followUser: async (followerId, followingId) => {
    const key = `${followerId}-${followingId}`;
    if (!followers.has(key) && followerId !== followingId) {
      followers.set(key, true);
      
      // Create notification for new follower
      const follower = users.get(followerId);
      const notifId = notificationIdCounter++;
      notifications.set(notifId, {
        id: notifId,
        user_id: followingId,
        type: 'follow',
        title: '👥 New follower!',
        message: `${follower?.display_name || follower?.username || 'Someone'} started following you!`,
        related_user_id: followerId,
        is_read: false,
        created_at: new Date(),
      });
      
      return true;
    }
    return false;
  },

  unfollowUser: async (followerId, followingId) => {
    const key = `${followerId}-${followingId}`;
    if (followers.has(key)) {
      followers.delete(key);
      return true;
    }
    return false;
  },

  isFollowing: async (followerId, followingId) => {
    return followers.has(`${followerId}-${followingId}`);
  },

  getFollowers: async (userId) => {
    const followersList = [];
    followers.forEach((v, k) => {
      if (k.endsWith(`-${userId}`)) {
        const followerId = parseInt(k.split('-')[0]);
        const user = users.get(followerId);
        if (user) {
          followersList.push({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          });
        }
      }
    });
    return followersList;
  },

  getFollowing: async (userId) => {
    const followingList = [];
    followers.forEach((v, k) => {
      if (k.startsWith(`${userId}-`)) {
        const followingId = parseInt(k.split('-')[1]);
        const user = users.get(followingId);
        if (user) {
          followingList.push({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          });
        }
      }
    });
    return followingList;
  },

  updateLastLogin: async (userId) => {
    const user = users.get(userId);
    if (user) {
      user.last_login = new Date().toISOString();
      users.set(userId, user);
      return user;
    }
    return null;
  },

  updateUser: async (userId, userData) => {
    const user = users.get(userId);
    if (user) {
      Object.assign(user, userData);
      users.set(userId, user);
      return user;
    }
    return null;
  },

  getPostById: async (id) => {
    return posts.get(id) || null;
  },

  getUserPosts: async (userId, limit = 20, offset = 0) => {
    const userPosts = Array.from(posts.values())
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit);
    return userPosts;
  },

  getFeed: async (userId, limit = 20, offset = 0) => {
    // Get users that this user follows
    const following = new Set();
    followers.forEach((v, k) => {
      const [follower, followee] = k.split('-');
      if (parseInt(follower) === userId) {
        following.add(parseInt(followee));
      }
    });

    // Get posts from followed users with advanced ranking
    const feedPosts = Array.from(posts.values())
      .filter(p => following.has(p.user_id))
      .map(post => {
        const user = users.get(post.user_id);
        const authorFollowers = user?.follower_count || 0;
        const scoreData = mockDb.calculatePostScore(post, authorFollowers);
        
        return {
          ...post,
          score: scoreData.score,
          user: user ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_photo_url: user.profile_photo_url,
          } : null,
        };
      })
      // Sort by score (advanced ranking)
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit)
      // Remove score from frontend response
      .map(({ score, ...post }) => post);
    
    return feedPosts;
  },

  query: async (text, params) => {
    // Mock query response
    return { rows: [], rowCount: 0 };
  },

  getClient: async () => {
    return {
      query: async (text, params) => ({ rows: [], rowCount: 0 }),
      release: () => {},
    };
  },

  // Notification operations
  getNotifications: async (userId) => {
    const userNotifications = [];
    notifications.forEach((notif) => {
      if (notif.user_id === userId) {
        userNotifications.push(notif);
      }
    });
    return userNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getUnreadNotificationCount: async (userId) => {
    let count = 0;
    notifications.forEach((notif) => {
      if (notif.user_id === userId && !notif.is_read) {
        count++;
      }
    });
    return count;
  },

  markNotificationAsRead: async (notificationId) => {
    const notif = notifications.get(notificationId);
    if (notif) {
      notif.is_read = true;
      notifications.set(notificationId, notif);
      return notif;
    }
    return null;
  },

  markAllNotificationsAsRead: async (userId) => {
    let count = 0;
    notifications.forEach((notif) => {
      if (notif.user_id === userId && !notif.is_read) {
        notif.is_read = true;
        notifications.set(notif.id, notif);
        count++;
      }
    });
    return count;
  },

  deleteNotification: async (notificationId) => {
    return notifications.delete(notificationId);
  },

  // ===== REACH & RANKING ALGORITHM =====
  // Calculate post reach score based on engagement, recency, follower boost, and velocity
  
  calculatePostScore: (post, authorFollowerCount = 0) => {
    const now = new Date();
    const postAge = now - new Date(post.created_at); // milliseconds
    const hoursOld = postAge / (1000 * 60 * 60);
    
    // Count comments for this post
    let commentCount = 0;
    comments.forEach((comment) => {
      if (comment.post_id === post.id) commentCount++;
    });
    
    // 1. ENGAGEMENT SCORE
    // Likes: 1x, Comments: 2x, higher engagement = higher reach
    const engagementScore = (post.like_count || 0) * 1 + commentCount * 2;
    
    // 2. RECENCY MULTIPLIER (time decay)
    let recencyMultiplier = 1.0;
    if (hoursOld < 1) {
      recencyMultiplier = 1.0; // First hour = full weight
    } else if (hoursOld < 24) {
      recencyMultiplier = 0.95; // First 24h = 95%
    } else if (hoursOld < 48) {
      recencyMultiplier = 0.7; // 24-48h = 70%
    } else if (hoursOld < 72) {
      recencyMultiplier = 0.5; // 48-72h = 50%
    } else {
      recencyMultiplier = 0.2; // Older = 20%
    }
    
    // 3. ENGAGEMENT VELOCITY BONUS
    // Posts that gain engagement quickly in first hour get bonus
    let velocityBonus = 1.0;
    if (hoursOld < 1 && engagementScore >= 5) {
      velocityBonus = 1.2; // +20% for fast engagement
    } else if (hoursOld < 6 && engagementScore >= 10) {
      velocityBonus = 1.15; // +15% for sustained engagement
    }
    
    // 4. FOLLOWER BOOST
    // Posts from popular accounts get slight boost (max 1.5x)
    const followerBoost = Math.min(1 + (authorFollowerCount / 100), 1.5);
    
    // 5. ENGAGEMENT RATE BONUS
    // Posts with high engagement relative to views get bonus
    const viewCount = postViews.get(post.id) || Math.max(1, post.like_count + 10);
    const engagementRate = engagementScore / viewCount;
    let engagementRateBonus = 1.0;
    if (engagementRate > 0.5) {
      engagementRateBonus = 1.3; // +30% for very high engagement
    } else if (engagementRate > 0.2) {
      engagementRateBonus = 1.15; // +15% for good engagement
    }
    
    // FINAL SCORE = Engagement × Recency × Velocity × Follower Boost × Engagement Rate
    const finalScore = engagementScore * recencyMultiplier * velocityBonus * followerBoost * engagementRateBonus;
    
    return {
      score: finalScore,
      engagement: engagementScore,
      recency: recencyMultiplier,
      velocity: velocityBonus,
      followerBoost: followerBoost,
      engagementRate: engagementRateBonus,
      hoursOld: hoursOld,
    };
  },

  // Get discover feed - ranking by reach algorithm
  getDiscoverFeed: async (limit = 20, offset = 0) => {
    // Get all posts with scoring
    const scoredPosts = Array.from(posts.values()).map(post => {
      const author = users.get(post.user_id);
      const authorFollowers = author?.follower_count || 0;
      const scoreData = mockDb.calculatePostScore(post, authorFollowers);
      
      return {
        ...post,
        scoreData,
        score: scoreData.score,
        user: author ? {
          id: author.id,
          username: author.username,
          display_name: author.display_name,
          profile_photo_url: author.profile_photo_url,
          follower_count: author.follower_count,
        } : null,
      };
    });
    
    // Filter out posts with zero engagement (unless very new)
    const significantPosts = scoredPosts.filter(p => {
      const like_count = p.like_count || 0;
      return like_count >= 1 || p.scoreData.hoursOld < 0.5; // Show if 1+ likes or posted less than 30min ago
    });
    
    // Sort by score descending
    const rankedPosts = significantPosts.sort((a, b) => b.score - a.score);
    
    // Return paginated results without score metadata (clean for frontend)
    return rankedPosts.slice(offset, offset + limit).map(({ scoreData, score, ...post }) => post);
  },

  // Increment post view count
  incrementPostView: async (postId) => {
    const current = postViews.get(postId) || 0;
    postViews.set(postId, current + 1);
    return current + 1;
  },


  searchUsers: async (query, limit = 10) => {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    users.forEach((user) => {
      if (
        user.username.toLowerCase().includes(lowerQuery) ||
        user.display_name?.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      ) {
        results.push(user);
      }
    });

    return results.slice(0, limit);
  },

  // Suggested users operations
  getSuggestedUsers: async (userId) => {
    const adminUser = await mockDb.getUserById(userId);
    if (!adminUser || !adminUser.is_admin) {
      // Return empty if user is not admin
      return [];
    }

    const suggestedList = suggestedUsers.get(userId) || [];
    const suggestedUsersData = [];

    suggestedList.forEach((suggestedUserId) => {
      const user = users.get(suggestedUserId);
      if (user) {
        suggestedUsersData.push(user);
      }
    });

    // Always include admin's own profile first
    suggestedUsersData.unshift(adminUser);

    return suggestedUsersData;
  },

  addSuggestedUser: async (adminId, userId) => {
    if (!suggestedUsers.has(adminId)) {
      suggestedUsers.set(adminId, []);
    }

    const list = suggestedUsers.get(adminId);
    if (!list.includes(userId)) {
      list.push(userId);
      suggestedUsers.set(adminId, list);
    }

    return list;
  },

  removeSuggestedUser: async (adminId, userId) => {
    const list = suggestedUsers.get(adminId) || [];
    const updatedList = list.filter((id) => id !== userId);
    suggestedUsers.set(adminId, updatedList);
    return updatedList;
  },

  setSuggestedUsers: async (adminId, userIds) => {
    suggestedUsers.set(adminId, userIds);
    return userIds;
  },
};

// Seed test data
const seedTestData = async () => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Only seed if no users exist yet
    if (users.size > 0) {
      return;
    }

    // Create hashed passwords using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('hashedpass123', salt);
    
    // Create test users with properly hashed passwords
    const user1 = await mockDb.createUser('alice@puff.io', 'alice_creator', hashedPassword, '+1234567890');
    const user2 = await mockDb.createUser('bob@puff.io', 'bob_explorer', hashedPassword, '+0987654321');
    const user3 = await mockDb.createUser('charlie@puff.io', 'charlie_dev', hashedPassword, '+5555555555');
    
    // Make alice an admin user
    await mockDb.updateUser(user1.id, {
      is_admin: true,
    });
    
    // Update user profiles with more details
    await mockDb.updateUser(user1.id, {
      display_name: 'Alice Creator',
      bio: 'Photography enthusiast 📸 | Nature lover 🌿 | Sharing beautiful moments',
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    });
    
    await mockDb.updateUser(user2.id, {
      display_name: 'Bob Explorer',
      bio: 'Web developer 💻 | Tech blogger | Building cool stuff',
      profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    });
    
    await mockDb.updateUser(user3.id, {
      display_name: 'Charlie Dev',
      bio: 'Software engineer 🚀 | Open source contributor | Always learning',
      profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    });
    
    // Create some test posts
    await mockDb.createPost(user1.id, '🌅 Beautiful sunrise morning! 📸 #photography #nature', 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=500');
    await mockDb.createPost(user2.id, 'Just launched my new portfolio website! Check it out! 🚀 #webdev #coding', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500');
    await mockDb.createPost(user3.id, 'Working on something cool... stay tuned! 💻 #developer #startup', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500');
    
    // Create some following relationships
    await mockDb.followUser(user1.id, user2.id);
    await mockDb.followUser(user1.id, user3.id);
    await mockDb.followUser(user2.id, user3.id);
    
    // Setup suggested users for admin (user1)
    // Admin suggests user2 and user3
    await mockDb.setSuggestedUsers(user1.id, [user2.id, user3.id]);
    
    console.log('✅ Test data seeded successfully');
  } catch (err) {
    console.error('Error seeding test data:', err.message);
  }
};

// Password reset token operations
mockDb.createPasswordResetToken = async (userId) => {
  // Generate a random token
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  passwordResetTokens.set(token, { userId, expiresAt });
  
  return token;
};

mockDb.verifyPasswordResetToken = async (token) => {
  const resetToken = passwordResetTokens.get(token);
  
  if (!resetToken) {
    return null;
  }
  
  // Check if token has expired
  if (new Date() > resetToken.expiresAt) {
    passwordResetTokens.delete(token);
    return null;
  }
  
  return resetToken.userId;
};

mockDb.resetPassword = async (token, newPasswordHash) => {
  const userId = await mockDb.verifyPasswordResetToken(token);
  
  if (!userId) {
    return false;
  }
  
  // Update user password
  const user = users.get(userId);
  if (user) {
    user.password_hash = newPasswordHash;
    user.updated_at = new Date();
    users.set(userId, user);
    
    // Delete the used token
    passwordResetTokens.delete(token);
    
    return true;
  }
  
  return false;
};

// Referral operations
mockDb.generateReferralCode = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

mockDb.getUserReferralCode = async (userId) => {
  const user = users.get(userId);
  if (user && user.referral_code) {
    const code = user.referral_code;
    const codeData = referralCodes.get(code) || {
      code,
      userId,
      createdAt: new Date(),
      usageCount: 0
    };
    return codeData;
  }
  return null;
};

mockDb.getReferralStats = async (userId) => {
  const referralStats = {
    referral_code: null,
    total_referrals: 0,
    total_earnings: 0,
    referral_list: []
  };

  const user = users.get(userId);
  if (!user) return referralStats;

  referralStats.referral_code = user.referral_code;

  // Count referrals and earnings
  for (const referral of referrals.values()) {
    if (referral.referrer_id === userId) {
      referralStats.total_referrals += 1;
      referralStats.total_earnings += referral.earned_amount;
      
      const referredUser = users.get(referral.referred_user_id);
      if (referredUser) {
        referralStats.referral_list.push({
          id: referral.id,
          username: referredUser.username,
          email: referredUser.email,
          earned_amount: referral.earned_amount,
          status: referral.status,
          created_at: referral.created_at
        });
      }
    }
  }

  return referralStats;
};

mockDb.validateReferralCode = async (code) => {
  for (const user of users.values()) {
    if (user.referral_code === code) {
      return {
        valid: true,
        userId: user.id,
        username: user.username
      };
    }
  }
  return { valid: false };
};

// Onboarding operations
mockDb.completeOnboarding = async (userId) => {
  const user = users.get(userId);
  if (user) {
    user.onboarding_completed = true;
    user.updated_at = new Date();
    users.set(userId, user);
    return true;
  }
  return false;
};

mockDb.isOnboardingCompleted = async (userId) => {
  const user = users.get(userId);
  return user ? user.onboarding_completed : false;
};

mockDb.savePostInterest = async (userId, postId, interested) => {
  const key = `${userId}_${postId}`;
  postInterests.set(key, {
    userId,
    postId,
    interested,
    created_at: new Date()
  });
  return true;
};

mockDb.getPostInterest = async (userId, postId) => {
  const key = `${userId}_${postId}`;
  return postInterests.get(key) || null;
};

// Get suggested posts for onboarding
mockDb.getSuggestedPostsForOnboarding = async (userId, limit = 10) => {
  const user = users.get(userId);
  if (!user) return [];

  // Get posts that user hasn't seen/interacted with yet
  const suggestedPosts = [];
  for (const post of posts.values()) {
    // Skip user's own posts
    if (post.user_id === userId) continue;
    
    // Skip posts user has already shown interest in
    const interest = await mockDb.getPostInterest(userId, post.id);
    if (interest) continue;

    suggestedPosts.push(post);
    if (suggestedPosts.length >= limit) break;
  }

  // Enrich with user info
  return suggestedPosts.map(post => {
    const postUser = users.get(post.user_id);
    return {
      ...post,
      author: {
        id: postUser.id,
        username: postUser.username,
        display_name: postUser.display_name,
        profile_photo_url: postUser.profile_photo_url
      }
    };
  });
};

// Seed data on startup
seedTestData();

module.exports = mockDb;
