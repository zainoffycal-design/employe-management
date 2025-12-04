import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
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
  FiMessageSquare,
  FiStar
} from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { notificationService } from '../../services/notificationService';
import { getPriorityColor, getStatusDisplayName, getRemainingTime, formatCreatedTime, reactSelectStyles, formatHours } from '../../utils/uiUtils';
import { canMoveTasks, permissionUtils, MANAGER_TYPES } from '../../utils/permissionUtils';
import Modal from '../../components/Modal';
import SlideModal from '../../components/SlideModal';
import TaskDetails from '../../components/TaskDetails';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import EstimatedTimeSelector from '../../components/EstimatedTimeSelector';
import LoadingSpinner from '../../components/LoadingSpinner';
import RichTextViewer from '../../components/RichTextViewer';
import RichTextEditor from '../../components/RichTextEditor';
import Select from 'react-select';
import soundManager from '../../utils/soundUtils';
import './ProjectBoard.scss';

const ProjectBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, tasks, createTask, updateTask, deleteTask } = useTask();
  const { currentUser, loading: authLoading } = useAuth();
  
  const canViewEstimatedHours = useMemo(() => {
    return permissionUtils.isSuperManager(currentUser) || 
           permissionUtils.isManagerOfType(currentUser, MANAGER_TYPES.DESIGNER);
  }, [currentUser]);
  
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
    estimatedHours: null,
    estimatedTimeData: null,
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
        const teamMemberIds = currentProject?.teamMembers || [];
        const managerId = currentProject?.managerId;
        
        const projectUsers = allUsers.filter(user => {
          if (!user.isActive) return false;
          
          const isTeamMember = Array.isArray(teamMemberIds) && teamMemberIds.includes(user.id);
          const isProjectManager = managerId === user.id;
          
          return isTeamMember || isProjectManager;
        });
        
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

  const assigneeOptions = users
    .filter(user => user.role !== 'super_manager')
    .map(user => ({
      value: user.id,
      label: user.name,
      role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      avatar: user.avatar
    }));

  const isLoading = authLoading || !projectsLoaded || !currentUser;
  const isProjectNotFound = !isLoading && !currentProject;
  const isProjectCompleted = currentProject?.status === 'completed';
  const canAccessCompletedProject = currentUser?.role === 'super_manager';

  useEffect(() => {
    if (isProjectNotFound) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isProjectNotFound, navigate]);

  useEffect(() => {
    if (!isLoading && currentProject && isProjectCompleted && !canAccessCompletedProject) {
      navigate('/project-management');
    }
  }, [isLoading, currentProject, isProjectCompleted, canAccessCompletedProject, navigate]);

  const hasEditAccess = 
    currentUser.role === 'super_manager' || 
    currentUser.role === 'manager' ||
    currentProject?.managerId === currentUser.uid;

  const canMoveTask = canMoveTasks(currentUser);

  const canMarkComplete = 
    currentUser.role === 'super_manager' || 
    currentUser.role === 'manager' ||
    currentProject?.managerId === currentUser.uid;

  const canDeleteTask = 
    currentUser.role === 'super_manager' || 
    currentUser.role === 'manager' ||
    currentProject?.managerId === currentUser.uid;

  const projectTasks = useMemo(() => {
    return currentProject ? tasks.filter(task => task.projectId === projectId) : [];
  }, [currentProject, tasks, projectId]);

  const filteredTasks = useMemo(() => {
    if (!currentProject) return [];
    
    return projectTasks.filter(task => {
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
    });
  }, [currentProject, projectTasks, searchTerm, selectedAssignee, users]);

  const tasksByStatus = useMemo(() => {
    const todo = filteredTasks.filter(task => task.status === 'todo');
    const progress = filteredTasks.filter(task => task.status === 'in-progress');
    const inReview = filteredTasks.filter(task => task.status === 'in-review');
    const complete = filteredTasks
      .filter(task => task.status === 'done')
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
    
    return {
      'Todo': todo,
      'Progress': progress,
      'In Review': inReview,
      'Complete': complete
    };
  }, [filteredTasks]);

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
        estimatedHours: newTask.estimatedHours || (newTask.estimatedTimeData?.hours || null),
        estimatedTimeData: newTask.estimatedTimeData || null,
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
        estimatedHours: '',
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
    if (task.status === 'done' && !canMarkComplete) {
      return; 
    }
    
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

      const validation = validateTaskStatusChange(editingTask, editingTask.status);
      if (!validation.isValid) {
        return;
      }

      const taskData = {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assignee: editingTask.assignee,
        deadline: editingTask.deadline,
        estimatedHours: editingTask.estimatedHours || (editingTask.estimatedTimeData?.hours || null),
        estimatedTimeData: editingTask.estimatedTimeData || null,
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

  const validateTaskStatusChange = (task, newStatus) => {
    if (newStatus === 'in-review' || newStatus === 'done') {
      const hasTimeEntries = task.timeEntries && task.timeEntries.length > 0;
      const hasTotalHours = task.totalHours && task.totalHours > 0;
      
      if (!hasTimeEntries && !hasTotalHours) {
        const message = newStatus === 'in-review' 
          ? 'Task must have time entries before moving to In Review'
          : 'Task must have time entries before marking as Complete';
        
        toast.error(message, {
          duration: 4000,
          icon: <FiClock size={16} />,
          style: {
            background: '#ef4444',
            color: '#fff',
          },
        });
        
        return {
          isValid: false,
          message
        };
      }
    }
    return { isValid: true };
  };

  const handleDrop = useCallback((e, columnId, targetTaskId = null) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    if (columnId === 'done' && !canMarkComplete) {
      return;
    }

    const validation = validateTaskStatusChange(draggedTask, columnId);
    if (!validation.isValid) {
      soundManager.playError();
      setDraggedTask(null);
      setDraggedOverColumn(null);
      setDraggedOverTask(null);
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
        const updatedTask = { 
          ...draggedTask, 
          status: columnId,
          updatedAt: new Date().toISOString()
        };
      
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
        if (columnId === 'done') {
          newTasks = [updatedTask, ...currentTasksInColumn];
        } else {
          newTasks = [...currentTasksInColumn, updatedTask];
        }
      }
      
      if (columnId === 'done') {
        newTasks.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });
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

  if (isProjectCompleted && !canAccessCompletedProject) {
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
          <span>You don't have permission to access completed projects. Only super managers can access completed project boards.</span>
          <span>Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="project-board">
      <PageTitle 
        title={currentProject?.name || 'Project'}
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
                  options={assigneeOptions}
                  value={selectedAssignee}
                  onChange={setSelectedAssignee}
                  placeholder="Filter by assignee"
                  isClearable
                  styles={reactSelectStyles}
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
            className={`board-column ${column.id} ${draggedOverColumn === column.id ? 'drag-over' : ''} ${!canMoveTask ? 'read-only' : ''} ${column.id === 'done' && !canMarkComplete ? 'restricted' : ''}`}
            onDragOver={canMoveTask ? (e) => handleDragOver(e, column.id) : undefined}
            onDrop={canMoveTask ? (e) => handleDrop(e, column.id) : undefined}
          >
            <div className="column-header">
              <div className="status-badge" style={{ backgroundColor: column.color }}>
                {column.title}
              </div>
              <span className="task-count">{getOptimisticTasksForColumn(column.id).length}</span>
            </div>

            <div className="task-list">   
              {canMoveTask && (
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
                    className={`task-card ${task.status === 'done' ? 'task-card-completed' : ''} ${!canMoveTask ? 'read-only' : ''} ${draggedOverTask === task.id ? 'drag-over-task' : ''} ${pendingUpdates.has(task.id) ? 'updating' : ''} ${task.status === 'done' && !canMarkComplete ? 'restricted-task' : ''}`}
                    draggable={canMoveTask && !(task.status === 'done' && !canMarkComplete)}
                    onDragStart={canMoveTask && !(task.status === 'done' && !canMarkComplete) ? (e) => handleDragStart(e, task) : undefined}
                    onDragOver={canMoveTask ? (e) => handleDragOver(e, column.id, task.id) : undefined}
                    onDrop={canMoveTask ? (e) => handleDrop(e, column.id, task.id) : undefined}
                    onDragEnd={canMoveTask ? handleDragEnd : undefined}
                    onClick={() => handleTaskClick(task)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.1 }}
                    style={{ 
                      opacity: draggedTask?.id === task.id ? 0.5 : 1,
                      transform: draggedTask?.id === task.id ? 'scale(0.95)' : 'scale(1)',
                      cursor: (task.status === 'done' && !canMarkComplete) ? 'default' : 'pointer'
                    }}
                  >
                    {hasEditAccess && (
                      <div className="task-header">
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
                      </div>
                    )}
                    <h3>{task.title}</h3>
                    {task.status !== 'done' && (
                      <RichTextViewer content={task.description} className="compact" />
                    )}
                    <div className="task-meta">
                      <div className="task-info-left">
                        <span className="priority" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                        {task.totalHours > 0 ? (
                          <span className="hours-indicator">
                            <FiClock size={12} />
                            {formatHours(task.totalHours)}
                          </span>
                        ) : (task.estimatedHours || task.estimatedTimeData?.hours) ? (
                          <span className="estimated-hours-indicator" title="Estimated Hours">
                            <FiClock size={12} />
                            Est: {formatHours(task.estimatedHours || task.estimatedTimeData?.hours || 0)}
                          </span>
                        ) : null}
                        {task.status === 'done' && !task.reviews && !task.review && (
                          <span className="review-required-indicator" title="Add manager review">
                            <FiStar size={12} />
                            <span>Add Review</span>
                          </span>
                        )}
                        {task.status !== 'done' && (!task.timeEntries || task.timeEntries.length === 0) && (!task.totalHours || task.totalHours === 0) && (
                          <span className="time-required-indicator" title="Time entry required before moving to In Review or Complete">
                            <FiClock size={12} />
                            <span>Time Required</span>
                          </span>
                        )}
                        {task.comments && task.comments.length > 0 && (
                          <span className="comments-badge">
                            <FiMessageSquare size={12} />
                            <span>{task.comments.length}</span>
                          </span>
                        )}
                      </div>
                      {task.status !== 'done' && task.deadline && (
                        <div className="task-info-right">
                          <span className="deadline">
                            <FiCalendar size={12} />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {task.status !== 'done' && (
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
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {canMoveTask && (
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
            estimatedHours: '',
            status: 'todo'
          });
          setError('');
        }}
        title="Add New Task"
        size="large"
      >
        <form onSubmit={handleAddTask}>
          <div className="modal-form-content">
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
              <RichTextEditor
                value={newTask.description}
                onChange={(value) => setNewTask({ ...newTask, description: value })}
                placeholder="Enter task description"
                height="250px"
              />
            </div>
            
            {canViewEstimatedHours && (
              <div className="form-row">
                <div className="form-group col-12">
                  <EstimatedTimeSelector
                    value={newTask.estimatedTimeData || newTask.estimatedHours}
                    onChange={(data) => {
                      setNewTask({
                        ...newTask,
                        estimatedTimeData: data,
                        estimatedHours: data?.hours || null
                      });
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group col-12">
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
                      const time = newTask.deadline?.split('T')[1] || new Date().toTimeString().slice(0, 5);
                      setNewTask({ 
                        ...newTask, 
                        deadline: date ? `${date}T${time}` : ''
                      });
                    }}
                  />
                  <input
                    type="time"
                    className="form-control"
                    value={newTask.deadline?.split('T')[1] || new Date().toTimeString().slice(0, 5)}
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
                  styles={reactSelectStyles}
                  components={{ Option: CustomOption }}
                />
              </div>
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
                  estimatedHours: null,
                  estimatedTimeData: null,
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
              loadingText="Creating Task..."
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
        size="large"
      >
        <form onSubmit={handleUpdateTask}>
          <div className="modal-form-content">
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
              <RichTextEditor
                value={editingTask?.description || ''}
                onChange={(value) => setEditingTask({ ...editingTask, description: value })}
                placeholder="Enter task description"
                height="250px"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group col-12">
                <EstimatedTimeSelector
                  value={editingTask?.estimatedTimeData || editingTask?.estimatedHours}
                  onChange={(data) => {
                    setEditingTask({
                      ...editingTask,
                      estimatedTimeData: data,
                      estimatedHours: data?.hours || null
                    });
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-12">
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
                      const time = editingTask?.deadline?.split('T')[1] || new Date().toTimeString().slice(0, 5);
                      setEditingTask({ 
                        ...editingTask, 
                        deadline: date ? `${date}T${time}` : ''
                      });
                    }}
                  />
                  <input
                    type="time"
                    className="form-control"
                    value={editingTask?.deadline?.split('T')[1] || new Date().toTimeString().slice(0, 5)}
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
                  styles={reactSelectStyles}
                  components={{ Option: CustomOption }}
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
              loadingText="Updating Task..."
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
              loadingText="Deleting Task..."
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