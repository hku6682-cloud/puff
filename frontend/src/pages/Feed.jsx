import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { postAPI, likeAPI, userAPI } from '../services/authService'
import { getCachedRequest, setCachedRequest, clearCache, deduplicateRequest } from '../services/requestCache'
import PostDetailModal from '../components/PostDetailModal'
import SuggestedPostCard from '../components/SuggestedPostCard'

export default function Feed() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [suggestedPosts, setSuggestedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSuggested, setShowSuggested] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [onboardingStatus, setOnboardingStatus] = useState(null)

  // Memoize cache key
  const feedCacheKey = useMemo(() => `feed:${page}`, [page])

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const status = await userAPI.getOnboardingStatus()
        setOnboardingStatus(status.data.data)
        
        // If not onboarded, load suggested posts
        if (!status.data.data.onboarding_completed) {
          const suggestedRes = await userAPI.getSuggestedPosts(10)
          setSuggestedPosts(suggestedRes.data.data.posts || [])
          setShowSuggested(true)
        }
      } catch (err) {
        console.error('Failed to check onboarding:', err)
      }
    }
    
    checkOnboarding()
  }, [])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      // Check cache first
      const cachedFeed = getCachedRequest(feedCacheKey)
      if (cachedFeed) {
        setPosts(cachedFeed)
        setLoading(false)
        return
      }

      // Use deduplication to prevent duplicate requests
      const feedData = await deduplicateRequest(feedCacheKey, () =>
        postAPI.getFeed(page, 20)
      )

      const postsList = feedData.data.data.posts || []
      setCachedRequest(feedCacheKey, postsList, 60000) // Cache for 60 seconds
      setPosts(postsList)
    } catch (err) {
      console.error('Failed to load feed:', err)
      setPosts([])
    }
    setLoading(false)
  }, [page, feedCacheKey])

  const handleLike = useCallback(async (postId) => {
    try {
      await likeAPI.like(postId)
      // Update the local post instead of reloading entire feed
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, liked_by_me: !post.liked_by_me, like_count: post.liked_by_me ? post.like_count - 1 : post.like_count + 1 }
            : post
        )
      )
      // Invalidate cache
      clearCache(feedCacheKey)
    } catch (err) {
      console.error('Failed to like post:', err)
    }
  }, [feedCacheKey])

  const handlePostInterestUpdate = (postId) => {
    // Remove the post from suggested posts
    setSuggestedPosts(prev => prev.filter(p => p.id !== postId))
  }

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary">PUFF Feed</h1>

        {/* Suggested Posts Section for New Users */}
        {showSuggested && suggestedPosts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Suggested for You</h2>
              <button
                onClick={() => setShowSuggested(!showSuggested)}
                className="text-sm text-primary font-semibold hover:underline"
              >
                {showSuggested ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 pb-8 border-b-2">
              {suggestedPosts.slice(0, 4).map(post => (
                <SuggestedPostCard
                  key={post.id}
                  post={post}
                  onInterestUpdate={handlePostInterestUpdate}
                />
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-8">Loading...</div>}

        {posts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-600">
            No posts yet. Follow users to see their posts!
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* User Profile Header - Clickable */}
              <div
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition border-b"
                onClick={() => {
                  if (post.user?.id) {
                    navigate(`/profile/${post.user.id}`)
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {post.user?.profile_photo_url ? (
                    <img
                      src={post.user.profile_photo_url}
                      alt={post.user?.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {post.user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {post.user?.display_name || post.user?.username}
                    </p>
                    <p className="text-sm text-gray-500 truncate">@{post.user?.username}</p>
                  </div>
                </div>
              </div>

              {/* Post Content - Clickable */}
              <div
                className="cursor-pointer hover:opacity-95 transition"
                onClick={() => setSelectedPostId(post.id)}
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="w-full max-h-96 object-cover"
                  />
                )}

                {post.caption && (
                  <div className="p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
                  </div>
                )}
              </div>

              {/* Post Stats and Actions */}
              <div className="p-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    ❤️ <span>{post.like_count || 0}</span>
                    <span className="text-xs ml-1">
                      {post.like_count === 1 ? 'like' : 'likes'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    👁️ <span>{post.view_count || 0}</span>
                    <span className="text-xs ml-1">
                      {post.view_count === 1 ? 'view' : 'views'}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => handleLike(post.id)}
                  className={`w-full py-2 px-4 rounded font-semibold transition ${
                    post.liked_by_me
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {post.liked_by_me ? '❤️ Liked' : '🤍 Like'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {posts.length > 0 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onNavigateToProfile={(profileId) => {
            navigate(`/profile/${profileId}`)
            setSelectedPostId(null)
          }}
        />
      )}
    </div>
  )
}
