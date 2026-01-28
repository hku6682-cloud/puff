import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationAPI } from '../services/authService'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, likes, follows, earnings

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await notificationAPI.getNotifications()
      setNotifications(response.data.data.notifications || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setNotifications([])
    }
    setLoading(false)
  }, [])

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await notificationAPI.markAsRead(notificationId)
      loadNotifications()
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      loadNotifications()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await notificationAPI.deleteNotification(notificationId)
      loadNotifications()
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️'
      case 'follow':
        return '👥'
      case 'milestone_earned':
        return '🎉'
      case 'comment':
        return '💬'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return 'border-l-red-500 bg-red-50'
      case 'follow':
        return 'border-l-blue-500 bg-blue-50'
      case 'milestone_earned':
        return 'border-l-green-500 bg-green-50'
      case 'comment':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-purple-500 bg-purple-50'
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.is_read
    if (filter === 'likes') return notif.type === 'like'
    if (filter === 'follows') return notif.type === 'follow'
    if (filter === 'earnings') return notif.type === 'milestone_earned'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return <div className="text-center py-12">Loading notifications...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {unreadCount > 0 && (
            <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'likes', label: '❤️ Likes' },
            { value: 'follows', label: '👥 Follows' },
            { value: 'earnings', label: '🎉 Earnings' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                filter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No notifications</p>
            <p className="text-gray-500">
              {filter === 'all' ? 'You\'re all caught up!' : 'No notifications in this category'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.related_post_id) {
                    // Navigate to post detail
                  }
                  if (notif.related_user_id) {
                    navigate(`/profile/${notif.related_user_id}`)
                  }
                }}
                className={`border-l-4 p-4 rounded-lg bg-white shadow cursor-pointer transition hover:shadow-lg ${getNotificationColor(
                  notif.type
                )} ${!notif.is_read ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notif.created_at).toLocaleDateString()} at{' '}
                          {new Date(notif.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-2 hover:bg-gray-200 rounded transition"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-2 hover:bg-red-200 text-red-600 rounded transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
