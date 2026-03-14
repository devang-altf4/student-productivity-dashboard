const mongoose = require('mongoose');

const plannerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date']
  },
  activities: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    startTime: {
      type: String, // HH:MM format
      required: true
    },
    endTime: {
      type: String, // HH:MM format
      required: true
    },
    category: {
      type: String,
      enum: ['study', 'class', 'assignment', 'break', 'exercise', 'meal', 'sleep', 'other'],
      default: 'study'
    },
    completed: {
      type: Boolean,
      default: false
    },
    linkedTask: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task'
    },
    color: {
      type: String,
      default: '#4A90D9'
    },
    notes: String
  }],
  goals: [{
    title: {
      type: String,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  reflection: {
    productivity: {
      type: Number,
      min: 1,
      max: 10
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'okay', 'bad', 'terrible']
    },
    notes: String,
    completedAt: Date
  },
  pomodoroSessions: {
    completed: { type: Number, default: 0 },
    target: { type: Number, default: 8 }
  },
  studyHours: {
    target: { type: Number, default: 4 },
    actual: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Ensure one planner entry per user per day
plannerSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Planner', plannerSchema);
