const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a notification title'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a notification message'],
    trim: true
  },
  type: {
    type: String,
    enum: ['deadline', 'reminder', 'feedback', 'achievement', 'system', 'warning'],
    default: 'reminder'
  },
  relatedTask: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task'
  },
  relatedPlanner: {
    type: mongoose.Schema.ObjectId,
    ref: 'Planner'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
