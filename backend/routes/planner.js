const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Planner = require('../models/Planner');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

// @route   GET /api/planner
// @desc    Get planner entries for a date range
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = { user: req.user.id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfWeek, $lte: endOfWeek };
    }

    const planners = await Planner.find(query)
      .sort({ date: 1 })
      .populate('activities.linkedTask', 'title status priority');

    res.json({
      success: true,
      count: planners.length,
      planners
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/planner/today
// @desc    Get today's planner
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let planner = await Planner.findOne({
      user: req.user.id,
      date: today
    }).populate('activities.linkedTask', 'title status priority');

    // Create a new planner if one doesn't exist
    if (!planner) {
      planner = await Planner.create({
        user: req.user.id,
        date: today,
        activities: [],
        goals: []
      });
    }

    res.json({
      success: true,
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/planner/:date
// @desc    Get planner for specific date
// @access  Private
router.get('/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    }).populate('activities.linkedTask', 'title status priority');

    if (!planner) {
      planner = await Planner.create({
        user: req.user.id,
        date: date,
        activities: [],
        goals: []
      });
    }

    res.json({
      success: true,
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/planner
// @desc    Create or update planner for a date
// @access  Private
router.post('/', protect, [
  body('date').notEmpty().withMessage('Date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const date = new Date(req.body.date);
    date.setHours(0, 0, 0, 0);

    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (planner) {
      // Update existing planner
      planner = await Planner.findByIdAndUpdate(
        planner._id,
        { ...req.body, date: date },
        { new: true, runValidators: true }
      );
    } else {
      // Create new planner
      planner = await Planner.create({
        ...req.body,
        user: req.user.id,
        date: date
      });
    }

    res.json({
      success: true,
      message: 'Planner saved successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/planner/:date/activity
// @desc    Add activity to planner
// @access  Private
router.post('/:date/activity', protect, [
  body('title').notEmpty().withMessage('Activity title is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      planner = await Planner.create({
        user: req.user.id,
        date: date,
        activities: [],
        goals: []
      });
    }

    planner.activities.push(req.body);
    await planner.save();

    res.json({
      success: true,
      message: 'Activity added successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/planner/:date/activity/:activityId
// @desc    Update activity in planner
// @access  Private
router.put('/:date/activity/:activityId', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      return res.status(404).json({
        success: false,
        message: 'Planner not found'
      });
    }

    const activity = planner.activities.id(req.params.activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    Object.assign(activity, req.body);
    await planner.save();

    res.json({
      success: true,
      message: 'Activity updated successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/planner/:date/activity/:activityId
// @desc    Delete activity from planner
// @access  Private
router.delete('/:date/activity/:activityId', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      return res.status(404).json({
        success: false,
        message: 'Planner not found'
      });
    }

    planner.activities.pull(req.params.activityId);
    await planner.save();

    res.json({
      success: true,
      message: 'Activity deleted successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/planner/:date/goal
// @desc    Add goal to planner
// @access  Private
router.post('/:date/goal', protect, [
  body('title').notEmpty().withMessage('Goal title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      planner = await Planner.create({
        user: req.user.id,
        date: date,
        activities: [],
        goals: []
      });
    }

    planner.goals.push(req.body);
    await planner.save();

    res.json({
      success: true,
      message: 'Goal added successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/planner/:date/reflection
// @desc    Update daily reflection
// @access  Private
router.put('/:date/reflection', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      return res.status(404).json({
        success: false,
        message: 'Planner not found'
      });
    }

    planner.reflection = {
      ...req.body,
      completedAt: new Date()
    };
    await planner.save();

    // Update progress with productivity score
    if (req.body.productivity) {
      await Progress.findOneAndUpdate(
        { user: req.user.id, date: date },
        { productivityScore: req.body.productivity * 10 },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Reflection saved successfully',
      planner
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/planner/:date/pomodoro
// @desc    Update pomodoro session count
// @access  Private
router.put('/:date/pomodoro', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    let planner = await Planner.findOne({
      user: req.user.id,
      date: date
    });

    if (!planner) {
      planner = await Planner.create({
        user: req.user.id,
        date: date,
        activities: [],
        goals: []
      });
    }

    planner.pomodoroSessions = req.body;
    await planner.save();

    // Update progress
    await Progress.findOneAndUpdate(
      { user: req.user.id, date: date },
      { pomodoroSessions: req.body.completed },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Pomodoro sessions updated',
      planner
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
