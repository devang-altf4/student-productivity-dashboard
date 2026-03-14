const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const plannerRoutes = require('./routes/planner');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// Import notification service for scheduled tasks
const { checkUpcomingDeadlines } = require('./services/notificationService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());



// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Productivity and Progress Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      planner: '/api/planner',
      progress: '/api/progress',
      admin: '/api/admin',
      notifications: '/api/notifications'
    }
  });
});

// Schedule notification check every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled notification check...');
  await checkUpcomingDeadlines();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
