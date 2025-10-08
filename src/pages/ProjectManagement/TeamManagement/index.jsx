import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMail, 
  FiUser,
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUserPlus,
  FiShield,
  FiUserCheck,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { formatTimestamp } from '../../utils/dateUtils';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Avatar from '../../components/Avatar';
import { generateAvatarUrl } from '../../utils/avatarUtils';
import './TeamManagement.scss';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebase';
import { setDoc, doc } from 'firebase/firestore';

const TeamManagement = () => {
  const { currentUser, canManageEmployees } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'designer',
    permissions: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    if (newUser.role === 'super_manager') {
      const existingSuperManager = users.find(user => user.role === 'super_manager');
      if (existingSuperManager) {
        setError('A Super Manager already exists. Only one Super Manager is allowed.');
        setLoading(false);
        return;
      }
    }

    try {
      let permissions = [];
      switch (newUser.role) {
        case 'super_manager':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['edit_tasks', 'delete_tasks', 'move_tasks', 'manage_tasks', 'assign_tasks'];
          break;
        case 'designer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'developer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'bd':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        default:
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
      }

      const userProfile = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: permissions,
        avatar: generateAvatarUrl(newUser.name),
        isActive: true,
        createdBy: currentUser.uid,
        createdAt: new Date()
      };

      await userManagementService.createUserWithoutSignIn({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        permissions: permissions
      });

      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'designer',
        permissions: []
      });
      setShowAddUser(false);
      
      await loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already exists');
      } else {
        setError('Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (editingUser.role === 'super_manager') {
      const existingSuperManager = users.find(user => 
        user.role === 'super_manager' && user.id !== editingUser.id
      );
      if (existingSuperManager) {
        setError('A Super Manager already exists. Only one Super Manager is allowed.');
        setLoading(false);
        return;
      }
    }

    try {
      let permissions = [];
      switch (editingUser.role) {
        case 'super_manager':
          permissions = ['all'];
          break;
        case 'manager':
          permissions = ['edit_tasks', 'delete_tasks', 'move_tasks', 'manage_tasks', 'assign_tasks'];
          break;
        case 'designer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'developer':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        case 'bd':
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
          break;
        default:
          permissions = ['move_tasks', 'view_own_tasks', 'assign_tasks'];
      }

      await userManagementService.updateUserRole(editingUser.id, editingUser.role, permissions);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userManagementService.updateUserRole(userId, 'inactive', []);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_manager': return 'danger';
      case 'manager': return 'warning';
      case 'designer': return 'info';
      case 'developer': return 'primary';
      case 'bd': return 'success';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_manager': return 'Super Manager';
      case 'manager': return 'Manager';
      case 'designer': return 'Designer';
      case 'developer': return 'Developer';
      case 'bd': return 'Business Developer';
      default: return role;
    }
  };

  const roles = [
    { value: 'designer', label: 'Designer', description: 'Can manage design tasks and assign to team' },
    { value: 'developer', label: 'Developer', description: 'Can manage development tasks and assign to team' },
    { value: 'bd', label: 'Business Developer', description: 'Can manage business tasks and assign to team' },
    { value: 'manager', label: 'Manager', description: 'Can edit, delete, and manage all tasks' },
    { value: 'super_manager', label: 'Super Manager', description: 'Full access to all features' }
  ];

  const activeUsers = users.filter(user => user.isActive);
  const inactiveUsers = users.filter(user => !user.isActive);
  
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = activeUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(activeUsers.length / usersPerPage);

  const getRoleStats = () => {
    const roles = ['designer', 'developer', 'bd', 'manager', 'super_manager'];
    return roles.map(role => {
      const roleMembers = users.filter(user => user.role === role && user.isActive);
      
      return {
        role: role,
        members: roleMembers.length,
        displayName: getRoleDisplayName(role)
      };
    }).filter(stat => stat.members > 0);
  };

  return (
    <div className="page-container">
      <PageTitle 
        title="Project Management"
        subtitle="Create and manage projects, assign team members, and track progress"
        icon={FiUsers}
        actions={
          canManageEmployees() && (
            <button 
              className="btn btn--primary"
              onClick={() => setShowAddUser(true)}
            >
              <FiUserPlus size={16} />
              Add Team Member
            </button>
          )
        }
      />

      {}
      <div className="teams-overview">
        <h2>Roles Overview</h2>
        <div className="teams-grid">
          {getRoleStats().map((roleStat, index) => (
              <motion.div
              key={roleStat.role}
                className="team-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="team-header">
                <h3>{roleStat.displayName}</h3>
                <span className="member-count">{roleStat.members} members</span>
                </div>
                <div className="team-stats">
                  <div className="stat">
                  <span className="stat-value">{roleStat.members}</span>
                    <span className="stat-label">Members</span>
                  </div>
                </div>
                <div className="team-members">
                {users
                  .filter(user => user.role === roleStat.role && user.isActive)
                  .slice(0, 3)
                  .map(user => (
                    <div key={user.id} className="member-avatar">
                      <img src={user.avatar} alt={user.name} />
                      <span className="member-name">{user.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
          ))}
        </div>
      </div>

      {}
      <div className="employees-section">
        <h2>Active Team Members ({activeUsers.length})</h2>
        <div className="employees-grid">
          {currentUsers.map((user, index) => (
              <motion.div
              key={user.id}
                className="employee-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="employee-header">
                  <div className="employee-info">
                    <Avatar 
                      src={user.avatar} 
                      name={user.name}
                      size="large"
                      className="employee-avatar"
                    />
                    <div className="employee-details">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                      <div className="employee-badges">
                      <span className={`badge badge--${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="employee-actions">
                    {canManageEmployees() && (
                      <>
                        <button 
                          className="action-btn"
                        onClick={() => setEditingUser(user)}
                        >
                          <FiEdit2 size={16} />
                        </button>
                      {user.id !== currentUser.uid && (
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                      </>
                    )}
                  </div>
                </div>

                <div className="employee-stats">
                  <div className="stat-item">
                  <FiUserCheck size={16} />
                  <span>Active Member</span>
                  </div>
                  <div className="stat-item">
                  <FiShield size={16} />
                  <span>{user.permissions?.includes('all') ? 'All Permissions' : user.permissions?.join(', ') || 'Basic Access'}</span>
                  </div>
                </div>

                <div className="employee-joined">
                  <FiCalendar size={14} />
                <span>Joined {formatTimestamp(user.createdAt)}</span>
                </div>
              </motion.div>
          ))}
        </div>
      </div>

      {}
      {inactiveUsers.length > 0 && (
        <div className="employees-section">
          <h2>Inactive Members</h2>
          <div className="employees-grid inactive">
            {inactiveUsers.map((user, index) => (
              <motion.div
                key={user.id}
                className="employee-card inactive"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="employee-header">
                  <div className="employee-info">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="employee-avatar"
                    />
                    <div className="employee-details">
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      <span className="inactive-label">Inactive</span>
                    </div>
                  </div>
                  <div className="employee-actions">
                    {canManageEmployees() && (
                      <button 
                        className="action-btn"
                        onClick={() => handleEditUser({ ...user, isActive: true })}
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
        
        {}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '20px' 
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                background: currentPage === 1 ? '#f8f9fa' : 'white',
                color: currentPage === 1 ? '#adb5bd' : '#333',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  background: currentPage === page ? '#15a970' : 'white',
                  color: currentPage === page ? 'white' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  minWidth: '40px'
                }}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                background: currentPage === totalPages ? '#f8f9fa' : 'white',
                color: currentPage === totalPages ? '#adb5bd' : '#333',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Next
            </button>
        </div>
      )}

      {}
      <Modal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add New Team Member"
        size="medium"
      >
        <form onSubmit={handleAddUser}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input 
                type="text"
                id="name"
                name="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
                required
                  />
                </div>
                  </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiShield className="input-icon" />
            <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
              required
            />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <FiShield className="input-icon" />
            <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              required
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Team Member'}
            </button>
          </div>
        </form>
      </Modal>

      {}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Team Member"
        size="medium"
      >
        <form onSubmit={handleEditUser}>
          {error && (
            <div className="error-message">
              <FiUser size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="editName">Full Name</label>
            <input
              type="text"
              id="editName"
              name="name"
              value={editingUser?.name || ''}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editEmail">Email Address</label>
            <input
              type="email"
              id="editEmail"
              name="email"
              value={editingUser?.email || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="editRole">Role</label>
            <select
              id="editRole"
              name="role"
              value={editingUser?.role || ''}
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              required
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn--secondary"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Team Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamManagement; 