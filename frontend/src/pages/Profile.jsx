import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authContext'
import { userAPI } from '../services/authService'
import { getCachedRequest, setCachedRequest, clearCache, deduplicateRequest } from '../services/requestCache'
import EditProfileModal from '../components/EditProfileModal'
import FollowersModal from '../components/FollowersModal'
import PostDetailModal from '../components/PostDetailModal'

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersModalType, setFollowersModalType] = useState('followers')
  const [selectedPostId, setSelectedPostId] = useState(null)
  const isOwnProfile = !userId || userId === String(currentUser?.id)

  // Memoize the request key to prevent unnecessary recalculations
  const profileCacheKey = useMemo(() => 
    isOwnProfile ? 'profile:me' : `profile:${userId}`,
    [isOwnProfile, userId]
  )

  const loadUserPosts = useCallback(async (userIdForPosts) => {
    setPostsLoading(true)
    try {
      const postsCacheKey = `posts:${userIdForPosts}`
      
      // Check cache first
      const cachedPosts = getCachedRequest(postsCacheKey)
      if (cachedPosts) {
        setPosts(cachedPosts)
        setPostsLoading(false)
        return
      }

      const response = await deduplicateRequest(postsCacheKey, () =>
        userAPI.getUserPosts(userIdForPosts, 1, 100)
      )
      
      const postsData = response.data.data.posts || []
      setCachedRequest(postsCacheKey, postsData, 60000)
      setPosts(postsData)
    } catch (err) {
      console.error('Failed to load posts:', err)
      setPosts([])
    }
    setPostsLoading(false)
  }, [])

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      // Check cache first
      const cachedProfile = getCachedRequest(profileCacheKey)
      if (cachedProfile) {
        setProfile(cachedProfile)
        await loadUserPosts(cachedProfile.id)
        setLoading(false)
        return
      }

      // Use deduplication to prevent duplicate requests
      const profileData = await deduplicateRequest(profileCacheKey, async () => {
        let response
        if (isOwnProfile) {
          response = await userAPI.getCurrentUser()
        } else {
          response = await userAPI.getProfile(userId)
        }
        return response.data.data
      })

      // Cache the profile
      setCachedRequest(profileCacheKey, profileData, 60000) // Cache for 60 seconds
      setProfile(profileData)
      
      // Load user posts
      await loadUserPosts(profileData.id)
    } catch (err) {
      console.error('Failed to load profile:', err)
      setProfile(null)
    }
    setLoading(false)
  }, [isOwnProfile, userId, profileCacheKey, loadUserPosts])

  useEffect(() => {
    loadProfile()
    // Cleanup cache on unmount
    return () => {
      // Don't clear cache on unmount - just stop polling
    }
  }, [loadProfile])

  const handleFollow = useCallback(async () => {
    try {
      await userAPI.follow(userId)
      setIsFollowing(true)
      // Invalidate cache and reload
      clearCache(profileCacheKey)
      await loadProfile()
    } catch (err) {
      console.error('Failed to follow:', err)
    }
  }, [userId, profileCacheKey, loadProfile])

  const handleUnfollow = useCallback(async () => {
    try {
      await userAPI.unfollow(userId)
      setIsFollowing(false)
      // Invalidate cache and reload
      clearCache(profileCacheKey)
      await loadProfile()
    } catch (err) {
      console.error('Failed to unfollow:', err)
    }
  }, [userId, profileCacheKey, loadProfile])

  if (loading) return <div className="text-center py-8">Loading...</div>

  if (!profile) {
    return <div className="text-center py-8 text-red-600">User not found</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-2xl">
                    {profile.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">{profile.username}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                  >
                    Edit Profile
                  </button>
                )}
                {!isOwnProfile && (
                  <>
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                      >
                        Following ✓
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
                      >
                        Follow
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Stats - Clickable */}
              <div className="flex gap-8 mb-6">
                <div>
                  <p className="text-2xl font-bold">{profile.post_count || 0}</p>
                  <p className="text-gray-600">Posts</p>
                </div>
                <div
                  onClick={() => {
                    setFollowersModalType('followers')
                    setShowFollowersModal(true)
                  }}
                  className="cursor-pointer hover:opacity-80 transition"
                >
                  <p className="text-2xl font-bold">{profile.follower_count || 0}</p>
                  <p className="text-gray-600">Followers</p>
                </div>
                <div
                  onClick={() => {
                    setFollowersModalType('following')
                    setShowFollowersModal(true)
                  }}
                  className="cursor-pointer hover:opacity-80 transition"
                >
                  <p className="text-2xl font-bold">{profile.following_count || 0}</p>
                  <p className="text-gray-600">Following</p>
                </div>
              </div>

              {/* Bio Info */}
              <div>
                {profile.display_name && (
                  <p className="font-semibold text-lg">{profile.display_name}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{profile.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Joined:</span>{' '}
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            {profile.phone && (
              <p>
                <span className="font-semibold">Phone:</span> {profile.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Posts</h2>

        {postsLoading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No posts yet</p>
            {isOwnProfile && (
              <p className="text-gray-500 mt-2">Start creating posts to share with your followers!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="relative overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedPostId(post.id)}
              >
                {/* Post Image */}
                <div className="aspect-square overflow-hidden bg-gray-200">
                  <img
                    src={post.image_url}
                    alt={post.caption}
                    className="w-full h-full object-cover hover:scale-110 transition"
                  />
                </div>

                {/* Post Hover Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition flex items-center justify-center gap-6">
                  <div className="text-white text-center opacity-0 hover:opacity-100 transition">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">❤️</span>
                      <span className="font-semibold">{post.like_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <span className="text-2xl">💬</span>
                      <span className="font-semibold">{post.comment_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Post Info */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{post.caption}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSuccess={loadProfile}
        />
      )}

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={profile.id}
          type={followersModalType}
          onClose={() => setShowFollowersModal(false)}
          onUnfollow={loadProfile}
          onNavigateToProfile={(followerId) => {
            navigate(`/profile/${followerId}`)
            setShowFollowersModal(false)
          }}
        />
      )}

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
