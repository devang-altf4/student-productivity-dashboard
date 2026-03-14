import api from './config';

export const taskService = {
  // Get all tasks with filters
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/tasks?${params}`);
    return response.data;
  },

  // Get single task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Get upcoming tasks
  getUpcomingTasks: async () => {
    const response = await api.get('/tasks/upcoming');
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  // Get task statistics
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update a task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete a task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Add subtask
  addSubtask: async (taskId, title) => {
    const response = await api.post(`/tasks/${taskId}/subtask`, { title });
    return response.data;
  },

  // Update subtask
  updateSubtask: async (taskId, subtaskId, completed) => {
    const response = await api.put(`/tasks/${taskId}/subtask/${subtaskId}`, { completed });
    return response.data;
  },

  // Mark task as complete
  completeTask: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}`, { status: 'completed' });
    return response.data;
  },

  // Mark task as in progress
  startTask: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}`, { status: 'in_progress' });
    return response.data;
  }
};

export default taskService;
