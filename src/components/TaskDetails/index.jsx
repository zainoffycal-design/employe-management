import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
import RichTextViewer from '../RichTextViewer';
import TimeTracker from '../TimeTracker';
import { getPriorityColor, getStatusColor, getStatusDisplayName, formatRelativeTime, formatDate } from '../../utils/uiUtils';
import './TaskDetails.scss';

const TaskDetails = memo(({ task, onClose, onEdit, onDelete, users, project }) => {
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

  const handleTimeUpdate = async (timeData) => {
    try {
      await updateTask(currentTask.projectId, currentTask.id, timeData);
    } catch (error) {
      console.error('Error updating task time:', error);
      setError('Failed to update time tracking');
    }
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
        <RichTextViewer content={currentTask.description} />
      </div>

      <div className="task-info-compact">
        <div className="info-row">
          <div className="info-group">
            <FiUsers size={12} />
            <span className="info-label">Assigned:</span>
            <span className="info-value">
              {currentTask.assignee && Array.isArray(currentTask.assignee) ? (
                currentTask.assignee.map(assigneeId => {
                  const user = users.find(u => u.id === assigneeId);
                  return user ? user.name : null;
                }).filter(Boolean).join(', ')
              ) : currentTask.assignee ? (
                users.find(u => u.id === currentTask.assignee)?.name || 'Unknown'
              ) : (
                'Unassigned'
              )}
            </span>
          </div>
          
          {currentTask.deadline && (
            <div className="info-group">
              <FiCalendar size={12} />
              <span className="info-label">Due:</span>
              <span className="info-value">{formatDate(currentTask.deadline)}</span>
            </div>
          )}
        </div>

        <div className="info-row">
          <div className="info-group">
            <FiClock size={12} />
            <span className="info-label">Created:</span>
            <span className="info-value">{formatDate(currentTask.createdAt)}</span>
          </div>
          
          {currentTask.totalHours > 0 ? (
            <div className="info-group">
              <FiClock size={12} />
              <span className="info-label">Hours:</span>
              <span className="info-value">{currentTask.totalHours.toFixed(1)}h</span>
            </div>
          ) : null}
        </div>
      </div>

      <TimeTracker 
        task={currentTask}
        onUpdate={handleTimeUpdate}
        disabled={!hasEditAccess}
        currentUser={currentUser}
        users={users}
      />

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
});

TaskDetails.displayName = 'TaskDetails';

export default TaskDetails; 