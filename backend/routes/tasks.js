const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/tasks
// @desc    Get all tasks for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, priority, subject, sortBy, order, page, limit, search } = req.query;
    
    let query = { user: req.user.id };
    
    // Apply filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.dueDate = 1; // Default sort by due date ascending
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('facultyFeedback.faculty', 'name email');

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      tasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/upcoming
// @desc    Get upcoming tasks (next 7 days)
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const tasks = await Task.find({
      user: req.user.id,
      status: { $ne: 'completed' },
      dueDate: { $gte: today, $lte: nextWeek }
    }).sort({ dueDate: 1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks
// @access  Private
router.get('/overdue', protect, async (req, res) => {
  try {
    const today = new Date();
    
    const tasks = await Task.find({
      user: req.user.id,
      status: { $nin: ['completed'] },
      dueDate: { $lt: today }
    }).sort({ dueDate: 1 });

    // Update status to overdue
    await Task.updateMany(
      { _id: { $in: tasks.map(t => t._id) } },
      { status: 'overdue' }
    );

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { user: req.user._id, status: { $ne: 'completed' } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        byType: typeStats,
        byPriority: priorityStats
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('facultyFeedback.faculty', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', protect, [
  body('title').notEmpty().withMessage('Title is required'),
  body('dueDate').notEmpty().withMessage('Due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const taskData = {
      ...req.body,
      user: req.user.id
    };

    // Set reminder time if not provided
    if (taskData.reminder && taskData.reminder.enabled && !taskData.reminder.time) {
      const reminderTime = new Date(taskData.dueDate);
      reminderTime.setHours(reminderTime.getHours() - 24);
      taskData.reminder.time = reminderTime;
    }

    const task = await Task.create(taskData);

    // Update progress stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await Progress.findOneAndUpdate(
      { user: req.user.id, date: today },
      { $inc: { tasksCreated: 1, tasksPending: 1 } },
      { upsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const wasCompleted = task.status === 'completed';
    const prevStatus = task.status;

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If task is now completed and wasn't before
    if (task.status === 'completed' && !wasCompleted) {
      task.completedAt = new Date();
      await task.save();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeSpentMinutes = task.actualTime > 0 ? task.actualTime : task.estimatedTime || 0;
      const hoursSpent = timeSpentMinutes / 60;

      await Progress.findOneAndUpdate(
        { user: req.user.id, date: today },
        { $inc: { tasksCompleted: 1, tasksPending: -1, studyHours: hoursSpent } },
        { upsert: true }
      );

      // Create achievement notification for completing task
      await Notification.create({
        user: req.user.id,
        title: 'Task Completed! 🎉',
        message: `You completed "${task.title}"`,
        type: 'achievement',
        relatedTask: task._id
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tasks/:id/subtask/:subtaskId
// @desc    Update subtask status
// @access  Private
router.put('/:id/subtask/:subtaskId', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    subtask.completed = req.body.completed;
    if (req.body.completed) {
      subtask.completedAt = new Date();
    }

    // Update task progress
    task.progress = task.calculateProgress();
    
    await task.save();

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    // Update progress stats
    if (task.status !== 'completed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Progress.findOneAndUpdate(
        { user: req.user.id, date: today },
        { $inc: { tasksPending: -1 } },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tasks/:id/subtask
// @desc    Add subtask to a task
// @access  Private
router.post('/:id/subtask', protect, [
  body('title').notEmpty().withMessage('Subtask title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push({ title: req.body.title });
    task.progress = task.calculateProgress();
    
    await task.save();

    res.json({
      success: true,
      message: 'Subtask added successfully',
      task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
