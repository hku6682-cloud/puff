import React, { useState, useEffect } from 'react'
import { postAPI, userAPI } from '../services/authService'
import { useAuthStore } from '../context/authContext'

export default function PostDetailModal({ postId, onClose, onNavigateToProfile }) {
  const { user: currentUser } = useAuthStore()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [likers, setLikers] = useState([])
  const [showLikers, setShowLikers] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    loadPostDetails()
  }, [postId])

  const loadPostDetails = async () => {
    try {
      setLoading(true)
      const response = await postAPI.getPostDetails(postId)
      if (response.data?.success) {
        const postData = response.data.data.post
        setPost(postData)
        setComments(postData.comments || [])
        setLikers(postData.likers || [])
        setIsLiked(postData.isLiked || false)
        setLikeCount(postData.like_count || 0)
        setCommentCount((postData.comments || []).length)
      }
    } catch (err) {
      setError('Failed to load post details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      if (isLiked) {
        await userAPI.unfollow(postId)
        setIsLiked(false)
        setLikeCount(likeCount - 1)
      } else {
        await userAPI.follow(postId)
        setIsLiked(true)
        setLikeCount(likeCount + 1)
      }
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const response = await postAPI.addComment(postId, newComment)
      if (response.data?.success) {
        const newCommentData = response.data.data.comment
        setComments([...comments, newCommentData])
        setNewComment('')
        setCommentCount(commentCount + 1)
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">{error || 'Post not found'}</p>
          <button
            onClick={onClose}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {post.user?.profile_photo_url ? (
              <img
                src={post.user.profile_photo_url}
                alt={post.user?.username}
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                onClick={() => {
                  onNavigateToProfile(post.user.id)
                  onClose()
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {post.user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className="cursor-pointer"
              onClick={() => {
                onNavigateToProfile(post.user.id)
                onClose()
              }}
            >
              <p className="font-semibold text-gray-900">{post.user?.display_name}</p>
              <p className="text-xs text-gray-500">@{post.user?.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Post Image */}
          <div className="w-full max-h-64 bg-gray-200 flex items-center justify-center">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt="Post"
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-gray-500">No image</p>
            )}
          </div>

          {/* Post Caption */}
          <div className="p-4 border-b">
            <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-around p-4 border-b">
            <button
              onClick={() => setShowLikers(!showLikers)}
              className="text-center cursor-pointer hover:opacity-80"
            >
              <p className="font-bold text-gray-900">{likeCount}</p>
              <p className="text-xs text-gray-500">
                {likeCount === 1 ? 'Like' : 'Likes'}
              </p>
            </button>
            <div className="text-center">
              <p className="font-bold text-gray-900">{commentCount}</p>
              <p className="text-xs text-gray-500">
                {commentCount === 1 ? 'Comment' : 'Comments'}
              </p>
            </div>
          </div>

          {/* Likers List */}
          {showLikers && likers.length > 0 && (
            <div className="p-4 border-b bg-gray-50">
              <p className="font-semibold text-sm mb-3">Liked by:</p>
              <div className="space-y-2">
                {likers.map((liker) => (
                  <div
                    key={liker.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => {
                      onNavigateToProfile(liker.id)
                      onClose()
                    }}
                  >
                    {liker.profile_photo_url ? (
                      <img
                        src={liker.profile_photo_url}
                        alt={liker.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {liker.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {liker.display_name}
                      </p>
                      <p className="text-xs text-gray-500">@{liker.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="p-4 space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.user?.profile_photo_url ? (
                    <img
                      src={comment.user.profile_photo_url}
                      alt={comment.user?.username}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      onClick={() => {
                        onNavigateToProfile(comment.user.id)
                        onClose()
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {comment.user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p
                      className="font-semibold text-sm cursor-pointer hover:underline"
                      onClick={() => {
                        onNavigateToProfile(comment.user.id)
                        onClose()
                      }}
                    >
                      {comment.user?.display_name}
                    </p>
                    <p className="text-sm text-gray-700">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>

        {/* Interaction Bar */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleLike}
              className={`flex-1 py-2 rounded font-semibold transition ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              {isLiked ? '❤ Liked' : '🤍 Like'}
            </button>
          </div>

          {/* Comment Form */}
          {currentUser && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          )}
          {!currentUser && (
            <p className="text-center text-gray-500 text-sm">
              Log in to comment on posts
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
