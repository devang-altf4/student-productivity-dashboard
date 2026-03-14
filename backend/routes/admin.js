const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const Planner = require('../models/Planner');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/students
// @desc    Get all students (for faculty/admin)
// @access  Private (Faculty/Admin only)
router.get('/students', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { search, department, page, limit } = req.query;
    
    let query = { role: 'student' };
    
    // For faculty, only show assigned students
    if (req.user.role === 'faculty') {
      query._id = { $in: req.user.assignedStudents };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query.department = department;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const students = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ name: 1 });

    const total = await User.countDocuments(query);

    // Get basic stats for each student
    const studentsWithStats = await Promise.all(students.map(async (student) => {
      const totalTasks = await Task.countDocuments({ user: student._id });
      const completedTasks = await Task.countDocuments({ user: student._id, status: 'completed' });
      const overdueTasks = await Task.countDocuments({ 
        user: student._id, 
        status: 'overdue'
      });

      return {
        ...student.toObject(),
        stats: {
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        }
      };
    }));

    res.json({
      success: true,
      count: students.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      students: studentsWithStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/students/:id
// @desc    Get detailed student report
// @access  Private (Faculty/Admin only)
router.get('/students/:id', protect, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if faculty is assigned to this student
    if (req.user.role === 'faculty' && !req.user.assignedStudents.includes(student._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this student'
      });
    }

    // Get student tasks
    const tasks = await Task.find({ user: student._id })
      .sort({ dueDate: -1 })
      .limit(50);

    // Get task statistics
    const taskStats = {
      total: await Task.countDocuments({ user: student._id }),
      completed: await Task.countDocuments({ user: student._id, status: 'completed' }),
      pending: await Task.countDocuments({ user: student._id, status: 'pending' }),
      inProgress: await Task.countDocuments({ user: student._id, status: 'in_progress' }),
      overdue: await Task.countDocuments({ user: student._id, status: 'overdue' })
    };
    taskStats.completionRate = taskStats.total > 0 
      ? Math.round((taskStats.completed / taskStats.total) * 100) 
      : 0;

    // Get recent progress
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const progressHistory = await Progress.find({
      user: student._id,
      date: { $gte: monthAgo }
    }).sort({ date: -1 });

    // Get subject-wise performance
    const subjectPerformance = await Task.aggregate([
      { $match: { user: student._id, subject: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$subject',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      report: {
        student,
        taskStats,
        recentTasks: tasks,
        progressHistory,
        subjectPerformance
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

// @route   POST /api/admin/students/:id/feedback
// @desc    Add feedback to a student's task
// @access  Private (Faculty/Admin only)
router.post('/students/:id/feedback', protect, authorize('faculty', 'admin'), [
  body('taskId').notEmpty().withMessage('Task ID is required'),
  body('comment').notEmpty().withMessage('Comment is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { taskId, comment, rating } = req.body;

    const task = await Task.findOne({
      _id: taskId,
      user: req.params.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.facultyFeedback.push({
      faculty: req.user.id,
      comment,
      rating: rating || undefined
    });

    await task.save();

    // Create notification for student
    const Notification = require('../models/Notification');
    await Notification.create({
      user: req.params.id,
      title: 'New Feedback Received',
      message: `${req.user.name} left feedback on your task "${task.title}"`,
      type: 'feedback',
      relatedTask: task._id
    });

    res.json({
      success: true,
      message: 'Feedback added successfully',
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

// @route   POST /api/admin/assign-student
// @desc    Assign student to faculty
// @access  Private (Admin only)
router.post('/assign-student', protect, authorize('admin'), [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('facultyId').notEmpty().withMessage('Faculty ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { studentId, facultyId } = req.body;

    const student = await User.findById(studentId);
    const faculty = await User.findById(facultyId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    // Add faculty to student's assignedFaculty
    if (!student.assignedFaculty.includes(facultyId)) {
      student.assignedFaculty.push(facultyId);
      await student.save();
    }

    // Add student to faculty's assignedStudents
    if (!faculty.assignedStudents.includes(studentId)) {
      faculty.assignedStudents.push(studentId);
      await faculty.save();
    }

    res.json({
      success: true,
      message: 'Student assigned to faculty successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/faculty
// @desc    Get all faculty members (Admin only)
// @access  Private (Admin only)
router.get('/faculty', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .populate('assignedStudents', 'name email studentId');

    res.json({
      success: true,
      count: faculty.length,
      faculty
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/overview
// @desc    Get system overview statistics (Admin only)
// @access  Private (Admin only)
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    
    // Get active users (logged in within last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: weekAgo }
    });

    // Get department-wise statistics
    const departmentStats = await User.aggregate([
      { $match: { role: 'student', department: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent registrations
    const recentRegistrations = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      overview: {
        users: {
          totalStudents,
          totalFaculty,
          activeUsers
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        departmentStats,
        recentRegistrations
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

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin only)
router.put('/users/:id/role', protect, authorize('admin'), [
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
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
