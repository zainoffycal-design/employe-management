import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiFolder, 
  FiPlus, 
  FiUsers, 
  FiLayout,
  FiEdit2,
  FiTrash2,
  FiSearch
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
import './ProjectManagement.scss';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const { projects, createProject, updateProject, deleteProject, tasks } = useTask();
  const { currentUser } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamMembers: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);

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
    .filter(user => user.role === 'manager' || user.role === 'super_manager')
    .map(user => ({
      value: user.id,
      label: user.name,
      role: user.role === 'super_manager' ? 'Super Manager' : 'Manager',
      avatar: user.avatar
    }));

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

      await createProject({
        ...formData,
        teamMembers: formData.teamMembers.map(member => member.value),
        managerId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      setShowCreateModal(false);
      setFormData({ name: '', description: '', teamMembers: [] });
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
      if (formData.teamMembers.length === 0) {
        setError('Please select at least one team member');
        setLoading(false);
        return;
      }

      await updateProject(selectedProject.id, {
        ...formData,
        teamMembers: formData.teamMembers.map(member => member.value)
      });
      setShowEditModal(false);
      setSelectedProject(null);
      setFormData({ name: '', description: '', teamMembers: [] });
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

  const filteredProjects = projects
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
        {filteredProjects?.length > 0 ? (
          filteredProjects.map((project, index) => (
            <div key={project.id} className="project-card-container">
              <ProjectCard
                project={project}
                taskCount={tasks.filter(t => t.projectId === project.id).length}
                tasks={tasks}
                index={index}
                users={allUsers}
              />
              {(currentUser.role === 'super_manager' || project.managerId === currentUser.uid) && (
                <div className="project-actions">
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
                        }))
                      });
                      setShowEditModal(true);
                    }}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteProject(project)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              )}
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

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', description: '', teamMembers: [] });
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
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', description: '', teamMembers: [] });
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
          setFormData({ name: '', description: '', teamMembers: [] });
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
          {renderTeamMemberSelect()}
          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProject(null);
                setFormData({ name: '', description: '', teamMembers: [] });
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

      {}
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
    </div>
  );
};

export default ProjectManagement; 