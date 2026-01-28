import React, { useState, useEffect, useCallback } from 'react'
import { userAPI } from '../services/authService'
import { getCachedRequest, setCachedRequest, clearCache, deduplicateRequest } from '../services/requestCache'

const DISCOVER_CACHE_KEY = 'discover:users'
const SUGGESTED_CACHE_KEY = 'discover:suggested'

export default function Discover() {
  const [allUsers, setAllUsers] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingMap, setFollowingMap] = useState({})
  const [showingSearch, setShowingSearch] = useState(false)

  // Load all users
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const cachedUsers = getCachedRequest(DISCOVER_CACHE_KEY)
      if (cachedUsers) {
        setAllUsers(cachedUsers.users || [])
        const following = {}
        cachedUsers.users?.forEach(user => {
          following[user.id] = user.is_following || false
        })
        setFollowingMap(following)
        setLoading(false)
        return
      }

      const response = await deduplicateRequest(DISCOVER_CACHE_KEY, () =>
        userAPI.getUsers()
      )

      if (response.data.success) {
        const userData = response.data.data
        setCachedRequest(DISCOVER_CACHE_KEY, userData, 120000)
        
        setAllUsers(userData.users || [])
        const following = {}
        userData.users?.forEach(user => {
          following[user.id] = user.is_following || false
        })
        setFollowingMap(following)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setAllUsers([])
    }
    setLoading(false)
  }, [])

  // Load suggested users
  const loadSuggestedUsers = useCallback(async () => {
    try {
      const cachedSuggested = getCachedRequest(SUGGESTED_CACHE_KEY)
      if (cachedSuggested) {
        setSuggestedUsers(cachedSuggested.users || [])
        return
      }

      const response = await deduplicateRequest(SUGGESTED_CACHE_KEY, () =>
        userAPI.getSuggestedUsers()
      )

      if (response.data.success) {
        const userData = response.data.data
        setCachedRequest(SUGGESTED_CACHE_KEY, userData, 120000)
        setSuggestedUsers(userData.users || [])
      }
    } catch (err) {
      console.error('Failed to load suggested users:', err)
      setSuggestedUsers([])
    }
  }, [])

  // Handle search
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      setShowingSearch(false)
      return
    }

    setShowingSearch(true)
    try {
      const response = await userAPI.searchUsers(query)
      if (response.data.success) {
        setSearchResults(response.data.data.users || [])
        // Update following map for search results
        response.data.data.users?.forEach(user => {
          if (!(user.id in followingMap)) {
            setFollowingMap(prev => ({ ...prev, [user.id]: user.is_following || false }))
          }
        })
      }
    } catch (err) {
      console.error('Failed to search users:', err)
      setSearchResults([])
    }
  }, [followingMap])

  // Handle follow
  const handleFollow = useCallback(async (userId) => {
    try {
      await userAPI.follow(userId)
      setFollowingMap(prev => ({ ...prev, [userId]: true }))
      clearCache(DISCOVER_CACHE_KEY)
      clearCache(SUGGESTED_CACHE_KEY)
    } catch (err) {
      console.error('Failed to follow user:', err)
    }
  }, [])

  // Handle unfollow
  const handleUnfollow = useCallback(async (userId) => {
    try {
      await userAPI.unfollow(userId)
      setFollowingMap(prev => ({ ...prev, [userId]: false }))
      clearCache(DISCOVER_CACHE_KEY)
      clearCache(SUGGESTED_CACHE_KEY)
    } catch (err) {
      console.error('Failed to unfollow user:', err)
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadSuggestedUsers()
  }, [loadUsers, loadSuggestedUsers])

  const UserCard = ({ user, isAdmin = false }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center">
        {user.profile_photo_url && (
          <img
            src={user.profile_photo_url}
            alt={user.username}
            className="w-16 h-16 rounded-full mx-auto mb-4"
          />
        )}
        <h3 className="text-lg font-semibold">{user.display_name || user.username}</h3>
        <p className="text-gray-600 mb-2">@{user.username}</p>
        {isAdmin && <p className="text-xs font-bold text-blue-600 mb-2">👑 ADMIN</p>}
        {user.bio && <p className="text-sm text-gray-500 mb-4">{user.bio}</p>}

        <div className="flex gap-4 justify-center mb-4 text-sm">
          <div>
            <p className="font-bold">{user.follower_count || 0}</p>
            <p className="text-gray-600">Followers</p>
          </div>
          <div>
            <p className="font-bold">{user.following_count || 0}</p>
            <p className="text-gray-600">Following</p>
          </div>
        </div>

        {!isAdmin && (
          <>
            {followingMap[user.id] ? (
              <button
                onClick={() => handleUnfollow(user.id)}
                className="w-full bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300"
              >
                Following ✓
              </button>
            ) : (
              <button
                onClick={() => handleFollow(user.id)}
                className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90"
              >
                Follow
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Discover Users</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search users by username or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && showingSearch && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            {searchResults.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </div>
        )}

        {!showingSearch && (
          <>
            {/* Suggested Users Section */}
            {suggestedUsers.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Suggested Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedUsers.map((user, index) => (
                    <UserCard 
                      key={user.id} 
                      user={user} 
                      isAdmin={index === 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Users Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">All Users</h2>
              {allUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    No users to discover yet. Be the first to create posts!
                  </p>
                  <p className="text-gray-500 text-sm">
                    💡 Tip: When other users sign up, they'll appear here and you can follow them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
