const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const Planner = require('../models/Planner');
const { protect } = require('../middleware/auth');

// @route   GET /api/progress/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Get task counts
    const totalTasks = await Task.countDocuments({ user: req.user.id });
    const completedTasks = await Task.countDocuments({ user: req.user.id, status: 'completed' });
    const pendingTasks = await Task.countDocuments({ user: req.user.id, status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ user: req.user.id, status: 'in_progress' });
    const overdueTasks = await Task.countDocuments({ 
      user: req.user.id, 
      status: { $nin: ['completed'] },
      dueDate: { $lt: today }
    });

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      user: req.user.id,
      status: { $ne: 'completed' },
      dueDate: { $gte: today }
    })
    .sort({ dueDate: 1 })
    .limit(5)
    .select('title dueDate priority type');

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get weekly progress
    const weeklyProgress = await Progress.find({
      user: req.user.id,
      date: { $gte: weekAgo, $lte: today }
    }).sort({ date: 1 });

    // Calculate streak
    const streak = await calculateStreak(req.user.id);

    // Get tasks completed this week
    const tasksCompletedThisWeek = await Task.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: weekAgo }
    });

    // Get today's planner stats
    const todayPlanner = await Planner.findOne({
      user: req.user.id,
      date: today
    });

    const todayStats = {
      activitiesCompleted: todayPlanner ? todayPlanner.activities.filter(a => a.completed).length : 0,
      totalActivities: todayPlanner ? todayPlanner.activities.length : 0,
      goalsCompleted: todayPlanner ? todayPlanner.goals.filter(g => g.completed).length : 0,
      totalGoals: todayPlanner ? todayPlanner.goals.length : 0,
      pomodoroSessions: todayPlanner ? todayPlanner.pomodoroSessions.completed : 0
    };

    res.json({
      success: true,
      dashboard: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          overdueTasks,
          completionRate
        },
        upcomingDeadlines,
        weeklyProgress,
        streak,
        tasksCompletedThisWeek,
        todayStats
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

// @route   GET /api/progress/weekly
// @desc    Get weekly progress data
// @access  Private
router.get('/weekly', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const dailyData = [];
    const currentDate = new Date(weekAgo);

    while (currentDate <= today) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const tasksCompleted = await Task.countDocuments({
        user: req.user.id,
        status: 'completed',
        completedAt: { $gte: dayStart, $lte: dayEnd }
      });

      const progress = await Progress.findOne({
        user: req.user.id,
        date: dayStart
      });

      dailyData.push({
        date: new Date(dayStart),
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        tasksCompleted,
        studyHours: progress ? progress.studyHours : 0,
        productivityScore: progress ? progress.productivityScore : 0,
        pomodoroSessions: progress ? progress.pomodoroSessions : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly totals
    const weeklyTotals = {
      tasksCompleted: dailyData.reduce((sum, d) => sum + d.tasksCompleted, 0),
      studyHours: dailyData.reduce((sum, d) => sum + d.studyHours, 0),
      avgProductivity: Math.round(dailyData.reduce((sum, d) => sum + d.productivityScore, 0) / 7),
      pomodoroSessions: dailyData.reduce((sum, d) => sum + d.pomodoroSessions, 0)
    };

    res.json({
      success: true,
      weeklyData: {
        dailyData,
        totals: weeklyTotals
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

// @route   GET /api/progress/monthly
// @desc    Get monthly progress data
// @access  Private
router.get('/monthly', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Get daily progress for the month
    const progressData = await Progress.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get tasks completed in the month
    const tasksCompleted = await Task.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate }
    });

    const tasksCreated = await Task.countDocuments({
      user: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate monthly stats
    const monthlyStats = {
      tasksCompleted,
      tasksCreated,
      completionRate: tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0,
      totalStudyHours: progressData.reduce((sum, p) => sum + (p.studyHours || 0), 0),
      avgProductivity: progressData.length > 0 
        ? Math.round(progressData.reduce((sum, p) => sum + (p.productivityScore || 0), 0) / progressData.length)
        : 0,
      totalPomodoros: progressData.reduce((sum, p) => sum + (p.pomodoroSessions || 0), 0),
      activeDays: progressData.length
    };

    // Find best day
    let bestDay = null;
    let maxProductivity = 0;
    progressData.forEach(p => {
      if (p.productivityScore > maxProductivity) {
        maxProductivity = p.productivityScore;
        bestDay = p.date;
      }
    });

    res.json({
      success: true,
      monthlyData: {
        progressData,
        stats: monthlyStats,
        bestDay
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

// @route   GET /api/progress/subjects
// @desc    Get progress by subject
// @access  Private
router.get('/subjects', protect, async (req, res) => {
  try {
    const subjectStats = await Task.aggregate([
      { $match: { user: req.user._id, subject: { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$subject',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalEstimatedTime: { $sum: '$estimatedTime' },
          totalActualTime: { $sum: '$actualTime' },
          avgProgress: { $avg: '$progress' }
        }
      },
      {
        $project: {
          subject: '$_id',
          totalTasks: 1,
          completedTasks: 1,
          completionRate: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          },
          totalEstimatedTime: 1,
          totalActualTime: 1,
          avgProgress: { $round: ['$avgProgress', 0] }
        }
      }
    ]);

    res.json({
      success: true,
      subjectStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/achievements
// @desc    Get user achievements
// @access  Private
router.get('/achievements', protect, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ user: req.user.id, status: 'completed' });
    const streak = await calculateStreak(req.user.id);
    
    const achievements = [];
    
    // Task completion achievements
    if (totalTasks >= 1) achievements.push({ 
      id: 'first_task', 
      title: 'First Step', 
      description: 'Complete your first task', 
      icon: '🎯',
      earned: true 
    });
    if (totalTasks >= 10) achievements.push({ 
      id: 'task_10', 
      title: 'Getting Started', 
      description: 'Complete 10 tasks', 
      icon: '⭐',
      earned: true 
    });
    if (totalTasks >= 50) achievements.push({ 
      id: 'task_50', 
      title: 'Productive Student', 
      description: 'Complete 50 tasks', 
      icon: '🌟',
      earned: true 
    });
    if (totalTasks >= 100) achievements.push({ 
      id: 'task_100', 
      title: 'Task Master', 
      description: 'Complete 100 tasks', 
      icon: '🏆',
      earned: true 
    });
    
    // Streak achievements
    if (streak >= 3) achievements.push({ 
      id: 'streak_3', 
      title: 'On Fire', 
      description: '3 day streak', 
      icon: '🔥',
      earned: true 
    });
    if (streak >= 7) achievements.push({ 
      id: 'streak_7', 
      title: 'Week Warrior', 
      description: '7 day streak', 
      icon: '💪',
      earned: true 
    });
    if (streak >= 30) achievements.push({ 
      id: 'streak_30', 
      title: 'Consistency King', 
      description: '30 day streak', 
      icon: '👑',
      earned: true 
    });

    // Add locked achievements
    const allPossibleAchievements = [
      { id: 'first_task', title: 'First Step', description: 'Complete your first task', icon: '🎯', requirement: 1 },
      { id: 'task_10', title: 'Getting Started', description: 'Complete 10 tasks', icon: '⭐', requirement: 10 },
      { id: 'task_50', title: 'Productive Student', description: 'Complete 50 tasks', icon: '🌟', requirement: 50 },
      { id: 'task_100', title: 'Task Master', description: 'Complete 100 tasks', icon: '🏆', requirement: 100 },
      { id: 'streak_3', title: 'On Fire', description: '3 day streak', icon: '🔥', requirement: 3 },
      { id: 'streak_7', title: 'Week Warrior', description: '7 day streak', icon: '💪', requirement: 7 },
      { id: 'streak_30', title: 'Consistency King', description: '30 day streak', icon: '👑', requirement: 30 }
    ];

    const earnedIds = achievements.map(a => a.id);
    const lockedAchievements = allPossibleAchievements
      .filter(a => !earnedIds.includes(a.id))
      .map(a => ({ ...a, earned: false }));

    res.json({
      success: true,
      achievements: {
        earned: achievements,
        locked: lockedAchievements,
        totalEarned: achievements.length,
        totalPossible: allPossibleAchievements.length
      },
      stats: {
        totalTasksCompleted: totalTasks,
        currentStreak: streak
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

// @route   PUT /api/progress/study-hours
// @desc    Log study hours
// @access  Private
router.put('/study-hours', protect, async (req, res) => {
  try {
    const { hours, date } = req.body;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const progress = await Progress.findOneAndUpdate(
      { user: req.user.id, date: targetDate },
      { $inc: { studyHours: hours } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Study hours logged',
      progress
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to calculate streak
async function calculateStreak(userId) {
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hasActivity = await Task.findOne({
      user: userId,
      status: 'completed',
      completedAt: { $gte: dayStart, $lte: dayEnd }
    });

    const hasPlanner = await Planner.findOne({
      user: userId,
      date: dayStart,
      $or: [
        { 'activities.completed': true },
        { 'goals.completed': true }
      ]
    });

    if (hasActivity || hasPlanner) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }

    // Limit check to prevent infinite loop
    if (streak > 365) break;
  }

  return streak;
}

module.exports = router;
