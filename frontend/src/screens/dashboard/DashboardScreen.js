import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import progressService from '../../api/progressService';
import notificationService from '../../api/notificationService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchDashboard = async () => {
    try {
      const response = await progressService.getDashboard();
      if (response.success) {
        setDashboard(response.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadNotifications(response.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchNotifications()]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchNotifications()]);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const overview = dashboard?.overview || {};
  const todayStats = dashboard?.todayStats || {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Hello, {user?.name?.split(' ')[0] || 'Student'}!</Text>
          <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Let's make today productive</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="bell-outline" size={28} color={colors.text} />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#1e293b' : '#E3F2FD' }]}>
          <Icon name="checkbox-marked-circle-outline" size={32} color="#1976D2" />
          <Text style={[styles.statNumber, { color: colors.text }]}>{overview.completedTasks || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#332717' : '#FFF3E0' }]}>
          <Icon name="clock-outline" size={32} color="#F57C00" />
          <Text style={[styles.statNumber, { color: colors.text }]}>{overview.pendingTasks || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#3f1d1f' : '#FFEBEE' }]}>
          <Icon name="alert-circle-outline" size={32} color="#D32F2F" />
          <Text style={[styles.statNumber, { color: colors.text }]}>{overview.overdueTasks || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
        </View>
      </View>

      {/* Progress Circle */}
      <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Overall Progress</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Achievements')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View Achievements</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressContent}>
          <Progress.Circle
            size={120}
            progress={(overview.completionRate || 0) / 100}
            showsText={true}
            formatText={() => `${overview.completionRate || 0}%`}
            color={colors.primary}
            unfilledColor={colors.border}
            borderWidth={0}
            thickness={10}
            textStyle={[styles.progressText, { color: colors.text }]}
          />
          <View style={styles.progressDetails}>
            <View style={styles.progressItem}>
              <Icon name="fire" size={24} color="#FF6B6B" />
              <Text style={[styles.progressValue, { color: colors.text }]}>{dashboard?.streak || 0}</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={styles.progressItem}>
              <Icon name="check-all" size={24} color="#4CAF50" />
              <Text style={[styles.progressValue, { color: colors.text }]}>{dashboard?.tasksCompletedThisWeek || 0}</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>This Week</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Today's Summary */}
      <View style={[styles.todayCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Summary</Text>
        <View style={styles.todayStats}>
          <View style={styles.todayStat}>
            <Text style={[styles.todayValue, { color: colors.primary }]}>
              {todayStats.activitiesCompleted || 0}/{todayStats.totalActivities || 0}
            </Text>
            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Activities</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={[styles.todayValue, { color: colors.primary }]}>
              {todayStats.goalsCompleted || 0}/{todayStats.totalGoals || 0}
            </Text>
            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Goals</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={[styles.todayValue, { color: colors.primary }]}>{todayStats.pomodoroSessions || 0}</Text>
            <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Pomodoros</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Deadlines */}
      <View style={[styles.deadlinesCard, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Upcoming Deadlines</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.upcomingDeadlines?.length > 0 ? (
          dashboard.upcomingDeadlines.map((task, index) => (
            <TouchableOpacity
              key={task._id || index}
              style={[styles.deadlineItem, { borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task._id })}
            >
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
              <View style={styles.deadlineInfo}>
                <Text style={[styles.deadlineTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                <Text style={[styles.deadlineType, { color: colors.textSecondary }]}>{task.type?.replace('_', ' ')}</Text>
              </View>
              <View style={styles.deadlineDate}>
                <Icon name="calendar" size={16} color={colors.textSecondary} />
                <Text style={[styles.deadlineDateText, { color: colors.textSecondary }]}>{formatDate(task.dueDate)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="calendar-check" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming deadlines</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Icon name="plus-circle" size={32} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Planner')}
          >
            <Icon name="calendar-plus" size={32} color="#4CAF50" />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Planner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Progress')}
          >
            <Icon name="chart-areaspline" size={32} color="#FF9800" />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="account-circle" size={32} color="#9C27B0" />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90D9',
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  progressDetails: {
    alignItems: 'flex-start',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  todayCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  todayStat: {
    alignItems: 'center',
  },
  todayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  todayLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  deadlinesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    color: '#333',
  },
  deadlineType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  deadlineDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineDateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  actionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default DashboardScreen;
