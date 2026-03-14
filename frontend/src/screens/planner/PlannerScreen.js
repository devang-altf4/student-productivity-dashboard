import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import plannerService from '../../api/plannerService';
import { useTheme } from '../../context/ThemeContext';

const PlannerScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    startTime: '',
    endTime: '',
    category: 'study',
  });

  const categories = [
    { key: 'study', label: 'Study', color: '#4A90D9', icon: 'book-open-variant' },
    { key: 'class', label: 'Class', color: '#9C27B0', icon: 'school' },
    { key: 'assignment', label: 'Assignment', color: '#FF9800', icon: 'file-document' },
    { key: 'break', label: 'Break', color: '#4CAF50', icon: 'coffee' },
    { key: 'exercise', label: 'Exercise', color: '#F44336', icon: 'run' },
    { key: 'meal', label: 'Meal', color: '#795548', icon: 'food' },
    { key: 'other', label: 'Other', color: '#607D8B', icon: 'dots-horizontal' },
  ];

  const fetchPlanner = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await plannerService.getPlannerByDate(dateStr);
      if (response.success) {
        setPlanner(response.planner);
      }
    } catch (error) {
      console.error('Error fetching planner:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchPlanner();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPlanner();
    setRefreshing(false);
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.startTime || !newActivity.endTime) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill in all fields',
      });
      return;
    }

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const categoryData = categories.find(c => c.key === newActivity.category);
      
      await plannerService.addActivity(dateStr, {
        ...newActivity,
        color: categoryData?.color || '#4A90D9',
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Activity added!',
      });
      
      setShowAddModal(false);
      setNewActivity({ title: '', startTime: '', endTime: '', category: 'study' });
      fetchPlanner();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add activity',
      });
    }
  };

  const handleToggleActivity = async (activityId, completed) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await plannerService.updateActivity(dateStr, activityId, { completed: !completed });
      fetchPlanner();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update activity',
      });
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await plannerService.deleteActivity(dateStr, activityId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Activity deleted!',
      });
      fetchPlanner();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete activity',
      });
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.icon : 'checkbox-marked';
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.color : '#4A90D9';
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date Navigation */}
      <View style={[styles.dateNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavButton}>
          <Icon name="chevron-left" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
          <Text style={[styles.dateSubtext, { color: colors.textSecondary }]}>
            {selectedDate.toLocaleDateString('en-US', { year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavButton}>
          <Icon name="chevron-right" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Daily Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {planner?.activities?.filter(a => a.completed).length || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {planner?.activities?.filter(a => !a.completed).length || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Remaining</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {planner?.pomodoroSessions?.completed || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pomodoros</Text>
          </View>
        </View>

        {/* Activities */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activities</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {planner?.activities?.length > 0 ? (
            planner.activities
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((activity) => (
                <View key={activity._id} style={[styles.activityCard, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.activityCheckbox}
                    onPress={() => handleToggleActivity(activity._id, activity.completed)}
                  >
                    <Icon
                      name={activity.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={28}
                      color={activity.completed ? '#28a745' : getCategoryColor(activity.category)}
                    />
                  </TouchableOpacity>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text
                        style={[
                          styles.activityTitle,
                          { color: colors.text },
                          activity.completed && [styles.activityCompleted, { color: colors.textSecondary }],
                        ]}
                      >
                        {activity.title}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(activity.category) }]}>
                        <Icon name={getCategoryIcon(activity.category)} size={14} color="#fff" />
                      </View>
                    </View>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                      {activity.startTime} - {activity.endTime}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteActivityButton}
                    onPress={() => handleDeleteActivity(activity._id)}
                  >
                    <Icon name="delete-outline" size={20} color="#dc3545" />
                  </TouchableOpacity>
                </View>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activities planned</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap + to add an activity</Text>
            </View>
          )}
        </View>

        {/* Daily Goals */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Goals</Text>
          {planner?.goals?.length > 0 ? (
            planner.goals.map((goal, index) => (
              <View key={index} style={styles.goalItem}>
                <Icon
                  name={goal.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={goal.completed ? '#28a745' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.goalText,
                    { color: colors.text },
                    goal.completed && [styles.goalCompleted, { color: colors.textSecondary }],
                  ]}
                >
                  {goal.title}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyGoalsText, { color: colors.textSecondary }]}>No goals set for today</Text>
          )}
        </View>
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Activity</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Title</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                value={newActivity.title}
                onChangeText={(text) => setNewActivity({ ...newActivity, title: text })}
                placeholder="Activity name"
                placeholderTextColor={colors.textSecondary}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Start Time</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                    value={newActivity.startTime}
                    onChangeText={(text) => setNewActivity({ ...newActivity, startTime: text })}
                    placeholder="09:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>End Time</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                    value={newActivity.endTime}
                    onChangeText={(text) => setNewActivity({ ...newActivity, endTime: text })}
                    placeholder="10:00"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: colors.background },
                      newActivity.category === cat.key && { backgroundColor: cat.color },
                    ]}
                    onPress={() => setNewActivity({ ...newActivity, category: cat.key })}
                  >
                    <Icon
                      name={cat.icon}
                      size={20}
                      color={newActivity.category === cat.key ? '#fff' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        { color: colors.textSecondary },
                        newActivity.category === cat.key && { color: '#fff' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.modalSubmitButton, { backgroundColor: colors.primary }]} onPress={handleAddActivity}>
                <Text style={styles.modalSubmitText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateNavButton: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4A90D9',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityCheckbox: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  activityCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteActivityButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  goalCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyGoalsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeField: {
    flex: 1,
    marginRight: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    margin: 4,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  modalSubmitButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlannerScreen;
