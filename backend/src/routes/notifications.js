const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all notifications for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await db.getNotifications(userId);

    res.json({
      success: true,
      data: {
        notifications,
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Get unread notification count
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await db.getUnreadNotificationCount(userId);

    res.json({
      success: true,
      data: {
        unread_count: unreadCount
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await db.markNotificationAsRead(parseInt(notificationId));

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Mark all notifications as read
router.put('/read/all', async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await db.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      data: {
        marked_as_read: count
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const success = await db.deleteNotification(parseInt(notificationId));

    res.json({
      success: true,
      data: {
        deleted: success
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

module.exports = router;
