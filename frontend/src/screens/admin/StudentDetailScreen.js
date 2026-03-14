import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import api from '../../api/config';

const { width } = Dimensions.get('window');

const StudentDetailScreen = ({ route, navigation }) => {
  const { student } = route.params;
  const [studentData, setStudentData] = useState(student);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentDetails = async () => {
    try {
      const response = await api.get(`/admin/students/${student._id}`);
      if (response.data.success) {
        setStudentData(response.data.student);
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter feedback');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/feedback/${selectedTask._id}`, {
        feedback: feedback.trim(),
      });
      Alert.alert('Success', 'Feedback submitted successfully');
      setFeedbackModal(false);
      setFeedback('');
      setSelectedTask(null);
      fetchStudentDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const getProgressChartData = () => {
    const weeklyData = studentData.weeklyProgress || [0, 0, 0, 0, 0, 0, 0];
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: weeklyData,
          color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in-progress': return '#FF9800';
      case 'pending': return '#2196F3';
      case 'overdue': return '#FF6B6B';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Student Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {studentData.name?.charAt(0).toUpperCase() || 'S'}
          </Text>
        </View>
        <Text style={styles.studentName}>{studentData.name}</Text>
        <Text style={styles.studentEmail}>{studentData.email}</Text>
        {studentData.studentId && (
          <Text style={styles.studentId}>ID: {studentData.studentId}</Text>
        )}
        {studentData.department && (
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>{studentData.department}</Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="checkbox-marked-circle" size={28} color="#4CAF50" />
          <Text style={styles.statValue}>{studentData.stats?.tasksCompleted || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="clock-outline" size={28} color="#FF9800" />
          <Text style={styles.statValue}>{studentData.stats?.tasksPending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="percent" size={28} color="#4A90D9" />
          <Text style={styles.statValue}>
            {Math.round(studentData.stats?.taskCompletionRate || 0)}%
          </Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="fire" size={28} color="#FF6B6B" />
          <Text style={styles.statValue}>{studentData.stats?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Weekly Progress</Text>
        <LineChart
          data={getProgressChartData()}
          width={width - 64}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Recent Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {tasks.length > 0 ? (
          tasks.slice(0, 5).map((task) => (
            <View key={task._id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(task.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                      {task.status}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.feedbackButton}
                  onPress={() => {
                    setSelectedTask(task);
                    setFeedback(task.facultyFeedback?.feedback || '');
                    setFeedbackModal(true);
                  }}
                >
                  <Icon
                    name={task.facultyFeedback ? 'message-text' : 'message-plus'}
                    size={20}
                    color="#4A90D9"
                  />
                </TouchableOpacity>
              </View>
              {task.subject && (
                <Text style={styles.taskSubject}>{task.subject}</Text>
              )}
              {task.dueDate && (
                <Text style={styles.taskDueDate}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Text>
              )}
              {task.facultyFeedback && (
                <View style={styles.existingFeedback}>
                  <Icon name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.feedbackNote}>Feedback provided</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyTasks}>
            <Icon name="clipboard-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        )}
        
        {tasks.length > 5 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Tasks ({tasks.length})</Text>
            <Icon name="arrow-right" size={16} color="#4A90D9" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="email" size={20} color="#fff" />
          <Text style={styles.actionText}>Send Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Icon name="message-text" size={20} color="#4A90D9" />
          <Text style={[styles.actionText, styles.secondaryText]}>Send Reminder</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provide Feedback</Text>
              <TouchableOpacity onPress={() => setFeedbackModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedTask && (
              <View style={styles.taskPreview}>
                <Text style={styles.taskPreviewTitle}>{selectedTask.title}</Text>
                <Text style={styles.taskPreviewStatus}>Status: {selectedTask.status}</Text>
              </View>
            )}

            <TextInput
              style={styles.feedbackInput}
              placeholder="Enter your feedback for this task..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmitFeedback}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#4A90D9',
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  studentEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  studentId: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  departmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  departmentText: {
    fontSize: 12,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: -20,
  },
  statCard: {
    width: (width - 48) / 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  feedbackButton: {
    padding: 4,
  },
  taskSubject: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  existingFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  feedbackNote: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90D9',
    marginRight: 4,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A90D9',
    marginRight: 0,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  secondaryText: {
    color: '#4A90D9',
  },
  bottomSpacing: {
    height: 40,
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
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  taskPreview: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  taskPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  taskPreviewStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4A90D9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StudentDetailScreen;
