import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../context/authContext'
import { userAPI } from '../services/authService'

export default function FollowersModal({ userId, type = 'followers', onClose, onUnfollow, onNavigateToProfile }) {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [userId, type])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      let response
      if (type === 'followers') {
        response = await userAPI.getFollowers(userId)
      } else {
        response = await userAPI.getFollowing(userId)
      }
      setUsers(response.data.data[type] || [])
    } catch (err) {
      setError(err.response?.data?.error?.message || `Failed to load ${type}`)
      console.error(`Failed to load ${type}:`, err)
    }
    setLoading(false)
  }

  const handleUnfollow = async (targetUserId) => {
    try {
      await userAPI.unfollow(targetUserId)
      setUsers(users.filter(u => u.id !== targetUserId))
      onUnfollow?.()
    } catch (err) {
      console.error('Failed to unfollow:', err)
      alert('Failed to unfollow user')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold capitalize">{type}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading {type}...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    if (onNavigateToProfile) {
                      onNavigateToProfile(user.id)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {user.profile_photo_url ? (
                      <img
                        src={user.profile_photo_url}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 text-xs font-semibold">
                          {user.username?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-gray-600 truncate">@{user.username}</p>
                    </div>
                  </div>

                  {/* Unfollow Button - Only show if we're viewing someone else's profile */}
                  {currentUser?.id !== userId && currentUser?.id === parseInt(userId) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnfollow(user.id)
                      }}
                      className="ml-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold flex-shrink-0"
                    >
                      Unfollow
                    </button>
                  )}

                  {/* Unfollow Button - Show for Following list */}
                  {type === 'following' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnfollow(user.id)
                      }}
                      className="ml-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold flex-shrink-0"
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
