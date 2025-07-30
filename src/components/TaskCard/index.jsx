import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiUser, FiTag, FiMoreVertical, FiEdit2, FiTrash2,
  FiCalendar, FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { formatTimestamp } from '../../utils/dateUtils';
import './TaskCard.scss';

const TaskCard = ({ task, compact = false, showActions = true, onEdit, onDelete, onMove, getUserById }) => {
  const { canEditTasks, canDeleteTasks, canMoveTasks } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const getAssigneeNames = () => {
    if (!task.assignee) return null;
    
    if (Array.isArray(task.assignee)) {
      return task.assignee.map(id => getUserById?.(id)?.name || 'Unknown').join(', ');
    } else {
      return getUserById?.(task.assignee)?.name || 'Unknown';
    }
  };

  const assignee = getAssigneeNames();
  const assignedBy = task.assignedBy ? getUserById?.(task.assignedBy) : null;

  const isOverdue = () => {
    if (!task.deadline) return false;
    const now = new Date();
    const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
    return deadline < now && task.status !== 'done';
  };

  const isDueSoon = () => {
    if (!task.deadline) return false;
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
    return deadline >= now && deadline <= tomorrow && task.status !== 'done';
  };

  const formatDeadline = () => {
    if (!task.deadline) return '';
    const deadline = task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline);
    return formatTimestamp(deadline);
  };

  const getDeadlineStatus = () => {
    if (!task.deadline) return null;
    if (isOverdue()) return 'overdue';
    if (isDueSoon()) return 'due-soon';
    return 'normal';
  };

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
    setShowMenu(!showMenu);
  };

  const handleAction = (action) => {
    setShowMenu(false);
    if (action === 'edit' && onEdit) onEdit();
    if (action === 'delete' && onDelete) onDelete();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'urgent': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in-progress': return 'warning';
      case 'review': return 'info';
      case 'done': return 'success';
      default: return 'secondary';
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  return (
    <>
      <div 
        className={`task-card ${compact ? 'compact' : ''} ${deadlineStatus ? deadlineStatus : ''}`}
        draggable={canMoveTasks()}
      >
        <div className="task-header">
          <div className="task-title">
            <h4>{task.title}</h4>
            {deadlineStatus && (
              <span className={`deadline-badge ${deadlineStatus}`}>
                {deadlineStatus === 'overdue' ? 'Overdue' : 'Due Soon'}
              </span>
            )}
          </div>
          
          <div className="task-badges">
            <span className={`badge priority ${priorityColor}`}>
              {task.priority}
            </span>
            <span className={`badge status ${statusColor}`}>
              {task.status}
            </span>
          </div>
          
          {showActions && (canEditTasks() || canDeleteTasks() || canMoveTasks()) && (
            <div className="task-menu">
              <button 
                className="menu-trigger"
                onClick={handleMenuClick}
              >
                <FiMoreVertical size={16} />
              </button>
            </div>
          )}
        </div>
        
        {!compact && (
          <>
            {task.description && (
              <div className="task-description">
                <p>{task.description}</p>
              </div>
            )}
            
            <div className="task-meta">
              {assignee && (
                <div className="meta-item">
                  <FiUser size={14} />
                  <span>Assigned to {assignee}</span>
                </div>
              )}
              {assignedBy && (
                <div className="meta-item">
                  <FiUser size={14} />
                  <span>Assigned by {assignedBy.name}</span>
                </div>
              )}
              <div className="meta-item">
                <FiClock size={14} />
                <span>Created {formatTimestamp(task.createdAt)}</span>
              </div>
              {task.deadline && (
                <div className="meta-item">
                  <FiCalendar size={14} />
                  <span className={isOverdue() ? 'text-danger' : isDueSoon() ? 'text-warning' : ''}>
                    Due: {formatDeadline()}
                  </span>
                </div>
              )}
              {task.estimatedHours > 0 && (
                <div className="meta-item">
                  <FiClock size={14} />
                  <span>Est: {task.estimatedHours}h</span>
                </div>
              )}
              {task.actualHours > 0 && (
                <div className="meta-item">
                  <FiCheckCircle size={14} />
                  <span>Actual: {task.actualHours}h</span>
                </div>
              )}
            </div>
            
            {task.tags && task.tags.length > 0 && (
              <div className="task-tags">
                {task.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    <FiTag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="task-menu-dropdown"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: menuPosition.x,
              top: menuPosition.y,
              zIndex: 1000
            }}
          >
            {canEditTasks() && (
              <button onClick={() => handleAction('edit')}>
                <FiEdit2 size={16} />
                Edit Task
              </button>
            )}
            {canDeleteTasks() && (
              <button onClick={() => handleAction('delete')} className="delete">
                <FiTrash2 size={16} />
                Delete Task
              </button>
            )}
            {canMoveTasks() && onMove && (
              <>
                <div className="dropdown-divider"></div>
                <div className="move-options">
                  <span className="move-label">Move to:</span>
                  <button onClick={() => { handleAction('move'); onMove('todo'); }}>
                    To Do
                  </button>
                  <button onClick={() => { handleAction('move'); onMove('in-progress'); }}>
                    In Progress
                  </button>
                  <button onClick={() => { handleAction('move'); onMove('review'); }}>
                    Review
                  </button>
                  <button onClick={() => { handleAction('move'); onMove('done'); }}>
                    Done
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TaskCard; 