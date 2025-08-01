# Task Assignment Notification Feature

## Overview

This feature implements a comprehensive notification system for task assignments in the Task Manager application. When users are assigned to tasks, they receive real-time notifications with different notification types based on their role and the task priority.

## Features

### 1. Real-time Notifications
- **Instant Delivery**: Notifications are sent immediately when tasks are assigned
- **Real-time Updates**: Uses Firebase Firestore real-time listeners for instant updates
- **Toast Notifications**: Shows toast messages for new notifications

### 2. Role-based Notification Types

#### For Assigned Users
- **Type**: `task_assignment`
- **Icon**: FiFileText
- **Color**: Primary theme color
- **Message**: "You have been assigned to [Task Name] in project [Project Name]"

#### For Project Managers
- **Type**: `task_assignment_manager`
- **Icon**: FiUsers
- **Color**: Blue (#3b82f6)
- **Message**: "[User Name] assigned [Task Name] to [X] team member(s)"
- **Condition**: Only sent if the assigner is not the project manager

#### For Super Managers
- **Type**: `task_assignment_super_manager`
- **Icon**: FiZap
- **Color**: Orange (#f59e0b)
- **Message**: "Task [Task Name] with [Priority] priority assigned in project [Project Name]"
- **Condition**: Sent for high priority tasks or when assigned by super managers

### 3. Notification Bell Component

#### Features
- **Badge Counter**: Shows unread notification count with animated pulse
- **Dropdown Menu**: Click to view all notifications
- **Mark as Read**: Individual and bulk mark as read functionality
- **Delete Notifications**: Remove unwanted notifications
- **Action Links**: Click notifications to navigate to related tasks/projects

#### Icons
- **Task Assignment**: FiFileText (Document icon)
- **Manager Summary**: FiUsers (Users icon)
- **Super Manager**: FiZap (Lightning icon)
- **Project Invitation**: FiFolder (Folder icon)
- **Status Change**: FiRefreshCw (Refresh icon)
- **High Priority Status**: FiAlertTriangle (Warning icon)

#### Styling
- **Modern Design**: Clean, modern UI with smooth animations
- **Responsive**: Works on all screen sizes
- **Theme Integration**: Uses existing theme variables and colors
- **Hover Effects**: Interactive elements with hover states

### 4. Notification Management

#### Actions Available
- **Mark as Read**: Click notification or use "Mark all read" button
- **Delete**: Remove individual notifications
- **External Link**: Open task/project in new tab
- **Time Display**: Shows relative time (e.g., "2m ago", "1h ago")

#### Notification States
- **Unread**: Highlighted with left border and unread dot
- **Read**: Normal styling
- **New**: Toast notification for recent notifications

## Technical Implementation

### 1. Services

#### `notificationService.js`
- **createTaskAssignmentNotification()**: Creates notifications for assigned users
- **createManagerNotification()**: Creates manager summary notifications
- **createSuperManagerNotification()**: Creates high-priority notifications
- **getUserNotifications()**: Fetches user notifications
- **markNotificationAsRead()**: Marks individual notification as read
- **markAllNotificationsAsRead()**: Marks all notifications as read
- **deleteNotification()**: Deletes notifications
- **subscribeToNotifications()**: Real-time subscription

### 2. Context

#### `NotificationContext.jsx`
- **Global State**: Manages notifications across the app
- **Real-time Updates**: Subscribes to Firestore changes
- **Toast Integration**: Shows toast messages for new notifications
- **Error Handling**: Graceful error handling with user feedback

### 3. Components

#### `NotificationBell/index.jsx`
- **UI Component**: Notification bell with dropdown
- **State Management**: Uses NotificationContext
- **User Interactions**: Handles clicks, mark as read, delete
- **Responsive Design**: Adapts to different screen sizes

#### `NotificationBell/NotificationBell.scss`
- **Modern Styling**: Clean, professional design
- **Animations**: Smooth transitions and hover effects
- **Theme Integration**: Uses CSS variables for consistency
- **Mobile Responsive**: Optimized for mobile devices

### 4. Integration

#### Task Assignment Flow
1. **Task Creation**: When a task is created with assignees
2. **Task Update**: When task assignees are changed
3. **Notification Creation**: System creates appropriate notifications
4. **Real-time Delivery**: Users receive notifications instantly

#### Header Integration
- **Notification Bell**: Added to header navigation
- **Positioning**: Right-aligned before user dropdown
- **Styling**: Consistent with existing header design

## Database Schema

### Notifications Collection
```javascript
{
  userId: string,           // Recipient user ID
  type: string,            // Notification type
  title: string,           // Notification title
  message: string,         // Notification message
  taskId: string,          // Related task ID
  projectId: string,       // Related project ID
  projectName: string,     // Project name
  taskTitle: string,       // Task title
  priority: string,        // Task priority
  deadline: string,        // Task deadline
  assignedBy: string,      // User who assigned the task
  assignedByName: string,  // Name of user who assigned
  assignedUsers: array,    // Array of assigned user IDs
  read: boolean,           // Read status
  createdAt: timestamp,    // Creation timestamp
  readAt: timestamp,       // Read timestamp
  actionUrl: string        // URL to navigate to
}
```

## Usage Examples

### 1. Creating a Task with Notifications
```javascript
const taskData = {
  title: "Design Homepage",
  description: "Create new homepage design",
  priority: "high",
  assignee: ["user1", "user2"],
  deadline: "2024-01-15"
};

await createTask(projectId, taskData);
// Automatically creates notifications for assigned users
```

### 2. Testing Notifications
```javascript
// Use the NotificationTest component for development
<NotificationTest />
// Click "Send Test Notification" to test the system
```

### 3. Custom Notification Types
```javascript
// Add new notification types in notificationService.js
await notificationService.createCustomNotification(
  userId,
  'custom_type',
  'Custom Title',
  'Custom message',
  additionalData
);
```

## Configuration

### Environment Variables
- No additional environment variables required
- Uses existing Firebase configuration

### Firebase Rules
```javascript
// Add to Firestore rules for notifications collection
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     request.auth.token.role == 'super_manager');
}
```

## Future Enhancements

### 1. Email Notifications
- Send email notifications for important assignments
- Configurable email preferences
- Email templates for different notification types

### 2. Push Notifications
- Browser push notifications
- Mobile app notifications
- Notification sound settings

### 3. Advanced Features
- Notification preferences per user
- Notification categories and filtering
- Bulk notification actions
- Notification history and analytics

### 4. Integration Features
- Slack/Discord integration
- Calendar integration for deadlines
- Third-party notification services

## Testing

### Manual Testing
1. **Create Task**: Assign users to a task
2. **Check Notifications**: Verify notifications appear in bell
3. **Mark as Read**: Test individual and bulk mark as read
4. **Delete Notifications**: Test deletion functionality
5. **Navigation**: Test clicking notifications to navigate

### Automated Testing
```javascript
// Test notification creation
test('creates task assignment notification', async () => {
  const taskData = { /* test data */ };
  await createTask(projectId, taskData);
  // Verify notification was created in Firestore
});

// Test notification display
test('displays notification in bell', () => {
  // Render NotificationBell component
  // Verify notification appears
});
```

## Performance Considerations

### 1. Real-time Listeners
- **Efficient Queries**: Only listen to user's notifications
- **Cleanup**: Properly unsubscribe on component unmount
- **Pagination**: Consider pagination for large notification lists

### 2. Database Optimization
- **Indexes**: Create indexes on userId and createdAt
- **Batch Operations**: Use batch writes for multiple notifications
- **Cleanup**: Implement notification cleanup for old notifications

### 3. UI Performance
- **Virtual Scrolling**: For large notification lists
- **Lazy Loading**: Load notifications on demand
- **Debouncing**: Debounce notification updates

## Security Considerations

### 1. Data Access
- **User Isolation**: Users can only see their own notifications
- **Role-based Access**: Super managers can see all notifications
- **Input Validation**: Validate all notification data

### 2. Rate Limiting
- **Notification Limits**: Prevent spam notifications
- **Time-based Limits**: Limit notifications per time period
- **User Consent**: Allow users to opt-out of notifications

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check Firebase connection
   - Verify user authentication
   - Check Firestore rules

2. **Real-time Updates Not Working**
   - Verify subscription cleanup
   - Check network connectivity
   - Review Firestore listener setup

3. **Performance Issues**
   - Implement pagination
   - Add database indexes
   - Optimize queries

### Debug Tools
- **Browser Console**: Check for JavaScript errors
- **Firebase Console**: Monitor Firestore operations
- **Network Tab**: Check API calls and responses

## Conclusion

The notification feature provides a comprehensive solution for task assignment notifications with real-time updates, role-based notifications, and a modern UI. The implementation is scalable, secure, and follows best practices for React and Firebase applications. 