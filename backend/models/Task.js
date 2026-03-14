const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['assignment', 'project', 'study_goal', 'exam', 'quiz', 'reading', 'other'],
    default: 'assignment'
  },
  subject: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  startDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 60
  },
  actualTime: {
    type: Number, // in minutes
    default: 0
  },
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  notes: {
    type: String
  },
  reminder: {
    enabled: { type: Boolean, default: true },
    time: { type: Date },
    sent: { type: Boolean, default: false }
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'weekly'
    },
    interval: { type: Number, default: 1 },
    endDate: { type: Date }
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  facultyFeedback: [{
    faculty: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    comment: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Update status based on due date
taskSchema.pre('save', function(next) {
  if (this.status !== 'completed' && new Date(this.dueDate) < new Date()) {
    this.status = 'overdue';
  }
  next();
});

// Calculate progress based on subtasks
taskSchema.methods.calculateProgress = function() {
  if (this.subtasks.length === 0) return this.progress;
  const completed = this.subtasks.filter(st => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
};

// Index for faster queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Task', taskSchema);
