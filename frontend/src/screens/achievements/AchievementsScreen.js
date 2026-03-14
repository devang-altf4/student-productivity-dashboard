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
import progressService from '../../api/progressService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const AchievementsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = async () => {
    try {
      const response = await progressService.getAchievements();
      if (response.success) {
        setAchievements(response.achievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Set default achievements for demo
      setAchievements(defaultAchievements);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchAchievements();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const defaultAchievements = [
    { id: 1, name: 'First Task', description: 'Complete your first task', icon: 'checkbox-marked', earned: true, earnedAt: new Date() },
    { id: 2, name: 'Early Bird', description: 'Complete a task before 8 AM', icon: 'weather-sunny', earned: true, earnedAt: new Date() },
    { id: 3, name: 'Week Warrior', description: 'Complete all tasks for a week', icon: 'sword', earned: false },
    { id: 4, name: 'Streak Master', description: 'Maintain a 7-day streak', icon: 'fire', earned: true, earnedAt: new Date() },
    { id: 5, name: 'Goal Getter', description: 'Achieve 10 daily goals', icon: 'target', earned: false },
    { id: 6, name: 'Focus Champion', description: 'Complete 50 pomodoro sessions', icon: 'timer', earned: false },
    { id: 7, name: 'Perfect Week', description: '100% task completion in a week', icon: 'star-circle', earned: false },
    { id: 8, name: 'Planner Pro', description: 'Use the planner for 30 days', icon: 'calendar-check', earned: true, earnedAt: new Date() },
    { id: 9, name: 'Night Owl', description: 'Complete a task after midnight', icon: 'owl', earned: false },
    { id: 10, name: 'Centurion', description: 'Complete 100 tasks', icon: 'trophy', earned: false },
    { id: 11, name: 'Study Guru', description: 'Log 100 hours of study time', icon: 'book', earned: false },
    { id: 12, name: 'Feedback Recipient', description: 'Receive feedback from faculty', icon: 'message-text', earned: false },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;
  const earnedAchievements = displayAchievements.filter(a => a.earned);
  const lockedAchievements = displayAchievements.filter(a => !a.earned);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Header */}
      <View style={[styles.statsHeader, { backgroundColor: colors.card }]}>
        <View style={styles.statBox}>
          <Icon name="trophy" size={32} color="#FFD700" />
          <Text style={[styles.statNumber, { color: colors.text }]}>{earnedAchievements.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="lock" size={32} color={colors.textSecondary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{lockedAchievements.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Locked</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="percent" size={32} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {Math.round((earnedAchievements.length / displayAchievements.length) * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Complete</Text>
        </View>
      </View>

      {/* Earned Achievements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Icon name="trophy" size={20} color="#FFD700" /> Earned Achievements
        </Text>
        {earnedAchievements.length > 0 ? (
          <View style={styles.achievementsGrid}>
            {earnedAchievements.map((achievement) => (
              <TouchableOpacity key={achievement.id || achievement._id} style={[styles.achievementCard, { backgroundColor: colors.card }]}>
                <View style={[styles.achievementIcon, styles.earnedIcon, { backgroundColor: colors.iconBg }]}>
                  <Icon name={achievement.icon || 'trophy'} size={32} color="#FFD700" />
                </View>
                <Text style={[styles.achievementName, { color: colors.text }]}>{achievement.name}</Text>
                <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>{achievement.description}</Text>
                {achievement.earnedAt && (
                  <Text style={[styles.earnedDate, { color: colors.textSecondary }]}>
                    {new Date(achievement.earnedAt).toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptySection, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No achievements earned yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Complete tasks to earn your first achievement!</Text>
          </View>
        )}
      </View>

      {/* Locked Achievements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          <Icon name="lock" size={20} color={colors.textSecondary} /> Locked Achievements
        </Text>
        <View style={styles.achievementsGrid}>
          {lockedAchievements.map((achievement) => (
            <View key={achievement.id || achievement._id} style={[styles.achievementCard, { backgroundColor: colors.card, opacity: 0.7 }]}>
              <View style={[styles.achievementIcon, { backgroundColor: colors.border }]}>
                <Icon name={achievement.icon || 'trophy'} size={32} color={colors.textSecondary} />
              </View>
              <Text style={[styles.achievementName, { color: colors.textSecondary }]}>{achievement.name}</Text>
              <Text style={[styles.achievementDesc, { color: colors.textSecondary }]}>{achievement.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Motivational Quote */}
      <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
        <Icon name="format-quote-open" size={24} color={colors.primary} />
        <Text style={[styles.quoteText, { color: colors.text }]}>
          Success is the sum of small efforts, repeated day in and day out.
        </Text>
        <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>- Robert Collier</Text>
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedCard: {
    backgroundColor: '#f9f9f9',
    opacity: 0.8,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  earnedIcon: {
    backgroundColor: '#FFF8E1',
  },
  lockedIcon: {
    backgroundColor: '#f0f0f0',
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  lockedText: {
    color: '#999',
  },
  earnedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  emptySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  quoteCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default AchievementsScreen;
