import API from './api'

export const authAPI = {
  signup: (email, username, password, phone, referralCode = null) => {
    const data = { email, username, password, phone }
    if (referralCode) {
      data.referral_code = referralCode
    }
    return API.post('/auth/signup', data)
  },
  
  login: (email, password) =>
    API.post('/auth/login', { email, password }),
  
  refresh: (refresh_token) =>
    API.post('/auth/refresh', { refresh_token }),
}

export const userAPI = {
  getProfile: (userId) =>
    API.get(`/users/${userId}`),
  
  getCurrentUser: () =>
    API.get('/users/me/profile'),
  
  updateProfile: (data) =>
    API.put('/users/me/profile', data),
  
  getUserPosts: (userId, page = 1, limit = 20) =>
    API.get(`/users/${userId}/posts`, { params: { page, limit } }),
  
  getFollowers: (userId) =>
    API.get(`/users/${userId}/followers`),
  
  getFollowing: (userId) =>
    API.get(`/users/${userId}/following`),
  
  getUsers: () =>
    API.get('/users/list/all'),
  
  searchUsers: (query) =>
    API.get('/users/search', { params: { q: query } }),
  
  getSuggestedUsers: () =>
    API.get('/users/suggested'),
  
  follow: (userId) =>
    API.post(`/users/${userId}/follow`),
  
  unfollow: (userId) =>
    API.delete(`/users/${userId}/follow`),

  getOnboardingStatus: () =>
    API.get('/users/onboarding/status'),

  completeOnboarding: () =>
    API.post('/users/onboarding/complete'),

  getSuggestedPosts: (limit = 10) =>
    API.get('/users/onboarding/suggested-posts', { params: { limit } }),
}

export const postAPI = {
  createPost: (caption, image_url) =>
    API.post('/posts', { caption, image_url }),
  
  getPost: (postId) =>
    API.get(`/posts/${postId}`),
  
  getFeed: (page = 1, limit = 20) =>
    API.get('/posts', { params: { page, limit } }),
  
  updatePost: (postId, caption) =>
    API.put(`/posts/${postId}`, { caption }),
  
  deletePost: (postId) =>
    API.delete(`/posts/${postId}`),
  
  getPostDetails: (postId) =>
    API.get(`/users/posts/${postId}`),
  
  addComment: (postId, text) =>
    API.post(`/users/posts/${postId}/comments`, { text }),
  
  getComments: (postId) =>
    API.get(`/users/posts/${postId}/comments`),
  
  getLikers: (postId) =>
    API.get(`/users/posts/${postId}/likers`),

  savePostInterest: (postId, interested) =>
    API.post(`/posts/${postId}/interest`, { interested }),
}

export const likeAPI = {
  like: (postId) =>
    API.post(`/likes/${postId}/like`),
  
  unlike: (postId) =>
    API.delete(`/likes/${postId}/like`),
  
  getLikes: (postId, page = 1, limit = 20) =>
    API.get(`/likes/${postId}/likes`, { params: { page, limit } }),
}

export const walletAPI = {
  getWallet: () =>
    API.get('/wallet'),
  
  getTransactions: (page = 1, limit = 20) =>
    API.get('/wallet/transactions', { params: { page, limit } }),
  
  getRules: () =>
    API.get('/wallet/rules'),
  
  addCoins: (amount) =>
    API.post('/wallet/add-coins', { amount }),

  requestWithdrawal: (amount, upiId) =>
    API.post('/wallet/request-withdrawal', { amount, upi_id: upiId }),
  
  getWithdrawals: () =>
    API.get('/wallet/withdrawals'),
}

export const referralAPI = {
  getReferralCode: () =>
    API.get('/referral/code'),
  
  getReferralStats: () =>
    API.get('/referral/stats'),
  
  validateReferralCode: (code) =>
    API.get(`/referral/validate/${code}`),
}

export const notificationAPI = {
  getNotifications: () =>
    API.get('/notifications'),
  
  getUnreadCount: () =>
    API.get('/notifications/unread/count'),
  
  markAsRead: (notificationId) =>
    API.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () =>
    API.put('/notifications/read/all'),
  
  deleteNotification: (notificationId) =>
    API.delete(`/notifications/${notificationId}`),
}
