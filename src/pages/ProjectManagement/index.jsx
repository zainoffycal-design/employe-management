import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteField } from 'firebase/firestore';
import { 
  FiFolder, 
  FiPlus, 
  FiUsers, 
  FiLayout,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheck
} from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { permissionUtils, MANAGER_TYPES } from '../../utils/permissionUtils';
import { userManagementService } from '../../services/firebaseService';
import { reactSelectStyles } from '../../utils/uiUtils';
import Select from 'react-select';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import ProjectCard from '../../components/ProjectCard';
import Avatar from '../../components/Avatar';
import BudgetManager from '../../components/BudgetManager';
import './ProjectManagement.scss';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { projects, createProject, updateProject, deleteProject, tasks } = useTask();
  const { currentUser } = useAuth();
  const isBdManager = useMemo(() => {
    return permissionUtils.isManagerOfType(currentUser, MANAGER_TYPES.BD);
  }, [currentUser]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [markingDoneProject, setMarkingDoneProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamMembers: [],
    status: 'active',
    projectType: '',
    priority: '',
    budget: {
      type: 'none',
      fixedBudget: '',
      hourlyRate: '',
      payments: [],
      tax: 0
    },
    commissionData: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const FILTER_STORAGE_KEY = 'projectManagement_filters';
  const NAV_FLAG_KEY = 'projectManagement_fromProjectBoard';

  const getDefaultFilters = () => ({
    searchTerm: '',
    selectedManager: null,
    projectFilter: 'active',
    selectedProjectType: { value: 'freelance', label: 'Freelance' },
    selectedPriority: { value: 'high', label: 'High' }
  });

  const loadSavedFilters = () => {
    const isFromProjectBoard = sessionStorage.getItem(NAV_FLAG_KEY) === 'true';
    
    if (!isFromProjectBoard) {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
      return getDefaultFilters();
    }

    try {
      const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const filters = JSON.parse(saved);
        return {
          searchTerm: filters.searchTerm !== undefined ? filters.searchTerm : '',
          selectedManager: filters.selectedManager !== undefined ? filters.selectedManager : null,
          projectFilter: filters.projectFilter !== undefined ? filters.projectFilter : 'active',
          selectedProjectType: filters.selectedProjectType !== undefined ? filters.selectedProjectType : { value: 'freelance', label: 'Freelance' },
          selectedPriority: filters.selectedPriority !== undefined ? filters.selectedPriority : { value: 'high', label: 'High' }
        };
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    
    sessionStorage.removeItem(NAV_FLAG_KEY);
    return getDefaultFilters();
  };

  const savedFilters = loadSavedFilters();

  const [searchTerm, setSearchTerm] = useState(savedFilters.searchTerm);
  const [selectedManager, setSelectedManager] = useState(savedFilters.selectedManager);
  const [projectFilter, setProjectFilter] = useState(savedFilters.projectFilter);
  const [selectedProjectType, setSelectedProjectType] = useState(savedFilters.selectedProjectType);
  const [selectedPriority, setSelectedPriority] = useState(savedFilters.selectedPriority);

  useEffect(() => {
    sessionStorage.removeItem(NAV_FLAG_KEY);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsersData = await userManagementService.getAllUsers();
        setAllUsers(allUsersData);
        const activeUsers = allUsersData.filter(user => 
          user.isActive && user.id !== currentUser.uid
        );
        setUsers(activeUsers);

        if (savedFilters.selectedManager && savedFilters.selectedManager.value && allUsersData.length > 0) {
          const manager = allUsersData.find(u => u.id === savedFilters.selectedManager.value);
          if (manager && manager.isActive) {
            setSelectedManager({
              value: manager.id,
              label: manager.name,
              role: manager.role === 'super_manager' ? 'Super Manager' : 'Manager',
              avatar: manager.avatar
            });
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      }
    };
    fetchUsers();
  }, [currentUser.uid]);

  useEffect(() => {
    const saveFilters = () => {
      try {
        const filters = {
          searchTerm,
          selectedManager: selectedManager ? {
            value: selectedManager.value,
            label: selectedManager.label,
            role: selectedManager.role,
            avatar: selectedManager.avatar
          } : null,
          projectFilter,
          selectedProjectType: selectedProjectType ? {
            value: selectedProjectType.value,
            label: selectedProjectType.label
          } : null,
          selectedPriority: selectedPriority ? {
            value: selectedPriority.value,
            label: selectedPriority.label
          } : null
        };
        sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
      } catch (error) {
        console.error('Error saving filters:', error);
      }
    };

    saveFilters();
  }, [searchTerm, selectedManager, projectFilter, selectedProjectType, selectedPriority]);

  const groupedOptions = Object.entries(
    users.reduce((acc, user) => {
      if (user.role === 'super_manager') {
        return acc;
      }
      
      const role = user.role === 'manager' ? 'Manager' :
                   user.role.charAt(0).toUpperCase() + user.role.slice(1);
      
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push({
        value: user.id,
        label: user.name,
        role: role,
        avatar: user.avatar
      });
      return acc;
    }, {})
  ).map(([role, users]) => ({
    label: role,
    options: users
  }));

  const managerFilterOptions = allUsers
    .filter(user => (user.role === 'manager' || user.role === 'super_manager') && user.isActive !== false)
    .map(user => ({
      value: user.id,
      label: user.name,
      role: user.role === 'super_manager' ? 'Super Manager' : 'Manager',
      avatar: user.avatar
    }));

  const projectFilterOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'active', label: 'Active Projects' },
    { value: 'completed', label: 'Completed Projects' }
  ];

  const projectTypeOptions = [
    { value: 'contract', label: 'Contract' },
    { value: 'full-time', label: 'Full Time' },
    { value: '1099', label: '1099' },
    { value: 'freelance', label: 'Freelance' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const getCurrentMonthYear = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthYearOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.teamMembers.length === 0) {
        setError('Please select at least one team member');
        setLoading(false);
        return;
      }

      const commissionData = {};
      // Only super_manager can set commission data
      if (currentUser?.role === 'super_manager') {
        formData.teamMembers.forEach(member => {
          const user = allUsers.find(u => u.id === member.value || u.email === member.value);
          if (user?.hasCommission && user?.commissionPercentage && formData.commissionData[member.value]?.isActive) {
            const commissionInfo = formData.commissionData[member.value];
            if (user.commissionType === 'recurring' && (!commissionInfo.recurringMonths || commissionInfo.recurringMonths === '' || parseInt(commissionInfo.recurringMonths, 10) <= 0)) {
              setError('Please enter a valid number of months for recurring commission.');
              setLoading(false);
              return;
            }
            commissionData[member.value] = {
              percentage: user.commissionPercentage,
              type: user.commissionType,
              recurringMonths: user.commissionType === 'recurring' ? (parseInt(commissionInfo.recurringMonths, 10) || null) : null,
              startMonth: commissionInfo.startMonth || getCurrentMonthYear(),
              isActive: true
            };
          }
        });
      }

      const projectData = {
        ...formData,
        teamMembers: formData.teamMembers.map(member => member.value),
        managerId: currentUser.uid,
        createdBy: currentUser.uid,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Only super_manager can save commission data
      if (currentUser?.role === 'super_manager' && Object.keys(commissionData).length > 0) {
        projectData.commissionData = commissionData;
      }

      if (formData.budget.type === 'none') {
        delete projectData.budget;
      }

      await createProject(projectData);
      setShowCreateModal(false);
      setFormData({ 
        name: '', 
        description: '', 
        teamMembers: [],
        status: 'active',
        projectType: '',
        priority: '',
        budget: {
          type: 'none',
          fixedBudget: '',
          hourlyRate: '',
          payments: []
        },
        commissionData: {}
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedProject) {
        const isCompleted = isProjectCompleted(selectedProject);
        if (isCompleted && currentUser.role !== 'super_manager') {
          setError('Only super managers can edit completed projects');
          setLoading(false);
          return;
        }
      }

      if (formData.teamMembers.length === 0) {
        setError('Please select at least one team member');
        setLoading(false);
        return;
      }

      const commissionData = {};
      // Only super_manager can set commission data
      if (currentUser?.role === 'super_manager') {
        formData.teamMembers.forEach(member => {
          const user = allUsers.find(u => u.id === member.value || u.email === member.value);
          if (user?.hasCommission && user?.commissionPercentage && formData.commissionData[member.value]?.isActive) {
            const commissionInfo = formData.commissionData[member.value];
            if (user.commissionType === 'recurring' && (!commissionInfo.recurringMonths || commissionInfo.recurringMonths === '' || parseInt(commissionInfo.recurringMonths, 10) <= 0)) {
              setError('Please enter a valid number of months for recurring commission.');
              setLoading(false);
              return;
            }
            commissionData[member.value] = {
              percentage: user.commissionPercentage,
              type: user.commissionType,
              recurringMonths: user.commissionType === 'recurring' ? (parseInt(commissionInfo.recurringMonths, 10) || null) : null,
              startMonth: commissionInfo.startMonth || getCurrentMonthYear(),
              isActive: true
            };
          }
        });
      }

      let projectData = {
        ...formData,
        teamMembers: formData.teamMembers.map(member => member.value)
      };

      // Only super_manager can save commission data
      if (currentUser?.role === 'super_manager') {
        if (Object.keys(commissionData).length > 0) {
          projectData.commissionData = commissionData;
        } else {
          projectData.commissionData = deleteField();
        }
      }
      // For managers, preserve existing commission data if any, but don't allow modification
      // (commission data will remain unchanged for managers)
      
      if (isBdManager) {
        if (formData.budget && formData.budget.type !== 'none') {
          projectData.budget = formData.budget;
        } else if (formData.budget && formData.budget.type === 'none') {
          projectData.budget = null;
        }
      } else {
        delete projectData.budget;
      }
      
      if (currentUser.role === 'super_manager' && formData.status) {
        projectData.status = formData.status;
        if (formData.status === 'active' && selectedProject?.status === 'completed') {
          projectData.completedAt = null;
        } else if (formData.status === 'completed' && selectedProject?.status !== 'completed') {
          projectData.completedAt = new Date().toISOString();
        }
      }

      await updateProject(selectedProject.id, projectData);
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ 
        name: '', 
        description: '', 
        teamMembers: [],
        status: 'active',
        projectType: '',
        priority: '',
        budget: {
          type: 'none',
          fixedBudget: '',
          hourlyRate: '',
          payments: []
        },
        commissionData: {}
      });
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (project) => {
    setDeletingProject(project);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    setLoading(true);
    setError('');

    try {
      if (deletingProject) {
        const isCompleted = isProjectCompleted(deletingProject);
        if (isCompleted && currentUser.role !== 'super_manager') {
          setError('Only super managers can delete completed projects');
          setLoading(false);
          return;
        }
      }

      await deleteProject(deletingProject.id);
      setShowDeleteConfirm(false);
      setDeletingProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = (project) => {
    setMarkingDoneProject(project);
    setShowMarkDoneConfirm(true);
  };

  const confirmMarkAsDone = async () => {
    if (!markingDoneProject) return;

    setLoading(true);
    setError('');

    try {
      await updateProject(markingDoneProject.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      setShowMarkDoneConfirm(false);
      setMarkingDoneProject(null);
    } catch (error) {
      console.error('Error marking project as done:', error);
      setError('Failed to mark project as completed');
    } finally {
      setLoading(false);
    }
  };

  const isProjectCompleted = useCallback((project) => {
    return project.status === 'completed';
  }, []);

  const hasAllTasksCompleted = useCallback((project) => {
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    if (projectTasks.length === 0) return false;
    const completedTasks = projectTasks.filter(task => task.status === 'done').length;
    const progressPercentage = Math.round((completedTasks / projectTasks.length) * 100);
    return progressPercentage === 100;
  }, [tasks]);

  const activeProjects = useMemo(() => {
    return projects?.filter(project => !project.status || project.status !== 'completed') || [];
  }, [projects]);

  const completedProjects = useMemo(() => {
    return projects?.filter(project => project.status === 'completed') || [];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let baseProjects = projects;
    
    if (projectFilter === 'active') {
      baseProjects = activeProjects;
    } else if (projectFilter === 'completed') {
      baseProjects = completedProjects;
    }

    return baseProjects
      ?.filter(project => {
        const matchesSearch = !searchTerm.trim() || (() => {
          const searchLower = searchTerm.toLowerCase();
          if (project.name.toLowerCase().includes(searchLower)) return true;
          if (project.description.toLowerCase().includes(searchLower)) return true;
          if (project.teamMembers && project.teamMembers.length > 0) {
            const hasMatchingMember = project.teamMembers.some(memberId => {
              const user = allUsers.find(u => u.id === memberId);
              return user?.name.toLowerCase().includes(searchLower);
            });
            if (hasMatchingMember) return true;
          }
          return false;
        })();

        const matchesManager = !selectedManager || 
          project.managerId === selectedManager.value || 
          project.createdBy === selectedManager.value;

        const matchesProjectType = !selectedProjectType || 
          project.projectType === selectedProjectType.value;

        const matchesPriority = !selectedPriority || 
          project.priority === selectedPriority.value;

        return matchesSearch && matchesManager && matchesProjectType && matchesPriority;
      })
      ?.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
  }, [projects, projectFilter, activeProjects, completedProjects, searchTerm, selectedManager, selectedProjectType, selectedPriority, allUsers]);

  const renderTeamMemberSelect = () => {
    const membersWithCommission = formData.teamMembers.filter(member => {
      const user = allUsers.find(u => u.id === member.value || u.email === member.value);
      return user?.hasCommission && user?.commissionPercentage;
    });

    return (
      <>
        <div className="form-group">
          <label>Team Members</label>
          <Select
            isMulti
            options={groupedOptions}
            value={formData.teamMembers}
            onChange={(selected) => {
              const newMembers = selected || [];
              const newCommissionData = { ...formData.commissionData };
              
              newMembers.forEach(member => {
                const user = allUsers.find(u => u.id === member.value || u.email === member.value);
                if (user?.hasCommission && user?.commissionPercentage) {
                  if (!newCommissionData[member.value]) {
                    newCommissionData[member.value] = {
                      percentage: user.commissionPercentage,
                      type: user.commissionType,
                      recurringMonths: user.recurringMonths || null,
                      isActive: false,
                      startMonth: null
                    };
                  }
                }
              });
              
              Object.keys(newCommissionData).forEach(memberId => {
                if (!newMembers.find(m => m.value === memberId)) {
                  delete newCommissionData[memberId];
                }
              });

              setFormData({
                ...formData,
                teamMembers: newMembers,
                commissionData: newCommissionData
              });
            }}
            styles={reactSelectStyles}
            components={{ Option: CustomOption }}
            placeholder="Select team members..."
            closeMenuOnSelect={false}
            className="team-select"
            classNamePrefix="team-select"
          />
          <small className="form-text text-muted">
            Selected: {formData.teamMembers.length} members
          </small>
        </div>

        {membersWithCommission.length > 0 && currentUser?.role === 'super_manager' && (
          <div className="form-group">
            <label>Commission Settings</label>
            <div className="commission-settings">
              {membersWithCommission.map(member => {
                const user = allUsers.find(u => u.id === member.value || u.email === member.value);
                const commissionInfo = formData.commissionData[member.value] || {};
                if (!user?.hasCommission) return null;

                return (
                  <div key={member.value} className="commission-item">
                    <div className="commission-header">
                      <Avatar src={user.avatar} name={user.name} size="small" />
                      <div className="commission-user-info">
                        <div className="commission-name">{user.name}</div>
                        <div className="commission-info">
                          {user.commissionPercentage}% {user.commissionType === 'fixed' ? 'Fixed' : 'Recurring'}
                        </div>
                      </div>
                      <label className="commission-toggle">
                        <input
                          type="checkbox"
                          checked={!!commissionInfo.isActive}
                          onChange={(e) => {
                            const isActive = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              commissionData: {
                                ...prev.commissionData,
                                [member.value]: {
                                  percentage: user.commissionPercentage,
                                  type: user.commissionType,
                                  recurringMonths: prev.commissionData[member.value]?.recurringMonths || null,
                                  isActive: isActive,
                                  startMonth: isActive ? getCurrentMonthYear() : null
                                }
                              }
                            }));
                          }}
                        />
                        <span>Active</span>
                      </label>
                    </div>
                    {commissionInfo.isActive && user.commissionType === 'recurring' && (
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label htmlFor={`recurringMonths-${member.value}`}>
                          Duration (Months) <span className="required">*</span>
                        </label>
                        <div className="input-wrapper">
                          <input
                            type="number"
                            id={`recurringMonths-${member.value}`}
                            value={commissionInfo.recurringMonths || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              const numValue = parseInt(value, 10);
                              setFormData(prev => ({
                                ...prev,
                                commissionData: {
                                  ...prev.commissionData,
                                  [member.value]: {
                                    ...prev.commissionData[member.value],
                                    recurringMonths: value === '' ? '' : (!isNaN(numValue) && numValue > 0 ? numValue : prev.commissionData[member.value]?.recurringMonths || '')
                                  }
                                }
                              }));
                            }}
                            placeholder="Enter number of months"
                            min="1"
                            step="1"
                            required={commissionInfo.isActive && user.commissionType === 'recurring'}
                          />
                        </div>
                      </div>
                    )}
                    {commissionInfo.isActive && commissionInfo.startMonth && (
                      <div className="commission-month">
                        Started: {new Date(commissionInfo.startMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="project-management">
      <PageTitle 
        title={currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? "Project Management" : "My Projects"}
        subtitle={currentUser?.role === 'super_manager' || currentUser?.role === 'manager' ? "Create and manage your team's projects" : "View your assigned projects"}
        icon={FiFolder}
        showBackButton={true}
        backTo="/dashboard"
        actions={
          <>
            <div className="filters-container">
              <div className={`search-box ${searchTerm.trim() ? 'search-active' : ''}`}>
                <FiSearch size={16} />
                <input
                  type="text"
                  placeholder="Search projects..."
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
              {currentUser?.role === 'super_manager' && (
                <div className="manager-filter">
                  <Select
                    options={managerFilterOptions}
                    value={selectedManager}
                    onChange={setSelectedManager}
                    placeholder="Filter by manager"
                    isClearable
                    styles={reactSelectStyles}
                    components={{ Option: CustomOption }}
                  />
                </div>
              )}
            </div>
            {isBdManager && (
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus size={16} />
                Create Project
              </Button>
            )}
          </>
        }
      />

      <div className="projects-grid">
        <div className="projects-grid-header">
          <div className="project-filters-row">
            <div className="project-filter-dropdown">
              <Select
                options={projectFilterOptions}
                value={projectFilterOptions.find(option => option.value === projectFilter)}
                onChange={(selected) => setProjectFilter(selected.value)}
                styles={reactSelectStyles}
                placeholder="Filter projects"
              />
            </div>
            <div className="project-filter-dropdown">
              <Select
                options={projectTypeOptions}
                value={selectedProjectType}
                onChange={setSelectedProjectType}
                isClearable
                styles={reactSelectStyles}
                placeholder="Project Type"
              />
            </div>
            <div className="project-filter-dropdown">
              <Select
                options={priorityOptions}
                value={selectedPriority}
                onChange={setSelectedPriority}
                isClearable
                styles={reactSelectStyles}
                placeholder="Priority"
              />
            </div>
          </div>
        </div>
        <div className="projects-grid-list">
          {filteredProjects?.length > 0 ? (
            filteredProjects.map((project, index) => (
            <div key={project.id} className="project-card-container">
              <ProjectCard
                project={project}
                taskCount={tasks.filter(t => t.projectId === project.id).length}
                tasks={tasks}
                index={index}
                users={allUsers}
                isCompleted={isProjectCompleted(project)}
              />
              {(() => {
                const isCompleted = isProjectCompleted(project);
                const allTasksDone = hasAllTasksCompleted(project);
                const isCreator = project.createdBy === currentUser.uid || project.managerId === currentUser.uid;
                const isManagerInProject = currentUser.role === 'manager' && 
                  project.teamMembers && 
                  project.teamMembers.includes(currentUser.uid);
                
                const canEdit = isCompleted 
                  ? permissionUtils.isSuperManager(currentUser)
                  : (permissionUtils.isSuperManager(currentUser) || isCreator || isManagerInProject || isBdManager);
                const canDelete = isCompleted 
                  ? currentUser.role === 'super_manager' || isCreator
                  : (currentUser.role === 'super_manager' || isCreator);
                const canMarkDone = !isCompleted && allTasksDone && 
                  (currentUser.role === 'super_manager' || currentUser.role === 'manager' || project.managerId === currentUser.uid);
                
                return (canEdit || canMarkDone) && (
                  <div className="project-actions">
                    {canMarkDone && (
                      <button
                        className="action-btn mark-done"
                        onClick={() => handleMarkAsDone(project)}
                        title="Mark as Done"
                      >
                        <FiCheck size={14} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="action-btn"
                        onClick={() => {
                          setSelectedProject(project);
                          const teamMembers = project.teamMembers ? project.teamMembers.map(id => {
                            const user = allUsers.find(u => u.id === id);
                            return user ? {
                              value: user.id,
                              label: user.name,
                              role: user.role === 'manager' ? 'Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1),
                              avatar: user.avatar
                            } : null;
                          }).filter(Boolean) : [];

                          const commissionData = {};
                          // Only load commission data for super_manager
                          if (currentUser?.role === 'super_manager') {
                            if (project.commissionData) {
                              Object.keys(project.commissionData).forEach(memberId => {
                                commissionData[memberId] = {
                                  ...project.commissionData[memberId],
                                  isActive: project.commissionData[memberId].isActive === true
                                };
                              });
                            }
                            
                            teamMembers.forEach(member => {
                              const user = allUsers.find(u => u.id === member.value || u.email === member.value);
                              if (user?.hasCommission && user?.commissionPercentage && !commissionData[member.value]) {
                                commissionData[member.value] = {
                                  percentage: user.commissionPercentage,
                                  type: user.commissionType,
                                  recurringMonths: user.commissionType === 'recurring' ? '' : null,
                                  isActive: false,
                                  startMonth: null
                                };
                              }
                            });
                          }

                          setFormData({
                            name: project.name,
                            description: project.description || '',
                            teamMembers: teamMembers,
                            status: project.status || 'active',
                            projectType: project.projectType || '',
                            priority: project.priority || '',
                            budget: project.budget || {
                              type: 'none',
                              fixedBudget: '',
                              hourlyRate: '',
                              payments: []
                            },
                            commissionData: commissionData
                          });
                          setShowEditModal(true);
                        }}
                        title="Edit Project"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteProject(project)}
                        title="Delete Project"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FiFolder size={48} />
            </div>
            <h3>No Projects Found</h3>
            <p>
              {searchTerm.trim() || selectedManager || selectedProjectType || selectedPriority
                ? "No projects match your current filters. Try adjusting your search or filter criteria."
                : "Get started by creating your first project to organize your team's work."
              }
            </p>
            {isBdManager && !searchTerm.trim() && !selectedManager && !selectedProjectType && !selectedPriority && (
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="create-first-project-btn"
              >
                <FiPlus size={16} />
                Create Your First Project
              </Button>
            )}
          </div>
        )}
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ 
            name: '', 
            description: '', 
            teamMembers: [],
            projectType: '',
            priority: '',
            budget: {
              type: 'none',
              fixedBudget: '',
              hourlyRate: '',
              payments: []
            }
          });
          setError('');
        }}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject}>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Project Type</label>
              <Select
                options={projectTypeOptions}
                value={projectTypeOptions.find(option => option.value === formData.projectType)}
                onChange={(selected) => {
                  const projectType = selected?.value || '';
                  setFormData(prev => ({
                    ...prev,
                    projectType,
                    ...(projectType === 'freelance' ? { budget: { ...prev.budget, tax: 10 } } : {})
                  }));
                }}
                styles={reactSelectStyles}
                placeholder="Select project type..."
                isClearable
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find(option => option.value === formData.priority)}
                onChange={(selected) => setFormData({ ...formData, priority: selected?.value || '' })}
                styles={reactSelectStyles}
                placeholder="Select priority..."
                isClearable
              />
            </div>
          </div>
          {renderTeamMemberSelect()}
          {isBdManager && (
            <BudgetManager
              value={formData.budget}
              onChange={(budget) => setFormData({ ...formData, budget })}
              disabled={loading}
              projectType={formData.projectType}
            />
          )}
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ 
                  name: '', 
                  description: '', 
                  teamMembers: [],
                  projectType: '',
                  priority: '',
                  budget: {
                    type: 'none',
                    fixedBudget: '',
                    hourlyRate: '',
                    payments: []
                  },
                  commissionData: {}
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
              loadingText="Creating Project..."
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
          setFormData({ 
            name: '', 
            description: '', 
            teamMembers: [],
            projectType: '',
            priority: '',
            budget: {
              type: 'none',
              fixedBudget: '',
              hourlyRate: '',
              payments: []
            },
            commissionData: {}
          });
          setError('');
        }}
        title="Edit Project"
      >
        <form onSubmit={handleEditProject}>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Project Type</label>
              <Select
                options={projectTypeOptions}
                value={projectTypeOptions.find(option => option.value === formData.projectType)}
                onChange={(selected) => {
                  const projectType = selected?.value || '';
                  setFormData(prev => ({
                    ...prev,
                    projectType,
                    ...(projectType === 'freelance' ? { budget: { ...prev.budget, tax: 10 } } : {})
                  }));
                }}
                styles={reactSelectStyles}
                placeholder="Select project type..."
                isClearable
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <Select
                options={priorityOptions}
                value={priorityOptions.find(option => option.value === formData.priority)}
                onChange={(selected) => setFormData({ ...formData, priority: selected?.value || '' })}
                styles={reactSelectStyles}
                placeholder="Select priority..."
                isClearable
              />
            </div>
          </div>
          {renderTeamMemberSelect()}
          {currentUser?.role === 'super_manager' && selectedProject && (
            <div className="form-group">
              <label>Project Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
          {isBdManager && (
            <BudgetManager
              value={formData.budget}
              onChange={(budget) => setFormData({ ...formData, budget })}
              disabled={loading}
              projectType={formData.projectType}
            />
          )}
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProject(null);
                setFormData({ 
                  name: '', 
                  description: '', 
                  teamMembers: [],
                  projectType: '',
                  priority: '',
                  budget: {
                    type: 'none',
                    fixedBudget: '',
                    hourlyRate: '',
                    payments: []
                  }
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
              loadingText="Updating Project..."
            >
              Update Project
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingProject(null);
          setError('');
        }}
        title="Delete Project"
      >
        <div className="delete-confirmation">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <p>Are you sure you want to delete the project "<strong>{deletingProject?.name}</strong>"?</p>
          <p className="text-muted">This action cannot be undone. All tasks associated with this project will also be deleted.</p>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingProject(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={confirmDeleteProject}
              loading={loading}
              loadingText="Deleting Project..."
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showMarkDoneConfirm}
        onClose={() => {
          setShowMarkDoneConfirm(false);
          setMarkingDoneProject(null);
          setError('');
        }}
        title="Mark Project as Completed"
      >
        <div className="delete-confirmation">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <p>Are you sure you want to mark the project "<strong>{markingDoneProject?.name}</strong>" as completed?</p>
          <p className="text-muted">This will move the project to the completed projects section.</p>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowMarkDoneConfirm(false);
                setMarkingDoneProject(null);
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={confirmMarkAsDone}
              loading={loading}
              loadingText="Marking as Done..."
            >
              Mark as Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectManagement; 