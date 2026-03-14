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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import progressService from '../../api/progressService';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [weeklyData, setWeeklyData] = useState(null);
  const [subjectData, setSubjectData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');

  const fetchData = async () => {
    try {
      const [weeklyResponse, subjectResponse] = await Promise.all([
        progressService.getWeeklyProgress(),
        progressService.getSubjectProgress(),
      ]);

      if (weeklyResponse.success) {
        setWeeklyData(weeklyResponse.weeklyData);
      }
      if (subjectResponse.success) {
        setSubjectData(subjectResponse.subjectStats);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const getLineChartData = () => {
    if (!weeklyData?.dailyData) return null;
    
    return {
      labels: weeklyData.dailyData.map(d => d.day),
      datasets: [
        {
          data: weeklyData.dailyData.map(d => d.tasksCompleted || 0),
          color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getBarChartData = () => {
    if (!weeklyData?.dailyData) return null;
    
    return {
      labels: weeklyData.dailyData.map(d => d.day),
      datasets: [
        {
          data: weeklyData.dailyData.map(d => d.studyHours || 0),
        },
      ],
    };
  };

  const getPieChartData = () => {
    if (!subjectData?.length) return [];
    
    const pieColors = ['#4A90D9', '#FF6B6B', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'];
    return subjectData.slice(0, 6).map((subject, index) => ({
      name: subject.subject || subject._id,
      tasks: subject.totalTasks,
      color: pieColors[index % pieColors.length],
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const lineData = getLineChartData();
  const barData = getBarChartData();
  const pieData = getPieChartData();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Weekly Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Icon name="checkbox-marked-circle" size={28} color="#4A90D9" />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weeklyData?.totals?.tasksCompleted || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tasks Completed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="clock-outline" size={28} color="#FF9800" />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weeklyData?.totals?.studyHours || 0}h</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Study Hours</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="speedometer" size={28} color="#4CAF50" />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weeklyData?.totals?.avgProductivity || 0}%</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Productivity</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="timer" size={28} color="#9C27B0" />
            <Text style={[styles.summaryValue, { color: colors.text }]}>{weeklyData?.totals?.pomodoroSessions || 0}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pomodoros</Text>
          </View>
        </View>
      </View>

      {/* Tasks Completed Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Tasks Completed (Last 7 Days)</Text>
        {lineData && (
          <LineChart
            data={lineData}
            width={width - 48}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        )}
      </View>

      {/* Study Hours Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Study Hours (Last 7 Days)</Text>
        {barData && (
          <BarChart
            data={barData}
            width={width - 48}
            height={200}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        )}
      </View>

      {/* Subject Distribution */}
      <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Tasks by Subject</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={width - 48}
            height={200}
            chartConfig={chartConfig}
            accessor="tasks"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <View style={styles.emptyChart}>
            <Icon name="chart-pie" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No subject data available</Text>
          </View>
        )}
      </View>

      {/* Subject Progress List */}
      <View style={[styles.subjectCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Subject Progress</Text>
        {subjectData.length > 0 ? (
          subjectData.map((subject, index) => (
            <View key={index} style={[styles.subjectItem, { borderBottomColor: colors.border }]}>
              <View style={styles.subjectInfo}>
                <Text style={[styles.subjectName, { color: colors.text }]}>{subject.subject || subject._id}</Text>
                <Text style={[styles.subjectStats, { color: colors.textSecondary }]}>
                  {subject.completedTasks}/{subject.totalTasks} tasks
                </Text>
              </View>
              <View style={styles.subjectProgress}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${subject.completionRate || 0}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>{Math.round(subject.completionRate || 0)}%</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptySubjectText, { color: colors.textSecondary }]}>Add subjects to your tasks to see progress</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Icon name="trophy" size={24} color="#FFD700" />
          <Text style={[styles.actionText, { color: colors.text }]}>View Achievements</Text>
          <Icon name="chevron-right" size={24} color={colors.textSecondary} />
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
  summaryCard: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
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
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  subjectCard: {
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
  subjectItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  subjectStats: {
    fontSize: 14,
    color: '#666',
  },
  subjectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90D9',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '600',
    marginLeft: 12,
    width: 40,
    textAlign: 'right',
  },
  emptySubjectText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProgressScreen;
