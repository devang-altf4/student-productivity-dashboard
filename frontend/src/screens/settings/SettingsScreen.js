import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import progressService from '../../api/progressService';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  
  const [notifications, setNotifications] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [exporting, setExporting] = useState(false);

  const generateHTML = (dashboard) => {
    const overview = dashboard.overview || {};
    const today = dashboard.todayStats || {};
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // In a real app, you would pass a base64 encoded chart image here. 
    // Since we are rendering on device, we generate a visual representation using HTML/CSS.
    const completionRate = overview.completionRate || 0;
    
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
            h1 { color: #4A90D9; border-bottom: 2px solid #4A90D9; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .header-date { color: #888; font-style: italic; margin-bottom: 30px; }
            .stats-grid { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px; }
            .stat-box { flex: 1; min-width: 150px; background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #eee; }
            .stat-value { font-size: 32px; font-weight: bold; color: #4A90D9; margin-bottom: 5px; }
            .stat-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
            .progress-bar-container { background: #eee; border-radius: 20px; height: 30px; width: 100%; margin-top: 20px; overflow: hidden; }
            .progress-bar { background: #4CAF50; height: 100%; width: ${completionRate}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .quote { margin-top: 50px; font-style: italic; color: #888; text-align: center; font-size: 18px; padding: 20px; background: #f0f7ff; border-radius: 10px; border-left: 5px solid #4A90D9; }
          </style>
        </head>
        <body>
          <h1>Productivity Report</h1>
          <div class="header-date">Generated on ${date} for ${user?.name || 'Student'}</div>
          
          <h2>Overall Progress Snapshot</h2>
          <div class="progress-bar-container">
            <div class="progress-bar">${completionRate}% Completion Rate</div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${overview.completedTasks || 0}</div>
              <div class="stat-label">Tasks Completed</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${overview.pendingTasks || 0}</div>
              <div class="stat-label">Tasks Pending</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #FF9800;">${dashboard.streak || 0}</div>
              <div class="stat-label">Current Day Streak</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #E91E63;">${overview.overdueTasks || 0}</div>
              <div class="stat-label">Overdue Tasks</div>
            </div>
          </div>

          <h2>Today's Activity</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">${today.activitiesCompleted || 0} / ${today.totalActivities || 0}</div>
              <div class="stat-label">Daily Activities</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${today.goalsCompleted || 0} / ${today.totalGoals || 0}</div>
              <div class="stat-label">Daily Goals</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${today.pomodoroSessions || 0}</div>
              <div class="stat-label">Pomodoro Sessions</div>
            </div>
          </div>

          <div class="quote">
            "Success is the sum of small efforts, repeated day in and day out."
          </div>
        </body>
      </html>
    `;
  };

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await progressService.getDashboard();
      if (response.success) {
        const htmlContent = generateHTML(response.dashboard);
        
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export Productivity Report (PDF)',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        Alert.alert('Error', 'Could not fetch data for export.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIconContainer, { backgroundColor: colors.iconBg }]}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Icon name="chevron-right" size={24} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  const SettingToggle = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIconContainer, { backgroundColor: colors.iconBg }]}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: colors.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="account-circle"
            title="Profile"
            subtitle="View and edit your profile"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingItem
            icon="shield-lock"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => {}}
          />
          <SettingItem
            icon="email"
            title="Email"
            subtitle={user?.email}
          />
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingToggle
            icon="bell"
            title="Push Notifications"
            subtitle="Receive push notifications"
            value={notifications}
            onValueChange={setNotifications}
          />
          <SettingToggle
            icon="alarm"
            title="Deadline Alerts"
            subtitle="Get alerts before deadlines"
            value={deadlineAlerts}
            onValueChange={setDeadlineAlerts}
          />
          <SettingToggle
            icon="calendar-clock"
            title="Daily Reminders"
            subtitle="Receive daily productivity reminders"
            value={dailyReminders}
            onValueChange={setDailyReminders}
          />
          <SettingItem
            icon="bell-ring"
            title="Notification History"
            subtitle="View all notifications"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingToggle
            icon="moon-waning-crescent"
            title="Dark Mode"
            subtitle="Use dark theme"
            value={isDarkMode}
            onValueChange={toggleDarkMode}
          />
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress & Stats</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="trophy"
            title="Achievements"
            subtitle="View your earned badges"
            onPress={() => navigation.navigate('Achievements')}
          />
          <SettingItem
            icon="chart-line"
            title="Weekly Report"
            subtitle="View detailed progress reports"
            onPress={() => navigation.navigate('Progress')}
          />
          <SettingItem
            icon="download"
            title="Export Data"
            subtitle="Download your productivity data"
            onPress={handleExportData}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="help-circle"
            title="Help & FAQ"
            subtitle="Get help and answers"
            onPress={() => {}}
          />
          <SettingItem
            icon="message-text"
            title="Send Feedback"
            subtitle="Help us improve the app"
            onPress={() => {}}
          />
          <SettingItem
            icon="information"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Admin Section (for faculty/admin users) */}
      {user?.role && user.role !== 'student' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingItem
              icon="account-group"
              title="Manage Students"
              subtitle="View and manage student progress"
              onPress={() => navigation.navigate('StudentList')}
            />
          </View>
        </View>
      )}

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;
