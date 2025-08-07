// Utility functions for handling Firebase timestamps and date formatting

/**
 * Formats a Firebase timestamp or date object to a readable string
 * @param {Object|Date|string} timestamp - Firebase timestamp object, Date object, or date string
 * @param {string} formatStr - Format string for date-fns format function
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, formatStr = 'MMM dd, yyyy') => {
  if (!timestamp) return 'N/A';
  
  let date;
  
  // If it's a Firebase timestamp object
  if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  }
  // If it's already a Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  // If it's a string, try to parse it
  else {
    try {
      date = new Date(timestamp);
    } catch (error) {
      return 'N/A';
    }
  }
  
  // Use native toLocaleDateString for simple formatting
  if (formatStr === 'MMM dd') {
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
  }
  if (formatStr === 'MMM dd, yyyy') {
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }
  if (formatStr === 'MMM dd, HH:mm') {
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit' }) + 
           ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  if (formatStr === 'MMM dd, yyyy HH:mm') {
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }) + 
           ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString();
};

export const dateUtils = {
  getCurrentDate: () => new Date().toISOString(),
  
  isPast: (date) => {
    const checkDate = new Date(date);
    return checkDate < new Date();
  },
  
  isToday: (date) => {
    const checkDate = new Date(date);
    const today = new Date();
    return checkDate.toDateString() === today.toDateString();
  },
  
  isTomorrow: (date) => {
    const checkDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return checkDate.toDateString() === tomorrow.toDateString();
  },
  
  getRelativeTime: (date) => {
    const now = new Date();
    const checkDate = new Date(date);
    const diffInMs = now - checkDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return formatTimestamp(date);
  },
  
  getDeadlineStatus: (deadline) => {
    if (!deadline) return 'no-deadline';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffInMs = deadlineDate - now;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMs < 0) return 'overdue';
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'tomorrow';
    if (diffInDays <= 3) return 'urgent';
    if (diffInDays <= 7) return 'soon';
    return 'normal';
  }
}; 