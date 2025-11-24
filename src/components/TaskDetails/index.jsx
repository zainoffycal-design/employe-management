import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
  FiTrash2,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useTask } from '../../contexts/TaskContext';
import Avatar from '../Avatar';
import RichTextViewer from '../RichTextViewer';
import TimeTracker from '../TimeTracker';
import TaskReview from '../TaskReview';
import { getPriorityColor, getStatusColor, getStatusDisplayName, formatRelativeTime, formatDate, extractMentionsFromText } from '../../utils/uiUtils';
import LinkifiedText from '../LinkifiedText';
import { userManagementService } from '../../services/firebaseService';
import { notificationService } from '../../services/notificationService';
import './TaskDetails.scss';

const TaskDetails = memo(({ task, onClose, onEdit, onDelete, users, project }) => {
  const { currentUser } = useAuth();
  const { updateTask, tasks } = useTask();
  const [newComment, setNewComment] = useState('');
  const [displayComment, setDisplayComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const commentInputRef = useRef(null);
  const mentionDropdownRef = useRef(null);
  const inputWrapperRef = useRef(null);

  const currentTask = tasks.find(t => t.id === task.id) || task;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await userManagementService.getAllUsers();
        const activeUsers = usersData.filter(user => user.isActive !== false);
        setAllUsers(activeUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target) &&
        commentInputRef.current &&
        !commentInputRef.current.contains(event.target)
      ) {
        setShowMentionDropdown(false);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMentionDropdown]);

  const projectCollaborators = useMemo(() => {
    if (!project?.teamMembers?.length || !allUsers.length) return [];
    const memberIds = new Set(project.teamMembers);
    return allUsers.filter(user => 
      memberIds.has(user.id) && 
      user.isActive !== false
    );
  }, [project?.teamMembers, allUsers]);

  const filteredUsers = useMemo(() => {
    if (!projectCollaborators.length) return [];
    const query = mentionQuery.toLowerCase();
    const filtered = projectCollaborators.filter(user => 
      user.id !== currentUser.uid &&
      (query === '' || 
       user.name.toLowerCase().includes(query) || 
       (user.email && user.email.toLowerCase().includes(query)))
    );
    return filtered.slice(0, 8);
  }, [mentionQuery, projectCollaborators, currentUser.uid]);

  const handleCommentChange = (e) => {
    const displayValue = e.target.value;
    setDisplayComment(displayValue);
    
    const rawValue = getRawTextFromDisplay(displayValue);
    setNewComment(rawValue);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = displayValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionDropdown(false);
        setMentionQuery('');
      }
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
    }
  };

  const insertMention = (user) => {
    const cursorPosition = commentInputRef.current.selectionStart;
    const displayBeforeCursor = displayComment.substring(0, cursorPosition);
    const displayAfterCursor = displayComment.substring(cursorPosition);
    const lastAtIndex = displayBeforeCursor.lastIndexOf('@');
    
    const beforeMention = displayBeforeCursor.substring(0, lastAtIndex);
    const mentionDisplay = `@${user.name}`;
    const mentionData = `@[${user.name}](${user.id})`;
    const newDisplayText = beforeMention + mentionDisplay + ' ' + displayAfterCursor;
    const newRawText = beforeMention + mentionData + ' ' + displayAfterCursor;
    
    setNewComment(newRawText);
    setDisplayComment(newDisplayText);
    setShowMentionDropdown(false);
    setMentionQuery('');
    
    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPosition = beforeMention.length + mentionDisplay.length + 1;
        commentInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        commentInputRef.current.focus();
      }
    }, 0);
  };

  const updateDisplayText = (text) => {
    if (!text) {
      setDisplayComment('');
      return;
    }
    const display = text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
    setDisplayComment(display);
  };

  const getRawTextFromDisplay = useCallback((displayText) => {
    if (!displayText || !projectCollaborators.length) return displayText;
    
    let result = displayText;
    const sortedCollaborators = [...projectCollaborators].sort((a, b) => b.name.length - a.name.length);
    
    sortedCollaborators.forEach(user => {
      const displayMention = `@${user.name}`;
      const rawMention = `@[${user.name}](${user.id})`;
      const regex = new RegExp(displayMention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, rawMention);
    });
    
    return result;
  }, [projectCollaborators]);

  const handleKeyDown = (e) => {
    if (showMentionDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment(e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      const mentions = extractMentionsFromText(newComment);
      const mentionedUserIds = mentions.map(m => m.userId);

      const comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        createdAt: new Date().toISOString(),
        mentions: mentionedUserIds
      };

      const updatedComments = [comment, ...(currentTask.comments || [])];
      
      await updateTask(currentTask.projectId, currentTask.id, {
        comments: updatedComments
      });

      if (mentionedUserIds.length > 0 && project) {
        try {
          await notificationService.createCommentMentionNotification(
            mentionedUserIds,
            comment,
            currentTask,
            project,
            currentUser
          );
        } catch (notifError) {
          console.error('Error creating mention notifications:', notifError);
        }
      }

      setNewComment('');
      setDisplayComment('');
      setShowMentionDropdown(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
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

  const canEditComment = (comment) => {
    return currentUser.role === 'super_manager' || 
           comment.authorId === currentUser.uid;
  };

  const canDeleteComment = (comment) => {
    return currentUser.role === 'super_manager';
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    const displayText = comment.text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
    setEditCommentText(displayText);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editCommentText.trim()) return;

    setLoading(true);
    setError('');

    try {
      const rawText = getRawTextFromDisplay(editCommentText);
      const updatedComments = currentTask.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, text: rawText.trim(), updatedAt: new Date().toISOString() }
          : comment
      );

      await updateTask(currentTask.projectId, currentTask.id, {
        comments: updatedComments
      });

      setEditingComment(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setLoading(true);
    setError('');

    try {
      const updatedComments = currentTask.comments.filter(comment => comment.id !== commentId);

      await updateTask(currentTask.projectId, currentTask.id, {
        comments: updatedComments
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    } finally {
      setLoading(false);
    }
  };


  const hasEditAccess = 
    currentUser.role === 'super_manager' || 
    currentUser.role === 'manager' ||
    project?.managerId === currentUser.uid;

  const isAssignedToTask = useMemo(() => {
    if (!currentTask.assignee) return false;
    if (Array.isArray(currentTask.assignee)) {
      return currentTask.assignee.includes(currentUser.uid);
    }
    return currentTask.assignee === currentUser.uid;
  }, [currentTask.assignee, currentUser.uid]);

  const canTrackTime = hasEditAccess || isAssignedToTask;

  const sortedComments = useMemo(() => {
    if (!currentTask.comments) return [];
    return [...currentTask.comments].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [currentTask.comments]);

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
        disabled={!canTrackTime}
        currentUser={currentUser}
        users={users}
      />

      {(currentUser.role === 'super_manager' || currentUser.role === 'manager') && currentTask.status === 'done' && (
        <TaskReview 
          task={currentTask}
          allTasks={tasks}
          currentUser={currentUser}
          users={users}
          onSave={(data) => updateTask(currentTask.projectId, currentTask.id, data)}
        />
      )}

      {project?.teamMembers && project.teamMembers.length > 0 && (
        <div className="collaborators-section">
          <div className="collaborators-header">
            <FiUsers size={14} />
            <h4>Project Collaborators ({project.teamMembers.length})</h4>
          </div>
          <div className="collaborators-list">
            {project.teamMembers.map(memberId => {
              const member = users.find(u => u.id === memberId);
              if (!member) return null;
              
              return (
                <div key={memberId} className="collaborator-badge">
                  <Avatar
                    src={member.avatar}
                    name={member.name}
                    size="small"
                  />
                  <span className="collaborator-name">{member.name}</span>
                  <span className="collaborator-role">{member.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="comments-section">
        <div className="comments-header">
          <FiMessageSquare size={14} />
          <h4>Comments ({currentTask.comments?.length || 0})</h4>
        </div>

        <div className="comments-list">
          {sortedComments.length > 0 ? (
            sortedComments.map(comment => (
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
                    <span className="comment-time">
                      {formatRelativeTime(comment.createdAt)}
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="edited-indicator"> (edited)</span>
                      )}
                    </span>
                  </div>
                  {(canEditComment(comment) || canDeleteComment(comment)) && (
                    <div className="comment-actions">
                      {canEditComment(comment) && (
                        <button
                          className="comment-action-btn"
                          onClick={() => handleEditComment(comment)}
                          title="Edit comment"
                          disabled={loading}
                        >
                          <FiEdit3 size={12} />
                        </button>
                      )}
                      {canDeleteComment(comment) && (
                        <button
                          className="comment-action-btn delete"
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Delete comment"
                          disabled={loading}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {editingComment === comment.id ? (
                  <div className="comment-edit-form">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      className="comment-edit-input"
                      rows="2"
                      disabled={loading}
                    />
                    <div className="comment-edit-actions">
                      <button
                        className="comment-edit-btn save"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editCommentText.trim() || loading}
                      >
                        <FiCheck size={12} />
                      </button>
                      <button
                        className="comment-edit-btn cancel"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-text">
                    <LinkifiedText text={comment.text} />
                  </div>
                )}
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
          <div className="comment-input-wrapper" ref={inputWrapperRef}>
            <textarea
              ref={commentInputRef}
              value={displayComment}
              onChange={handleCommentChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment... (use @ to mention someone)"
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
            {showMentionDropdown && filteredUsers.length > 0 && (
              <div
                ref={mentionDropdownRef}
                className="mention-dropdown"
              >
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedMentionIndex(index)}
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="small"
                    />
                    <div className="mention-item-info">
                      <span className="mention-item-name">{user.name}</span>
                      {user.email && (
                        <span className="mention-item-email">{user.email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
});

TaskDetails.displayName = 'TaskDetails';

export default TaskDetails; 