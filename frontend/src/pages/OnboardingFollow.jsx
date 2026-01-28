import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userAPI } from '../services/authService'

export default function OnboardingFollow() {
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followedCount, setFollowedCount] = useState(0)
  const [allUsers, setAllUsers] = useState([])
  const [followingSet, setFollowingSet] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get onboarding status
        const statusRes = await userAPI.getOnboardingStatus()
        setFollowedCount(statusRes.data.data.following_count)

        // Get all users (skip already following)
        const usersRes = await userAPI.getUsers()
        const users = usersRes.data.data || []
        setAllUsers(users)

        // Get following list
        const currentUser = await userAPI.getCurrentUser()
        const followingRes = await userAPI.getFollowing(currentUser.data.data.id)
        const followingIds = new Set(followingRes.data.data.map(u => u.id))
        setFollowingSet(followingIds)
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFollow = async (userId) => {
    try {
      await userAPI.follow(userId)
      setFollowingSet(new Set([...followingSet, userId]))
      setFollowedCount(prev => prev + 1)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to follow user')
    }
  }

  const handleUnfollow = async (userId) => {
    try {
      await userAPI.unfollow(userId)
      const newSet = new Set(followingSet)
      newSet.delete(userId)
      setFollowingSet(newSet)
      setFollowedCount(prev => prev - 1)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to unfollow user')
    }
  }

  const handleContinue = async () => {
    if (followedCount < 5) {
      setError('You must follow at least 5 people to continue')
      return
    }

    try {
      await userAPI.completeOnboarding()
      navigate('/feed')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to complete onboarding')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to PUFF! 🎉</h1>
          <p className="text-xl text-gray-600 mb-4">Follow at least 5 people to get started</p>
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-primary">{followedCount}</span>
              <span className="text-2xl text-gray-400 mx-2">/</span>
              <span className="text-2xl font-bold text-gray-400">5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                style={{ width: `${(followedCount / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        {/* Continue Button - Fixed at top when unlocked */}
        {followedCount >= 5 && (
          <div className="text-center mb-8">
            <button
              onClick={handleContinue}
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Continue to Feed ✓
            </button>
          </div>
        )}

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              {/* User Info */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{user.display_name}</h3>
                <p className="text-sm text-gray-600">@{user.username}</p>
                {user.bio && (
                  <p className="text-sm text-gray-600 mt-2">{user.bio}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-around text-center mb-4 py-3 bg-gray-50 rounded">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{user.post_count}</p>
                  <p className="text-xs text-gray-600">Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{user.follower_count}</p>
                  <p className="text-xs text-gray-600">Followers</p>
                </div>
              </div>

              {/* Follow/Unfollow Button */}
              {followingSet.has(user.id) ? (
                <button
                  onClick={() => handleUnfollow(user.id)}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  ✓ Following
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(user.id)}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  + Follow
                </button>
              )}
            </div>
          ))}
        </div>

        {allUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No users available to follow</p>
          </div>
        )}

        {/* Bottom CTA */}
        {followedCount >= 5 && (
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">You're all set! 🚀</p>
            <button
              onClick={handleContinue}
              className="bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              Explore Feed
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
