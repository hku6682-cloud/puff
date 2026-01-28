import React, { useState } from 'react'
import { postAPI } from '../services/authService'

export default function SuggestedPostCard({ post, onInterestUpdate }) {
  const [loading, setLoading] = useState(false)
  const [responded, setResponded] = useState(false)

  const handleInterest = async (interested) => {
    setLoading(true)
    try {
      await postAPI.savePostInterest(post.id, interested)
      setResponded(true)
      if (onInterestUpdate) {
        onInterestUpdate(post.id)
      }
    } catch (err) {
      console.error('Failed to save interest:', err)
    } finally {
      setLoading(false)
    }
  }

  if (responded) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center opacity-50">
        <p className="text-gray-600">Thanks for your feedback! 👍</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
      {/* Post Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          className="w-full h-64 object-cover"
        />
      )}

      {/* Post Content */}
      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold mr-3">
            {post.author.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{post.author.display_name}</p>
            <p className="text-sm text-gray-600">@{post.author.username}</p>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-gray-700 mb-4">{post.caption}</p>
        )}

        {/* Interest Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleInterest(true)}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            👍 Interested
          </button>
          <button
            onClick={() => handleInterest(false)}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            👎 Not Interested
          </button>
        </div>
      </div>
    </div>
  )
}
