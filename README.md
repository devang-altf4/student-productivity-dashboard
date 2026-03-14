# Student Productivity and Progress Tracker App

A comprehensive mobile application designed to help students manage their tasks, track daily activities, and monitor academic progress. Built with React Native for the frontend and Node.js/Express for the backend.

## Features

### 🎓 For Students
- **User Registration & Login**: Secure account creation and authentication using JWT
- **Task Management**: Add, edit, delete, and track assignments, goals, and tasks
- **Daily Planner**: Plan daily activities with time slots, goals, and reflections
- **Reminders & Notifications**: Get alerts for upcoming deadlines
- **Progress Tracking**: View performance through interactive charts and progress bars
- **Achievements**: Earn badges and track accomplishments
- **Pomodoro Timer**: Built-in productivity timer for focused study sessions

### 👨‍🏫 For Faculty/Admin
- **Student Management**: View and manage assigned students
- **Progress Monitoring**: Track student performance and completion rates
- **Feedback System**: Provide feedback on student tasks and assignments
- **Analytics Dashboard**: View aggregated student statistics

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Scheduled Tasks**: node-cron

### Frontend
- **Framework**: React Native 0.73+
- **Navigation**: React Navigation 6.x
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: react-native-chart-kit
- **Icons**: react-native-vector-icons

## Project Structure

```
Student-Productivity-and-ProgressTracker-App/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Planner.js
│   │   ├── Notification.js
│   │   └── Progress.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   ├── planner.js
│   │   ├── progress.js
│   │   ├── admin.js
│   │   └── notifications.js
│   ├── middleware/
│   │   └── auth.js
│   ├── services/
│   │   └── notificationService.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── config.js
    │   │   ├── authService.js
    │   │   ├── taskService.js
    │   │   ├── plannerService.js
    │   │   ├── progressService.js
    │   │   └── notificationService.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── navigation/
    │   │   ├── AppNavigator.js
    │   │   └── MainTabNavigator.js
    │   └── screens/
    │       ├── auth/
    │       │   ├── LoginScreen.js
    │       │   └── RegisterScreen.js
    │       ├── dashboard/
    │       │   └── DashboardScreen.js
    │       ├── tasks/
    │       │   ├── TasksScreen.js
    │       │   ├── AddTaskScreen.js
    │       │   ├── TaskDetailScreen.js
    │       │   └── EditTaskScreen.js
    │       ├── planner/
    │       │   ├── PlannerScreen.js
    │       │   └── PlannerDetailScreen.js
    │       ├── progress/
    │       │   └── ProgressScreen.js
    │       ├── achievements/
    │       │   └── AchievementsScreen.js
    │       ├── settings/
    │       │   └── SettingsScreen.js
    │       ├── profile/
    │       │   └── ProfileScreen.js
    │       ├── notifications/
    │       │   └── NotificationsScreen.js
    │       └── admin/
    │           ├── StudentListScreen.js
    │           └── StudentDetailScreen.js
    ├── App.js
    └── package.json
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation
- React Native development environment (Android Studio / Xcode)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-secret-key
   JWT_EXPIRE=7d
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install iOS pods (for iOS development):
   ```bash
   cd ios && pod install && cd ..
   ```

4. Update the API URL in `src/api/config.js`:
   ```javascript
   const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
   ```

5. Start the development server:
   ```bash
   npx react-native start
   ```

6. Run on device/emulator:
   ```bash
   # Android
   npx react-native run-android
   
   # iOS
   npx react-native run-ios
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Update password

### Tasks
- `GET /api/tasks` - Get all user tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats` - Get task statistics

### Planner
- `GET /api/planner/today` - Get today's planner
- `GET /api/planner/:date` - Get planner by date
- `POST /api/planner` - Create/update planner
- `POST /api/planner/:date/activities` - Add activity
- `PUT /api/planner/:date/activities/:activityId` - Update activity
- `DELETE /api/planner/:date/activities/:activityId` - Delete activity

### Progress
- `GET /api/progress/dashboard` - Get dashboard data
- `GET /api/progress/weekly` - Get weekly progress
- `GET /api/progress/monthly` - Get monthly progress
- `GET /api/progress/subjects` - Get subject-wise progress
- `GET /api/progress/achievements` - Get achievements

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications` - Clear all notifications

### Admin (Faculty/Admin only)
- `GET /api/admin/students` - Get all students
- `GET /api/admin/students/:id` - Get student details
- `POST /api/admin/feedback/:taskId` - Provide task feedback

## User Roles

| Role | Permissions |
|------|-------------|
| Student | Full access to personal tasks, planner, progress, achievements |
| Faculty | All student permissions + view assigned students + provide feedback |
| Admin | All faculty permissions + manage all users + system configuration |

## Database Models

### User
- name, email, password, role, studentId, department, year, bio
- stats (tasksCompleted, currentStreak, achievements)

### Task
- title, description, type, priority, status, dueDate, subject
- subtasks, progress, tags, recurrence
- facultyFeedback (feedback, providedBy, providedAt)

### Planner
- date, activities, dailyGoals, reflection, pomodoroSessions
- mood, productivity score

### Notification
- user, title, message, type, read, task reference

### Progress
- user, date, daily/weekly/monthly statistics
- achievements, study hours, tasks completed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@studenttracker.com or open an issue in the repository.
