import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import taskService from '../../api/taskService';

const AddTaskScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('assignment');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [estimatedTime, setEstimatedTime] = useState('60');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const taskTypes = [
    { key: 'assignment', label: 'Assignment', icon: 'file-document-outline' },
    { key: 'project', label: 'Project', icon: 'briefcase-outline' },
    { key: 'study_goal', label: 'Study Goal', icon: 'book-open-outline' },
    { key: 'exam', label: 'Exam', icon: 'school-outline' },
    { key: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
    { key: 'reading', label: 'Reading', icon: 'book-outline' },
    { key: 'other', label: 'Other', icon: 'checkbox-marked-outline' },
  ];

  const priorities = [
    { key: 'low', label: 'Low', color: '#28a745' },
    { key: 'medium', label: 'Medium', color: '#ffc107' },
    { key: 'high', label: 'High', color: '#fd7e14' },
    { key: 'urgent', label: 'Urgent', color: '#dc3545' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a task title',
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        type,
        subject: subject.trim(),
        priority,
        dueDate: dueDate.toISOString(),
        estimatedTime: parseInt(estimatedTime) || 60,
        reminder: { enabled: true },
      };

      const response = await taskService.createTask(taskData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Task created successfully!',
        });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create task',
      });
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Task Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Type</Text>
          <View style={styles.optionsGrid}>
            {taskTypes.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.typeOption,
                  type === item.key && styles.typeOptionActive,
                ]}
                onPress={() => setType(item.key)}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={type === item.key ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    type === item.key && styles.typeLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Mathematics, Physics"
            placeholderTextColor="#999"
          />
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.priorityOption,
                  priority === item.key && { backgroundColor: item.color },
                ]}
                onPress={() => setPriority(item.key)}
              >
                <Text
                  style={[
                    styles.priorityLabel,
                    priority === item.key && styles.priorityLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Due Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={24} color="#666" />
            <Text style={styles.dateText}>
              {dueDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Estimated Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Time (minutes)</Text>
          <TextInput
            style={styles.input}
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            placeholder="60"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="plus" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Create Task</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeOption: {
    width: '31%',
    margin: '1%',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeOptionActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  typeLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priorityLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  priorityLabelActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddTaskScreen;
