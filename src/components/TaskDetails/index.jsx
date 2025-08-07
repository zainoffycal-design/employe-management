import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiSend, 
  FiUser, 
  FiClock, 
  FiCalendar,
  FiFlag,
  FiUsers,
  FiEdit3,
  FiTrash2
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import Avatar from '../Avatar';
import Button from '../Button';
import './TaskDetails.scss';

const TaskDetails = ({ task, onClose, onEdit, onDelete, users, project }) => {
  const { currentUser } = useAuth();
  const { updateTask, tasks } = useTask();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentTask = tasks.find(t => t.id === task.id) || task;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      const comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        createdAt: new Date().toISOString()
      };

      const updatedComments = [...(currentTask.comments || []), comment];
      
      await updateTask(currentTask.projectId, currentTask.id, {
        comments: updatedComments
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(e);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#15A970';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#8B5CF6';
      case 'in-progress': return '#15A970';
      case 'done': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'todo': return 'Not Started';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Complete';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
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

  const formatRelativeTime = (dateString) => {
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

  const hasEditAccess = 
    currentUser.role === 'super_manager' || 
    project?.managerId === currentUser.uid ||
    project?.teamMembers?.includes(currentUser.uid);

  return (
    <div className="task-details">
      <div className="task-header">
        <div className="task-title-section">
          <h2 className="task-title">{currentTask.title}</h2>
          <div className="task-meta">
            <span className="status-badge" style={{ backgroundColor: getStatusColor(currentTask.status) }}>
              {getStatusDisplayName(currentTask.status)}
            </span>
            <span className="priority-badge" style={{ backgroundColor: getPriorityColor(currentTask.priority) }}>
              {currentTask.priority}
            </span>
          </div>
        </div>
        
        {hasEditAccess && (
          <div className="task-actions">
            <button
              className="action-btn"
              onClick={() => onEdit(currentTask)}
              title="Edit task"
            >
              <FiEdit3 size={16} />
            </button>
            <button
              className="action-btn delete"
              onClick={() => onDelete(currentTask)}
              title="Delete task"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="task-description">
        <h4>Description</h4>
        <p>{currentTask.description || 'No description provided.'}</p>
      </div>

      <div className="task-info-grid">
        <div className="info-item">
          <FiUsers size={14} />
          <div>
            <label>Assigned:</label>
            <div className="assignees">
              {currentTask.assignee && Array.isArray(currentTask.assignee) ? (
                currentTask.assignee.map(assigneeId => {
                  const user = users.find(u => u.id === assigneeId);
                  return user ? (
                    <Avatar
                      key={assigneeId}
                      src={user.avatar}
                      name={user.name}
                      size="small"
                      title={user.name}
                    />
                  ) : null;
                })
              ) : currentTask.assignee ? (
                <Avatar
                  src={users.find(u => u.id === currentTask.assignee)?.avatar}
                  name={users.find(u => u.id === currentTask.assignee)?.name}
                  size="small"
                  title={users.find(u => u.id === currentTask.assignee)?.name}
                />
              ) : (
                <span className="no-assignee">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        {currentTask.deadline && (
          <div className="info-item">
            <FiCalendar size={14} />
            <div>
              <label>Due:</label>
              <span>{formatDate(currentTask.deadline)}</span>
            </div>
          </div>
        )}

        <div className="info-item">
          <FiClock size={14} />
          <div>
            <label>Created:</label>
            <span>{formatDate(currentTask.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="comments-section">
        <div className="comments-header">
          <FiMessageSquare size={14} />
          <h4>Comments ({currentTask.comments?.length || 0})</h4>
        </div>

        <div className="comments-list">
          {currentTask.comments && currentTask.comments.length > 0 ? (
            currentTask.comments.map(comment => (
              <motion.div
                key={comment.id}
                className="comment-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="comment-header">
                  <Avatar
                    src={comment.authorAvatar}
                    name={comment.authorName}
                    size="small"
                  />
                  <div className="comment-meta">
                    <span className="comment-author">{comment.authorName}</span>
                    <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                </div>
                <div className="comment-text">{comment.text}</div>
              </motion.div>
            ))
          ) : (
            <div className="no-comments">
              <FiMessageSquare size={20} />
              <p>No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>

        <form onSubmit={handleAddComment} className="comment-form">
          {error && (
            <div className="error-message">{error}</div>
          )}
          <div className="comment-input-wrapper">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              rows="1"
              className="comment-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="comment-submit"
              disabled={!newComment.trim() || loading}
              onClick={handleAddComment}
            >
              <FiSend size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetails; 