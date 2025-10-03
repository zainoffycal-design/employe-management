import { useState, useEffect, useCallback } from 'react';
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
  FiTrash2,
  FiVolume2,
  FiVolumeX,
  FiMessageSquare
} from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { notificationService } from '../../services/notificationService';
import Modal from '../../components/Modal';
import SlideModal from '../../components/SlideModal';
import TaskDetails from '../../components/TaskDetails';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import LoadingSpinner from '../../components/LoadingSpinner';
import Select from 'react-select';
import soundManager from '../../utils/soundUtils';
import './ProjectBoard.scss';

const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, createTask, updateTask, deleteTask } = useTask();
  const { currentUser, loading: authLoading } = useAuth();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
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
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('taskManagerSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });


  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [draggedOverTask, setDraggedOverTask] = useState(null);
  const [optimisticTasks, setOptimisticTasks] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState(new Set());
  const [notifiedTasks, setNotifiedTasks] = useState(new Set());

  const currentProject = projects.find(p => p.id === projectId);

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
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#f1f5f9',
      borderRadius: '4px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#334155',
      padding: '2px 6px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#64748b',
      '&:hover': {
        backgroundColor: '#e2e8f0',
        color: '#334155'
      }
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

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('taskManagerSoundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

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

  useEffect(() => {
    setOptimisticTasks({});
    setPendingUpdates(new Set());
    setNotifiedTasks(new Set());
  }, [tasks]);

  useEffect(() => {
    if (currentUser && projects.length >= 0) {
      setProjectsLoaded(true);
    }
  }, [currentUser, projects]);

  const assigneeOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    avatar: user.avatar
  }));

  const assigneeFilterOptions = users.map(user => ({
    value: user.id,
    label: user.name,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    avatar: user.avatar
  }));

  const isLoading = authLoading || !projectsLoaded || !currentUser;
  const isProjectNotFound = !isLoading && !currentProject;

  useEffect(() => {
    if (isProjectNotFound) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isProjectNotFound, navigate]);

  const hasEditAccess = 
    currentUser.role === 'super_manager' || 
    currentProject?.managerId === currentUser.uid ||
    currentProject?.teamMembers?.includes(currentUser.uid);

  const canMarkComplete = 
    currentUser.role === 'super_manager' || 
    currentProject?.managerId === currentUser.uid;

  const canDeleteTask = 
    currentUser.role === 'super_manager' || 
    currentUser.role === 'manager' ||
    currentProject?.managerId === currentUser.uid;

  const projectTasks = currentProject ? tasks.filter(task => task.projectId === projectId) : [];

  const filteredTasks = currentProject ? projectTasks.filter(task => {
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

    const matchesAssignee = !selectedAssignee || 
      (task.assignee && Array.isArray(task.assignee) 
        ? task.assignee.includes(selectedAssignee.value)
        : task.assignee === selectedAssignee.value
      );

    return matchesSearch && matchesAssignee;
  }) : [];

  const tasksByStatus = {
    'Todo': filteredTasks.filter(task => task.status === 'todo'),
    'Progress': filteredTasks.filter(task => task.status === 'in-progress'),
    'In Review': filteredTasks.filter(task => task.status === 'in-review'),
    'Complete': filteredTasks.filter(task => task.status === 'done')
  };

  const getOptimisticTasksForColumn = useCallback((columnId) => {
    const status = getStatusFromColumnId(columnId);
    const optimisticTasksForColumn = optimisticTasks[columnId];
    
    if (optimisticTasksForColumn) {
      return optimisticTasksForColumn;
    }
    
    return tasksByStatus[status] || [];
  }, [optimisticTasks, tasksByStatus]);

  const updateOptimisticTasks = useCallback((columnId, newTasks) => {
    setOptimisticTasks(prev => ({
      ...prev,
      [columnId]: newTasks
    }));
  }, []);

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
      soundManager.playSuccess();

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
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      assignee: Array.isArray(task.assignee) ? task.assignee : task.assignee ? [task.assignee] : []
    });
    setShowEditTask(true);
    setError('');
    setShowTaskDetails(false);
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
      soundManager.playSuccess();

      setShowEditTask(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = (task) => {
    setDeletingTask(task);
    setShowDeleteConfirm(true);
    setShowTaskDetails(false);
  };

  const confirmDeleteTask = async () => {
    setLoading(true);
    setError('');

    try {
      await deleteTask(projectId, deletingTask.id);
      soundManager.playSuccess();
      setShowDeleteConfirm(false);
      setDeletingTask(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = useCallback((e, task) => {
    if (task.status === 'done' && !canMarkComplete) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, [canMarkComplete]);

  const handleDragOver = useCallback((e, columnId, taskId = null) => {
    e.preventDefault();
    
    if (columnId === 'done' && !canMarkComplete) {
      return;
    }
    
    setDraggedOverColumn(columnId);
    if (taskId) {
      setDraggedOverTask(taskId);
    }
  }, [canMarkComplete]);

  const handleDrop = useCallback((e, columnId, targetTaskId = null) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    if (columnId === 'done' && !canMarkComplete) {
      return;
    }

    const currentTasksInColumn = getOptimisticTasksForColumn(columnId);
    const draggedIndex = currentTasksInColumn.findIndex(t => t.id === draggedTask.id);
    
    let newTasks = [...currentTasksInColumn];
    let taskMoved = false;

    if (draggedTask.status === columnId) {
      if (targetTaskId === 'top') {
        if (draggedIndex !== -1 && draggedIndex !== 0) {
          const [movedTask] = newTasks.splice(draggedIndex, 1);
          newTasks.unshift(movedTask);
          taskMoved = true;
          soundManager.playMove();
        }
      } else if (targetTaskId === 'bottom') {
        if (draggedIndex !== -1 && draggedIndex !== currentTasksInColumn.length - 1) {
          const [movedTask] = newTasks.splice(draggedIndex, 1);
          newTasks.push(movedTask);
          taskMoved = true;
          soundManager.playMove();
        }
      } else if (targetTaskId) {
        const targetIndex = currentTasksInColumn.findIndex(t => t.id === targetTaskId);
        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
          const [movedTask] = newTasks.splice(draggedIndex, 1);
          newTasks.splice(targetIndex, 0, movedTask);
          taskMoved = true;
          soundManager.playMove();
        }
      }
    } else {
        const updatedTask = { ...draggedTask, status: columnId };
      
      const sourceColumnId = draggedTask.status;
      const sourceTasks = getOptimisticTasksForColumn(sourceColumnId);
      const sourceNewTasks = sourceTasks.filter(t => t.id !== draggedTask.id);
      
      if (targetTaskId === 'top') {
        newTasks = [updatedTask, ...currentTasksInColumn];
      } else if (targetTaskId === 'bottom') {
        newTasks = [...currentTasksInColumn, updatedTask];
      } else if (targetTaskId) {
        const targetIndex = currentTasksInColumn.findIndex(t => t.id === targetTaskId);
        if (targetIndex !== -1) {
          newTasks = [...currentTasksInColumn];
          newTasks.splice(targetIndex, 0, updatedTask);
        } else {
          newTasks = [...currentTasksInColumn, updatedTask];
        }
      } else {
        newTasks = [...currentTasksInColumn, updatedTask];
      }
      
      if (columnId === 'done') {
        soundManager.playComplete();
      } else if (columnId === 'in-progress') {
        soundManager.playMove();
      } else {
        soundManager.playDrop();
      }
      
      setPendingUpdates(prev => new Set([...prev, draggedTask.id]));
      
      updateTask(projectId, draggedTask.id, { status: columnId }).then(async () => {
        try {
          const oldStatus = getStatusDisplayName(draggedTask.status);
          const newStatus = getStatusDisplayName(columnId);
          
          const taskCreatedTime = new Date(draggedTask.createdAt);
          const now = new Date();
          const timeSinceCreation = now - taskCreatedTime;
          
          if (newStatus === 'Complete') {
            if (!notifiedTasks.has(draggedTask.id)) {
              await notificationService.createTaskCompletionNotification(
                draggedTask,
                currentProject,
                currentUser,
                oldStatus,
                newStatus
              );
              
              setNotifiedTasks(prev => new Set([...prev, draggedTask.id]));
            }
          }
        } catch (notificationError) {
          console.error('Error sending status change notification:', notificationError);
        }
      }).catch(error => {
        console.error('Error moving task:', error);
        soundManager.playError();
      }).finally(() => {
        setPendingUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(draggedTask.id);
          return newSet;
        });
      });
      
      taskMoved = true;
    }

    if (taskMoved && draggedTask.status === columnId) {
      updateOptimisticTasks(columnId, newTasks);
    }
    
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setDraggedOverTask(null);
  }, [draggedTask, getOptimisticTasksForColumn, updateOptimisticTasks, updateTask, projectId]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
    setDraggedOverTask(null);
  }, []);

  const getStatusFromColumnId = (columnId) => {
    switch (columnId) {
      case 'todo': return 'Todo';
      case 'in-progress': return 'Progress';
      case 'in-review': return 'In Review';
      case 'done': return 'Complete';
      default: return 'Todo';
    }
  };

  const columns = [
    { id: 'todo', title: 'Todo', color: '#8B5CF6', status: 'Todo' },
    { id: 'in-progress', title: 'Progress', color: '#3B82F6', status: 'Progress' },
    { id: 'in-review', title: 'In Review', color: '#F59E0B', status: 'In Review' },
    { id: 'done', title: 'Complete', color: '#059669', status: 'Complete' }
  ];

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Todo': return '#8B5CF6';
      case 'Progress': return '#3B82F6';
      case 'In Review': return '#F59E0B';
      case 'Complete': return '#059669';
      default: return '#6B7280';
    }
  };

  const getColumnColorByStatus = (status) => {
    switch (status) {
      case 'todo': return '#8B5CF6';
      case 'in-progress': return '#3B82F6';
      case 'in-review': return '#F59E0B';
      case 'done': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'todo': return 'Todo';
      case 'in-progress': return 'Progress';
      case 'in-review': return 'In Review';
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

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setEnabled(newState);
  };

  if (isLoading) {
    return (
      <div className="project-board">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <LoadingSpinner size="large" />
          <span>Loading project...</span>
        </div>
      </div>
    );
  }

  if (isProjectNotFound) {
    return (
      <div className="project-board">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <span>Project not found. Redirecting...</span>
        </div>
      </div>
    );
  }

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
            
            <div className="header-actions">
              <button
                onClick={toggleSound}
                className="sound-toggle-btn"
                title={soundEnabled ? "Disable sounds" : "Enable sounds"}
              >
                {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
              </button>
              
              {hasEditAccess && (
                <Button 
                  variant="primary"
                  onClick={() => setShowAddTask(true)}
                >
                  <FiPlus size={16} />
                  Add Task
                </Button>
              )}
            </div>
          </>
        }
      />

      <div className="board-columns">
        {columns.map(column => (
          <div 
            key={column.id}
            className={`board-column ${column.id} ${draggedOverColumn === column.id ? 'drag-over' : ''} ${!hasEditAccess ? 'read-only' : ''} ${column.id === 'done' && !canMarkComplete ? 'restricted' : ''}`}
            onDragOver={hasEditAccess ? (e) => handleDragOver(e, column.id) : undefined}
            onDrop={hasEditAccess ? (e) => handleDrop(e, column.id) : undefined}
          >
            <div className="column-header">
              <div className="status-badge" style={{ backgroundColor: column.color }}>
                {column.title}
              </div>
              <span className="task-count">{getOptimisticTasksForColumn(column.id).length}</span>
            </div>

            <div className="task-list">   
              {hasEditAccess && (
                <div 
                  className={`drop-zone-start ${draggedOverColumn === column.id && !draggedOverTask ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id, 'top')}
                />
              )}
              
              <AnimatePresence>
                {getOptimisticTasksForColumn(column.id).map((task, index) => (
                  <motion.div
                    key={task.id}
                    className={`task-card ${!hasEditAccess ? 'read-only' : ''} ${draggedOverTask === task.id ? 'drag-over-task' : ''} ${pendingUpdates.has(task.id) ? 'updating' : ''} ${task.status === 'done' && !canMarkComplete ? 'restricted-task' : ''}`}
                    draggable={hasEditAccess && !(task.status === 'done' && !canMarkComplete)}
                    onDragStart={hasEditAccess && !(task.status === 'done' && !canMarkComplete) ? (e) => handleDragStart(e, task) : undefined}
                    onDragOver={hasEditAccess ? (e) => handleDragOver(e, column.id, task.id) : undefined}
                    onDrop={hasEditAccess ? (e) => handleDrop(e, column.id, task.id) : undefined}
                    onDragEnd={hasEditAccess ? handleDragEnd : undefined}
                    onClick={() => handleTaskClick(task)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.1 }}
                    style={{ 
                      opacity: draggedTask?.id === task.id ? 0.5 : 1,
                      transform: draggedTask?.id === task.id ? 'scale(0.95)' : 'scale(1)',
                      cursor: 'pointer'
                    }}
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
                          {canDeleteTask && (
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
                          )}
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
                    
                    {task.comments && task.comments.length > 0 && (
                      <div className="task-comments-indicator">
                        <FiMessageSquare size={12} />
                        <span>{task.comments.length}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {hasEditAccess && (
                <div 
                  className={`drop-zone-end ${draggedOverColumn === column.id && !draggedOverTask ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id, 'bottom')}
                />
              )}
            </div>
          </div>
        ))}
      </div>

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
              <div className="form-control" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
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
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                {canMarkComplete && <option value="done">Complete</option>}
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

      {}
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

      {}
      <SlideModal
        isOpen={showTaskDetails}
        onClose={() => {
          setShowTaskDetails(false);
          setSelectedTask(null);
        }}
        title="Task Details"
        width="600px"
      >
        {selectedTask && (
          <TaskDetails
            task={selectedTask}
            onClose={() => {
              setShowTaskDetails(false);
              setSelectedTask(null);
            }}
            onEdit={handleEditTask}
            onDelete={canDeleteTask ? handleDeleteTask : null}
            users={users}
            project={currentProject}
          />
        )}
      </SlideModal>
    </div>
  );
};

export default ProjectBoard; 