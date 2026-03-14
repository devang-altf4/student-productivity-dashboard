const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  tasksCompleted: {
    type: Number,
    default: 0
  },
  tasksCreated: {
    type: Number,
    default: 0
  },
  tasksPending: {
    type: Number,
    default: 0
  },
  tasksOverdue: {
    type: Number,
    default: 0
  },
  studyHours: {
    type: Number,
    default: 0
  },
  pomodoroSessions: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  achievements: [{
    title: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  weeklyStats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    avgProductivity: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 }
  },
  monthlyStats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    avgProductivity: { type: Number, default: 0 },
    totalStudyHours: { type: Number, default: 0 },
    bestDay: { type: Date },
    mostProductiveTime: { type: String }
  },
  subjectProgress: [{
    subject: String,
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    averageGrade: { type: Number },
    studyHours: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Index for faster queries
progressSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
