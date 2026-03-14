const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Check for upcoming deadlines and create notifications
 */
async function checkUpcomingDeadlines() {
  try {
    const now = new Date();
    
    // Check for tasks due in the next 24 hours
    const next24Hours = new Date(now);
    next24Hours.setHours(next24Hours.getHours() + 24);

    const upcomingTasks = await Task.find({
      status: { $nin: ['completed'] },
      dueDate: { $gte: now, $lte: next24Hours },
      'reminder.enabled': true,
      'reminder.sent': false
    }).populate('user', 'name email notificationPreferences');

    for (const task of upcomingTasks) {
      // Create deadline notification
      await Notification.create({
        user: task.user._id,
        title: 'Deadline Approaching!',
        message: `"${task.title}" is due ${formatTimeRemaining(task.dueDate)}`,
        type: 'deadline',
        relatedTask: task._id,
        priority: task.priority === 'urgent' ? 'high' : 'medium'
      });

      // Mark reminder as sent
      task.reminder.sent = true;
      await task.save();
    }

    // Check for overdue tasks
    const overdueTasks = await Task.find({
      status: { $nin: ['completed', 'overdue'] },
      dueDate: { $lt: now }
    });

    for (const task of overdueTasks) {
      task.status = 'overdue';
      await task.save();

      // Create overdue notification
      await Notification.create({
        user: task.user,
        title: 'Task Overdue!',
        message: `"${task.title}" is now overdue`,
        type: 'warning',
        relatedTask: task._id,
        priority: 'high'
      });
    }

    console.log(`Processed ${upcomingTasks.length} upcoming and ${overdueTasks.length} overdue tasks`);
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
}

/**
 * Create a reminder notification for a specific task
 */
async function createTaskReminder(taskId) {
  try {
    const task = await Task.findById(taskId).populate('user');
    
    if (!task) return;

    await Notification.create({
      user: task.user._id,
      title: 'Task Reminder',
      message: `Don't forget: "${task.title}"`,
      type: 'reminder',
      relatedTask: task._id,
      priority: task.priority === 'urgent' || task.priority === 'high' ? 'high' : 'medium'
    });

    return true;
  } catch (error) {
    console.error('Error creating task reminder:', error);
    return false;
  }
}

/**
 * Send daily summary notification
 */
async function sendDailySummary(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingTasks = await Task.countDocuments({
      user: userId,
      status: { $in: ['pending', 'in_progress'] }
    });

    const dueTodayTasks = await Task.countDocuments({
      user: userId,
      status: { $nin: ['completed'] },
      dueDate: { $gte: today, $lt: tomorrow }
    });

    const completedTodayTasks = await Task.countDocuments({
      user: userId,
      status: 'completed',
      completedAt: { $gte: today }
    });

    await Notification.create({
      user: userId,
      title: 'Daily Summary',
      message: `Today: ${dueTodayTasks} due, ${completedTodayTasks} completed, ${pendingTasks} pending`,
      type: 'system',
      priority: 'low'
    });

    return true;
  } catch (error) {
    console.error('Error sending daily summary:', error);
    return false;
  }
}

/**
 * Create achievement notification
 */
async function createAchievementNotification(userId, achievement) {
  try {
    await Notification.create({
      user: userId,
      title: `Achievement Unlocked: ${achievement.title}`,
      message: achievement.description,
      type: 'achievement',
      priority: 'low'
    });

    return true;
  } catch (error) {
    console.error('Error creating achievement notification:', error);
    return false;
  }
}

/**
 * Helper function to format time remaining
 */
function formatTimeRemaining(dueDate) {
  const now = new Date();
  const diff = new Date(dueDate) - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return 'very soon';
  }
}

module.exports = {
  checkUpcomingDeadlines,
  createTaskReminder,
  sendDailySummary,
  createAchievementNotification
};
