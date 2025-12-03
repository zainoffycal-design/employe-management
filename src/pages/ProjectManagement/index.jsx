import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    budget: {
      type: 'none',
      fixedBudget: '',
      hourlyRate: '',
      payments: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [projectFilter, setProjectFilter] = useState('active');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsersData = await userManagementService.getAllUsers();
        setAllUsers(allUsersData);
        const activeUsers = allUsersData.filter(user => 
          user.isActive && user.id !== currentUser.uid
        );
        setUsers(activeUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      }
    };
    fetchUsers();
  }, [currentUser.uid]);

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

      const projectData = {
        ...formData,
        teamMembers: formData.teamMembers.map(member => member.value),
        managerId: currentUser.uid,
        createdBy: currentUser.uid,
        status: 'active',
        createdAt: new Date().toISOString()
      };

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
        budget: {
          type: 'none',
          fixedBudget: '',
          hourlyRate: '',
          payments: []
        }
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

      const isBdUser = currentUser.role === 'bd';
      
      if (!isBdUser) {
        if (formData.teamMembers.length === 0) {
          setError('Please select at least one team member');
          setLoading(false);
          return;
        }
      }

      let projectData;
      
      if (isBdUser) {
        if (formData.budget && formData.budget.type !== 'none') {
          projectData = { budget: formData.budget };
        } else if (formData.budget && formData.budget.type === 'none') {
          projectData = { budget: null };
        } else {
          projectData = {};
        }
      } else {
        projectData = {
          ...formData,
          teamMembers: formData.teamMembers.map(member => member.value)
        };
        if (formData.budget.type === 'none') {
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
      }

      await updateProject(selectedProject.id, projectData);
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ 
        name: '', 
        description: '', 
        teamMembers: [],
        status: 'active',
        budget: {
          type: 'none',
          fixedBudget: '',
          hourlyRate: '',
          payments: []
        }
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

        return matchesSearch && matchesManager;
      })
      ?.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
  }, [projects, projectFilter, activeProjects, completedProjects, searchTerm, selectedManager, allUsers]);

  const renderTeamMemberSelect = () => (
    <div className="form-group">
      <label>Team Members</label>
      <Select
        isMulti
        options={groupedOptions}
        value={formData.teamMembers}
        onChange={(selected) => setFormData({
          ...formData,
          teamMembers: selected || []
        })}
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
  );

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
            {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') && (
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
          <div className="project-filter-dropdown">
            <Select
              options={projectFilterOptions}
              value={projectFilterOptions.find(option => option.value === projectFilter)}
              onChange={(selected) => setProjectFilter(selected.value)}
              styles={reactSelectStyles}
              placeholder="Filter projects"
            />
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
                  ? currentUser.role === 'super_manager'
                  : (currentUser.role === 'super_manager' || isCreator || isManagerInProject || currentUser.role === 'bd');
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
                          setFormData({
                            name: project.name,
                            description: project.description,
                            teamMembers: project.teamMembers.map(id => ({
                              value: id,
                              label: users.find(user => user.id === id)?.name || 'Unknown User'
                            })),
                            status: project.status || 'active',
                            budget: project.budget || {
                              type: 'none',
                              fixedBudget: '',
                              hourlyRate: '',
                              payments: []
                            }
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
              {searchTerm.trim() || selectedManager 
                ? "No projects match your current filters. Try adjusting your search or filter criteria."
                : "Get started by creating your first project to organize your team's work."
              }
            </p>
            {(currentUser?.role === 'super_manager' || currentUser?.role === 'manager') && !searchTerm.trim() && !selectedManager && (
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
          {renderTeamMemberSelect()}
          {(currentUser?.role === 'super_manager' || currentUser?.role === 'bd') && (
            <BudgetManager
              value={formData.budget}
              onChange={(budget) => setFormData({ ...formData, budget })}
              disabled={loading}
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
            budget: {
              type: 'none',
              fixedBudget: '',
              hourlyRate: '',
              payments: []
            }
          });
          setError('');
        }}
        title={currentUser?.role === 'bd' ? "Edit Project Budget" : "Edit Project"}
      >
        <form onSubmit={handleEditProject}>
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}
          {currentUser?.role !== 'bd' && (
            <>
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
            </>
          )}
          {(currentUser?.role === 'super_manager' || currentUser?.role === 'bd') && (
            <BudgetManager
              value={formData.budget}
              onChange={(budget) => setFormData({ ...formData, budget })}
              disabled={loading}
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
              loadingText={currentUser?.role === 'bd' ? "Updating Budget..." : "Updating Project..."}
            >
              {currentUser?.role === 'bd' ? "Update Budget" : "Update Project"}
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