import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import Toast from 'react-native-toast-message';
import taskService from '../../api/taskService';

const TaskDetailScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    try {
      const response = await taskService.getTask(taskId);
      if (response.success) {
        setTask(response.task);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load task details',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const handleCompleteTask = async () => {
    try {
      await taskService.completeTask(taskId);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Task completed!',
      });
      fetchTask();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to complete task',
      });
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(taskId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Task deleted!',
              });
              navigation.goBack();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete task',
              });
            }
          },
        },
      ]
    );
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      await taskService.updateSubtask(taskId, subtaskId, !completed);
      fetchTask();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update subtask',
      });
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#4A90D9';
      case 'overdue': return '#dc3545';
      default: return '#ffc107';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
            <Text style={styles.statusText}>{task.status?.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>
        <Text style={styles.title}>{task.title}</Text>
        {task.subject && <Text style={styles.subject}>{task.subject}</Text>}
      </View>

      {/* Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressContainer}>
          <Progress.Bar
            progress={task.progress / 100}
            width={null}
            height={12}
            color="#4A90D9"
            unfilledColor="#E0E0E0"
            borderWidth={0}
            borderRadius={6}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{task.progress}%</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={20} color="#666" />
            <Text style={styles.detailLabel}>Due Date</Text>
            <Text style={styles.detailValue}>{formatDate(task.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Estimated Time</Text>
            <Text style={styles.detailValue}>{formatTime(task.estimatedTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="tag-outline" size={20} color="#666" />
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{task.type?.replace('_', ' ')}</Text>
          </View>
          {task.createdAt && (
            <View style={styles.detailRow}>
              <Icon name="calendar-plus" size={20} color="#666" />
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{formatDate(task.createdAt)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {task.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{task.description}</Text>
          </View>
        </View>
      )}

      {/* Subtasks */}
      {task.subtasks?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subtasks</Text>
          <View style={styles.subtasksCard}>
            {task.subtasks.map((subtask) => (
              <TouchableOpacity
                key={subtask._id}
                style={styles.subtaskRow}
                onPress={() => handleToggleSubtask(subtask._id, subtask.completed)}
              >
                <Icon
                  name={subtask.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={subtask.completed ? '#28a745' : '#666'}
                />
                <Text
                  style={[
                    styles.subtaskText,
                    subtask.completed && styles.subtaskCompleted,
                  ]}
                >
                  {subtask.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Faculty Feedback */}
      {task.facultyFeedback?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faculty Feedback</Text>
          {task.facultyFeedback.map((feedback, index) => (
            <View key={index} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackName}>{feedback.faculty?.name || 'Faculty'}</Text>
                {feedback.rating && (
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name={star <= feedback.rating ? 'star' : 'star-outline'}
                        size={16}
                        color="#ffc107"
                      />
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.feedbackComment}>{feedback.comment}</Text>
              <Text style={styles.feedbackDate}>
                {formatDate(feedback.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {task.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteTask}
          >
            <Icon name="check" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditTask', { task })}
        >
          <Icon name="pencil" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteTask}
        >
          <Icon name="delete" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subject: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90D9',
    marginLeft: 12,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  subtasksCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtaskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  subtaskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  feedbackComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  actionsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: '#28a745',
    flexBasis: '100%',
  },
  editButton: {
    backgroundColor: '#4A90D9',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TaskDetailScreen;
