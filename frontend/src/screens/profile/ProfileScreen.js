import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: '',
    year: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        department: user.department || '',
        year: user.year?.toString() || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await updateProfile({
        name: formData.name,
        studentId: formData.studentId,
        department: formData.department,
        year: parseInt(formData.year) || undefined,
        bio: formData.bio,
      });

      if (response.success) {
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#FF6B6B';
      case 'faculty': return '#9C27B0';
      default: return '#4A90D9';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty';
      default: return 'Student';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.card }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          {editing && (
            <TouchableOpacity style={styles.editAvatarButton}>
              <Icon name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role) }]}>
          <Text style={styles.roleText}>{getRoleLabel(user?.role)}</Text>
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: colors.primary }]}
        onPress={() => editing ? handleSave() : setEditing(true)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon name={editing ? 'check' : 'pencil'} size={20} color="#fff" />
            <Text style={styles.editButtonText}>{editing ? 'Save Changes' : 'Edit Profile'}</Text>
          </>
        )}
      </TouchableOpacity>

      {editing && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setEditing(false)}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Profile Form */}
      <View style={styles.formContainer}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                !editing && [styles.inputDisabled, { backgroundColor: colors.border, color: colors.textSecondary }]
              ]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={editing}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input, 
                styles.inputDisabled, 
                { backgroundColor: colors.border, color: colors.textSecondary, borderColor: colors.border }
              ]}
              value={formData.email}
              editable={false}
              placeholder="Email cannot be changed"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                !editing && [styles.inputDisabled, { backgroundColor: colors.border, color: colors.textSecondary }]
              ]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              editable={editing}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Student ID</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                !editing && [styles.inputDisabled, { backgroundColor: colors.border, color: colors.textSecondary }]
              ]}
              value={formData.studentId}
              onChangeText={(text) => setFormData({ ...formData, studentId: text })}
              editable={editing}
              placeholder="Enter your student ID"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Department</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                !editing && [styles.inputDisabled, { backgroundColor: colors.border, color: colors.textSecondary }]
              ]}
              value={formData.department}
              onChangeText={(text) => setFormData({ ...formData, department: text })}
              editable={editing}
              placeholder="Enter your department"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Year</Text>
            <TextInput
              style={[
                styles.input, 
                { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                !editing && [styles.inputDisabled, { backgroundColor: colors.border, color: colors.textSecondary }]
              ]}
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              editable={editing}
              placeholder="Enter your year"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Stats Summary */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="checkbox-marked-circle" size={32} color="#4CAF50" />
              <Text style={[styles.statValue, { color: colors.text }]}>{user?.stats?.tasksCompleted || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="fire" size={32} color="#FF9800" />
              <Text style={[styles.statValue, { color: colors.text }]}>{user?.stats?.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="trophy" size={32} color="#FFD700" />
              <Text style={[styles.statValue, { color: colors.text }]}>{user?.stats?.achievements || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Achievements</Text>
            </View>
          </View>
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
  header: {
    backgroundColor: '#4A90D9',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4A90D9',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    marginHorizontal: 16,
    marginTop: -20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
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
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;
