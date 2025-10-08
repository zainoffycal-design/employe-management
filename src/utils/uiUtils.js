export const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'super_manager': return 'danger';
    case 'manager': return 'warning';
    case 'designer': return 'info';
    case 'developer': return 'primary';
    case 'bd': return 'success';
    default: return 'secondary';
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'low': return '#15A970';
    case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    default: return '#6B7280';
  }
};

export const getStatusColor = (status) => {
  const colors = { 
    'todo': '#8B5CF6', 
    'in-progress': '#15A970', 
    'in-review': '#F59E0B', 
    'done': '#059669' 
  };
  return colors[status] || '#6B7280';
};

export const getStatusDisplayName = (status) => {
  const names = { 
    'todo': 'Todo', 
    'in-progress': 'In Progress', 
    'in-review': 'In Review', 
    'done': 'Complete' 
  };
  return names[status] || status;
};

export const getColumnColorByStatus = (status) => {
  switch (status) {
    case 'todo': return '#8B5CF6';
    case 'in-progress': return '#3B82F6';
    case 'in-review': return '#F59E0B';
    case 'done': return '#059669';
    default: return '#6B7280';
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export const formatCreatedTime = (createdAt) => {
  if (!createdAt) return '';
  
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = now - createdDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Created today';
  } else if (diffDays === 1) {
    return 'Created yesterday';
  } else if (diffDays < 7) {
    return `Created ${diffDays} days ago`;
  } else {
    return createdDate.toLocaleDateString();
  }
};

export const getRemainingTime = (deadline) => {
  if (!deadline) return null;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDateOnly = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  
  const diffTime = deadlineDateOnly - nowDate;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Overdue', type: 'overdue' };
  } else if (diffDays === 0) {
    return { text: 'Due today', type: 'urgent' };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', type: 'warning' };
  } else if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, type: 'warning' };
  } else {
    return { text: `Due in ${diffDays} days`, type: 'normal' };
  }
};

export const groupAndSortUsers = (users) => {
  const roleOrder = {
    'super_manager': 0,
    'manager': 1,
    'designer': 2,
    'developer': 3,
    'bd': 4
  };

  const groupedUsers = users.reduce((acc, user) => {
    const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, '') || 'user';
    const role = normalizedRole === 'supermanager' ? 'super_manager' : normalizedRole;
    
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {});

  Object.keys(groupedUsers).forEach(role => {
    groupedUsers[role].sort((a, b) => a.name.localeCompare(b.name));
  });

  return groupedUsers;
};

export const formatHours = (hours) => {
  if (!hours || hours === 0) return '0h';
  if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
  return `${hours.toFixed(1)}h`;
};

export const reactSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '48px',
    backgroundColor: 'white',
    borderColor: '#d1d5db',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#9ca3af'
    },
    '&:focus-within': {
      borderColor: '#15a970',
      boxShadow: '0 0 0 3px rgba(21, 169, 112, 0.1)'
    }
  }),
  option: (base, state) => ({
    ...base,
    padding: '8px 12px',
    backgroundColor: state.isSelected 
      ? '#f1f5f9'
      : state.isFocused 
      ? '#f8fafc'
      : 'white',
    color: '#334155',
    '&:active': {
      backgroundColor: '#f1f5f9'
    }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    margin: '2px',
    maxWidth: '200px'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#334155',
    padding: '2px 6px',
    fontSize: '0.875rem'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#64748b',
    '&:hover': {
      backgroundColor: '#e2e8f0',
      color: '#334155'
    }
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 8px',
    flexWrap: 'wrap',
    maxHeight: '120px',
    overflowY: 'auto'
  }),
  menu: (base) => ({
    ...base,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: '6px'
  }),
  groupHeading: (base) => ({
    ...base,
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'none',
    padding: '8px 12px',
    marginBottom: 0,
    backgroundColor: '#f8fafc'
  })
};

