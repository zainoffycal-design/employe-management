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