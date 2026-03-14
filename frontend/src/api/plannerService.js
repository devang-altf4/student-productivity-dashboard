import api from './config';

export const plannerService = {
  // Get planner for date range
  getPlanners: async (startDate, endDate) => {
    const response = await api.get('/planner', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },

  // Get today's planner
  getTodayPlanner: async () => {
    const response = await api.get('/planner/today');
    return response.data;
  },

  // Get planner for specific date
  getPlannerByDate: async (date) => {
    const response = await api.get(`/planner/${date}`);
    return response.data;
  },

  // Create or update planner
  savePlanner: async (plannerData) => {
    const response = await api.post('/planner', plannerData);
    return response.data;
  },

  // Add activity to planner
  addActivity: async (date, activityData) => {
    const response = await api.post(`/planner/${date}/activity`, activityData);
    return response.data;
  },

  // Update activity
  updateActivity: async (date, activityId, activityData) => {
    const response = await api.put(`/planner/${date}/activity/${activityId}`, activityData);
    return response.data;
  },

  // Delete activity
  deleteActivity: async (date, activityId) => {
    const response = await api.delete(`/planner/${date}/activity/${activityId}`);
    return response.data;
  },

  // Add goal
  addGoal: async (date, goalData) => {
    const response = await api.post(`/planner/${date}/goal`, goalData);
    return response.data;
  },

  // Update reflection
  updateReflection: async (date, reflectionData) => {
    const response = await api.put(`/planner/${date}/reflection`, reflectionData);
    return response.data;
  },

  // Update pomodoro sessions
  updatePomodoro: async (date, pomodoroData) => {
    const response = await api.put(`/planner/${date}/pomodoro`, pomodoroData);
    return response.data;
  }
};

export default plannerService;
