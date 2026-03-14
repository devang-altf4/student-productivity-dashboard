import api from './config';

export const progressService = {
  // Get dashboard data
  getDashboard: async () => {
    const response = await api.get('/progress/dashboard');
    return response.data;
  },

  // Get weekly progress
  getWeeklyProgress: async () => {
    const response = await api.get('/progress/weekly');
    return response.data;
  },

  // Get monthly progress
  getMonthlyProgress: async (month, year) => {
    const response = await api.get('/progress/monthly', {
      params: { month, year }
    });
    return response.data;
  },

  // Get subject-wise progress
  getSubjectProgress: async () => {
    const response = await api.get('/progress/subjects');
    return response.data;
  },

  // Get achievements
  getAchievements: async () => {
    const response = await api.get('/progress/achievements');
    return response.data;
  },

  // Log study hours
  logStudyHours: async (hours, date) => {
    const response = await api.put('/progress/study-hours', { hours, date });
    return response.data;
  }
};

export default progressService;
