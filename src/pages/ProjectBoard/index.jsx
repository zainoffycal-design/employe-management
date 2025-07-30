import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers,
  FiPlus,
  FiCalendar,
  FiClock,
  FiFlag,
  FiSearch,
  FiUser,
  FiEdit3,
  FiTrash2
} from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import Select from 'react-select';
import './ProjectBoard.scss';

const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, createTask, updateTask, deleteTask } = useTask();
  const { currentUser } = useAuth();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: [],
    deadline: '',
    status: 'todo',
    comments: [],
    links: [],
    progress: '0/3'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [draggedOverTask, setDraggedOverTask] = useState(null);
  const [reorderedTasks, setReorderedTasks] = useState({});

  // Find the current project
  const currentProject = projects.find(p => p.id === projectId);

  // Custom styles for react-select
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#cbd5e1'
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
    singleValue: (base) => ({
      ...base,
      color: '#334155'
    }),
    menu: (base) => ({
      ...base,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderRadius: '6px'
    })
  };

  const CustomOption = ({ children, ...props }) => {
    const { data } = props;
    return (
      <div 
        {...props.innerProps} 
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          backgroundColor: props.isFocused ? '#f8fafc' : 'white',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Avatar 
          src={data.avatar} 
          name={data.label}
          size="small"
          style={{ marginRight: '8px' }}
        />
        <div>
          <div style={{ fontSize: '0.875rem', color: '#334155' }}>{data.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{data.role}</div>
        </div>
      </div>
    );
  };

  // Load project team members
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userManagementService.getAllUsers();
        const projectUsers = allUsers.filter(user => 
          user.isActive && currentProject?.teamMembers.includes(user.id)
        );
        setUsers(projectUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    if (currentProject) {
      loadUsers();
    }
  }, [currentProject]);

  // Clear reordered tasks when tasks data changes
  useEffect(() => {
    setReorderedTasks({});
  }, [tasks]);

  // Create assignee options for react-select
  const assigneeOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    avatar: user.avatar
  }));

  // Create assignee filter options
  const assigneeFilterOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    avatar: user.avatar
  }));

  // Redirect if project doesn't exist
  useEffect(() => {
    if (!currentProject) {
      navigate('/');
      return;
    }
  }, [currentProject, navigate]);

  // Check if user has edit access
  const hasEditAccess = 
    currentUser.role === 'super_manager' || 
    currentProject?.managerId === currentUser.uid ||
    currentProject?.teamMembers?.includes(currentUser.uid);

  if (!currentProject) return null;

  // Filter tasks for this project
  const projectTasks = tasks.filter(task => task.projectId === projectId);

  // Filter tasks based on search term and assignee
  const filteredTasks = projectTasks.filter(task => {
    // Search term filter
    const matchesSearch = !searchTerm.trim() || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.assignee && Array.isArray(task.assignee) 
          ? task.assignee.some(assigneeId => {
              const user = users.find(u => u.id === assigneeId);
              return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
          : (() => {
              const user = users.find(u => u.id === task.assignee);
              return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
            })()
      );

    // Assignee filter
    const matchesAssignee = !selectedAssignee || 
      (task.assignee && Array.isArray(task.assignee) 
        ? task.assignee.includes(selectedAssignee.value)
        : task.assignee === selectedAssignee.value
      );

    return matchesSearch && matchesAssignee;
  });

  const tasksByStatus = {
    'Not Started': filteredTasks.filter(task => task.status === 'todo'),
    'Progress': filteredTasks.filter(task => task.status === 'in-progress'),
    'Complete': filteredTasks.filter(task => task.status === 'done')
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!newTask.title.trim()) {
        setError('Task title is required');
        return;
      }

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assignee: newTask.assignee,
        deadline: newTask.deadline,
        createdBy: currentUser.uid,
        status: 'todo'
      };

      await createTask(projectId, taskData);

      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assignee: [],
        deadline: '',
        status: 'todo'
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      assignee: Array.isArray(task.assignee) ? task.assignee : task.assignee ? [task.assignee] : []
    });
    setShowEditTask(true);
    setError('');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!editingTask.title.trim()) {
        setError('Task title is required');
        return;
      }

      const taskData = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assignee: editingTask.assignee,
        deadline: editingTask.deadline,
        status: editingTask.status
      };

      await updateTask(projectId, editingTask.id, taskData);

      setShowEditTask(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (task) => {
    setDeletingTask(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteTask(projectId, deletingTask.id);
      setShowDeleteConfirm(false);
      setDeletingTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId, taskId = null) => {
    e.preventDefault();
    setDraggedOverColumn(columnId);
    if (taskId) {
      setDraggedOverTask(taskId);
    }
  };

  const handleDrop = (e, columnId, targetTaskId = null) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    try {
      // If dropping on a specific task (reordering within same column)
      if (targetTaskId && draggedTask.status === columnId) {
        // Get current tasks in the column (either reordered or original)
        const currentTasksInColumn = getTasksForColumn(columnId);
        const draggedIndex = currentTasksInColumn.findIndex(t => t.id === draggedTask.id);
        
        if (targetTaskId === 'top') {
          // Dropping at the top of the column
          if (draggedIndex !== -1 && draggedIndex !== 0) {
            const newTasks = [...currentTasksInColumn];
            const [movedTask] = newTasks.splice(draggedIndex, 1);
            newTasks.unshift(movedTask);
            
            setReorderedTasks(prev => ({
              ...prev,
              [columnId]: newTasks
            }));
          }
        } else {
          // Dropping on a specific task
          const targetIndex = currentTasksInColumn.findIndex(t => t.id === targetTaskId);
          
          if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            // Reorder tasks within the same column
            const newTasks = [...currentTasksInColumn];
            const [movedTask] = newTasks.splice(draggedIndex, 1);
            newTasks.splice(targetIndex, 0, movedTask);
            
            // Update the reordered tasks state
            setReorderedTasks(prev => ({
              ...prev,
              [columnId]: newTasks
            }));
          }
        }
      } else if (draggedTask.status === columnId && !targetTaskId) {
        // Dropping at the end of the same column
        const currentTasksInColumn = getTasksForColumn(columnId);
        const draggedIndex = currentTasksInColumn.findIndex(t => t.id === draggedTask.id);
        
        if (draggedIndex !== -1 && draggedIndex !== currentTasksInColumn.length - 1) {
          // Move task to the end of the column
          const newTasks = [...currentTasksInColumn];
          const [movedTask] = newTasks.splice(draggedIndex, 1);
          newTasks.push(movedTask);
          
          // Update the reordered tasks state
          setReorderedTasks(prev => ({
            ...prev,
            [columnId]: newTasks
          }));
        }
      } else if (draggedTask.status !== columnId) {
        // Moving to a different column - update immediately for instant feedback
        updateTask(projectId, draggedTask.id, { status: columnId }).catch(error => {
          console.error('Error moving task:', error);
        });
        
        // Clear reordered tasks for the source column to refresh the view
        setReorderedTasks(prev => {
          const newState = { ...prev };
          delete newState[draggedTask.status];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
    
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setDraggedOverTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setDraggedOverTask(null);
  };

  const getStatusFromColumnId = (columnId) => {
    switch (columnId) {
      case 'todo': return 'Not Started';
      case 'in-progress': return 'Progress';
      case 'done': return 'Complete';
      default: return 'Not Started';
    }
  };

  const getTasksForColumn = (columnId) => {
    const status = getStatusFromColumnId(columnId);
    const reorderedTasksForColumn = reorderedTasks[columnId];
    
    if (reorderedTasksForColumn) {
      return reorderedTasksForColumn;
    }
    
    return tasksByStatus[status] || [];
  };

  const columns = [
    { id: 'todo', title: 'Not Started', color: '#8B5CF6', status: 'Not Started' },
    { id: 'in-progress', title: 'Progress', color: '#15A970', status: 'Progress' },
    { id: 'done', title: 'Complete', color: '#059669', status: 'Complete' }
  ];

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return '#8B5CF6';
      case 'Progress': return '#15A970';
      case 'Complete': return '#059669';
      default: return '#6B7280';
    }
  };

  const getColumnColorByStatus = (status) => {
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
      case 'in-progress': return 'Progress';
      case 'done': return 'Complete';
      default: return status;
    }
  };

  const getRemainingTime = (deadline) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
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

  const formatCreatedTime = (createdAt) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#15A970';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="project-board">
      <PageTitle 
        title={`${currentProject?.name} Tasks`}
        subtitle="Keep track of your team's tasks all in one place."
        icon={FiUsers}
        showBackButton={true}
        backTo="/projects"
        actions={
          <>
            <div className="filters-container">
          <div className={`search-box ${searchTerm.trim() ? 'search-active' : ''}`}>
            <FiSearch size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm.trim() && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'var(--gray-500)',
                  padding: '2px'
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
              
              <div className="assignee-filter">
                <Select
                  options={assigneeFilterOptions}
                  value={selectedAssignee}
                  onChange={setSelectedAssignee}
                  placeholder="Filter by assignee"
                  isClearable
                  styles={customStyles}
                  components={{ Option: CustomOption }}
                />
              </div>
            </div>
            
            {hasEditAccess && (
              <Button 
                variant="primary"
                onClick={() => setShowAddTask(true)}
              >
                <FiPlus size={16} />
                Add Task
              </Button>
            )}
          </>
        }
      />

      <div className="board-columns">
        {columns.map(column => (
          <div 
            key={column.id}
            className={`board-column ${column.id} ${draggedOverColumn === column.id ? 'drag-over' : ''} ${!hasEditAccess ? 'read-only' : ''}`}
            onDragOver={hasEditAccess ? (e) => handleDragOver(e, column.id) : undefined}
            onDrop={hasEditAccess ? (e) => handleDrop(e, column.id) : undefined}
          >
            <div className="column-header">
              <div className="status-badge" style={{ backgroundColor: column.color }}>
                {column.title}
              </div>
              <span className="task-count">{tasksByStatus[column.status]?.length || 0}</span>
            </div>

            <div className="task-list">
              {/* Drop zone for adding tasks at the beginning */}
              {hasEditAccess && (
                <div 
                  className={`drop-zone-start ${draggedOverColumn === column.id && !draggedOverTask ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id, 'top')}
                />
              )}
              
              <AnimatePresence>
                {getTasksForColumn(column.id).map((task, index) => (
                  <motion.div
                    key={task.id}
                    className={`task-card ${!hasEditAccess ? 'read-only' : ''} ${draggedOverTask === task.id ? 'drag-over-task' : ''}`}
                    draggable={hasEditAccess}
                    onDragStart={hasEditAccess ? (e) => handleDragStart(e, task) : undefined}
                    onDragOver={hasEditAccess ? (e) => handleDragOver(e, column.id, task.id) : undefined}
                    onDrop={hasEditAccess ? (e) => handleDrop(e, column.id, task.id) : undefined}
                    onDragEnd={hasEditAccess ? handleDragEnd : undefined}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.1 }}
                    style={{ opacity: draggedTask?.id === task.id ? 0.5 : 1 }}
                  >
                    <div className="task-header">
                    <div className="task-status" style={{ backgroundColor: getColumnColorByStatus(task.status) }}>
                      {getStatusDisplayName(task.status)}
                      </div>
                      {hasEditAccess && (
                        <div className="task-actions">
                          <button
                            className="task-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(task);
                            }}
                            title="Edit task"
                          >
                            <FiEdit3 size={14} />
                          </button>
                          <button
                            className="task-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task);
                            }}
                            title="Delete task"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <div className="task-assignees">
                        {task.assignee && (
                          Array.isArray(task.assignee) 
                            ? task.assignee.slice(0, 3).map((assigneeId, index) => {
                                const user = users.find(u => u.id === assigneeId);
                                return user ? (
                                  <Avatar 
                                    key={assigneeId}
                                    src={user.avatar}
                                    name={user.name}
                                    size="small"
                                    className="assignee-avatar"
                                    title={user.name}
                                  />
                                ) : null;
                              })
                            : (
                              <Avatar 
                                src={users.find(u => u.id === task.assignee)?.avatar}
                                name={users.find(u => u.id === task.assignee)?.name}
                                size="small"
                                className="assignee-avatar"
                                title={users.find(u => u.id === task.assignee)?.name}
                              />
                            )
                        )}
                        {task.assignee && Array.isArray(task.assignee) && task.assignee.length > 3 && (
                          <div className="assignee-more" title={`+${task.assignee.length - 3} more`}>
                            +{task.assignee.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="task-info">
                        <span className="priority" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                        {task.deadline && (
                          <span className="deadline">
                            <FiCalendar size={12} />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="task-footer">
                      <div className="task-info-details">
                        {task.assignee && task.assignee.length > 0 && (
                          <div className="assignee-info">
                            <FiUser size={12} />
                            <span>
                              Assigned to {Array.isArray(task.assignee) 
                                ? task.assignee.map(id => users.find(u => u.id === id)?.name || 'Unknown').join(', ')
                                : users.find(u => u.id === task.assignee)?.name || 'Unknown'
                              }
                            </span>
                          </div>
                        )}
                        {(task.createdAt || task.deadline) && (
                          <div className="time-info">
                            {task.createdAt && (
                              <span className="created-time">
                                <FiClock size={12} />
                                {formatCreatedTime(task.createdAt)}
                              </span>
                            )}
                            {task.createdAt && task.deadline && (
                              <span className="separator">•</span>
                            )}
                            {task.deadline && (
                              <span className={`deadline-info ${getRemainingTime(task.deadline)?.type || 'normal'}`}>
                                <FiCalendar size={12} />
                                {getRemainingTime(task.deadline)?.text}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Drop zone for adding tasks at the end */}
              {hasEditAccess && (
                <div 
                  className={`drop-zone-end ${draggedOverColumn === column.id && !draggedOverTask ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => {
          setShowAddTask(false);
          setNewTask({
            title: '',
            description: '',
            priority: 'medium',
            assignee: [],
            deadline: '',
            status: 'todo'
          });
          setError('');
        }}
        title="Add New Task"
      >
        <form onSubmit={handleAddTask}>
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              className="form-control"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FiFlag className="me-2" />
                Priority
              </label>
              <select
                className="form-control"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <FiUsers className="me-2" />
                Assignees
              </label>
              <Select
                options={assigneeOptions}
                value={assigneeOptions.filter(option => newTask.assignee.includes(option.value))}
                onChange={(selectedOptions) => setNewTask({ 
                  ...newTask, 
                  assignee: selectedOptions ? selectedOptions.map(option => option.value) : []
                })}
                placeholder="Select Assignees"
                isMulti
                isClearable
                styles={customStyles}
                components={{ Option: CustomOption }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <FiCalendar className="me-2" />
              Deadline
            </label>
            <div className="deadline-inputs">
              <input
                type="date"
                className="form-control"
                value={newTask.deadline?.split('T')[0] || ''}
                onChange={(e) => {
                  const date = e.target.value;
                  const time = newTask.deadline?.split('T')[1] || '23:59';
                  setNewTask({ 
                    ...newTask, 
                    deadline: date ? `${date}T${time}` : ''
                  });
                }}
              />
              <input
                type="time"
                className="form-control"
                value={newTask.deadline?.split('T')[1] || ''}
                onChange={(e) => {
                  const time = e.target.value;
                  const date = newTask.deadline?.split('T')[0] || new Date().toISOString().split('T')[0];
                  setNewTask({ 
                    ...newTask, 
                    deadline: time ? `${date}T${time}` : ''
                  });
                }}
              />
            </div>
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowAddTask(false);
                setNewTask({
                  title: '',
                  description: '',
                  priority: 'medium',
                  assignee: [],
                  deadline: '',
                  status: 'todo'
                });
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              loading={loading}
            >
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditTask}
        onClose={() => {
          setShowEditTask(false);
          setEditingTask(null);
          setError('');
        }}
        title="Edit Task"
      >
        <form onSubmit={handleUpdateTask}>
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              className="form-control"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FiFlag className="me-2" />
                Priority
              </label>
              <select
                className="form-control"
                value={editingTask?.priority || 'medium'}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <FiUsers className="me-2" />
                Assignees
              </label>
              <Select
                options={assigneeOptions}
                value={assigneeOptions.filter(option => editingTask?.assignee?.includes(option.value))}
                onChange={(selectedOptions) => setEditingTask({ 
                  ...editingTask, 
                  assignee: selectedOptions ? selectedOptions.map(option => option.value) : []
                })}
                placeholder="Select Assignees"
                isMulti
                isClearable
                styles={customStyles}
                components={{ Option: CustomOption }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <FiCalendar className="me-2" />
                Deadline
              </label>
              <div className="deadline-inputs">
                <input
                  type="date"
                  className="form-control"
                  value={editingTask?.deadline?.split('T')[0] || ''}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = editingTask?.deadline?.split('T')[1] || '23:59';
                    setEditingTask({ 
                      ...editingTask, 
                      deadline: date ? `${date}T${time}` : ''
                    });
                  }}
                />
                <input
                  type="time"
                  className="form-control"
                  value={editingTask?.deadline?.split('T')[1] || ''}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = editingTask?.deadline?.split('T')[0] || new Date().toISOString().split('T')[0];
                    setEditingTask({ 
                      ...editingTask, 
                      deadline: time ? `${date}T${time}` : ''
                    });
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={editingTask?.status || 'todo'}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
              >
                <option value="todo">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Complete</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowEditTask(false);
                setEditingTask(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              loading={loading}
            >
              Update Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingTask(null);
          setError('');
        }}
        title="Delete Task"
      >
        <div className="delete-confirmation">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <p>Are you sure you want to delete the task "<strong>{deletingTask?.title}</strong>"?</p>
          <p className="text-muted">This action cannot be undone.</p>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingTask(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={confirmDeleteTask}
              loading={loading}
            >
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectBoard; 