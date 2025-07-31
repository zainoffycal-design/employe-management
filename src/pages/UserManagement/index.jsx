import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiMail, 
  FiUser,
  FiUsers,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiEdit3
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { emailService } from '../../services/emailService';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import './UserManagement.scss';

// Add a function to sort and group users by role
const groupAndSortUsers = (users) => {
  // Define role order
  const roleOrder = {
    'super_manager': 0,
    'manager': 1,
    'designer': 2,
    'developer': 3,
    'bd': 4
  };

  // Group users by role
  const groupedUsers = users.reduce((acc, user) => {
    // Normalize role name to handle potential variations
    const normalizedRole = user.role?.toLowerCase().replace(/[^a-z]/g, '') || 'user';
    const role = normalizedRole === 'supermanager' ? 'super_manager' : normalizedRole;
    
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {});

  // Sort users within each role group by name
  Object.keys(groupedUsers).forEach(role => {
    groupedUsers[role].sort((a, b) => a.name.localeCompare(b.name));
  });

  return groupedUsers;
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

const UserCard = ({ user, onEdit, onDelete, canManageUsers, isCurrentUser = false, onResendInvitation, isSuperManager = false, currentUserRole = null }) => {
  return (
    <div className={`user-card ${isCurrentUser ? 'current-user' : ''}`}>
      <Avatar 
        src={user.avatar}
        name={user.name}
        size="large"
        className="user-avatar"
      />
      <div className="user-info">
        <h3>
          {user.name}
          {isCurrentUser && <span className="current-user-badge">You</span>}
        </h3>
        <div className="user-email">
          <FiMail />
          {user.email}
        </div>
        <div className="user-details-row">
          <div className={`badge badge--role ${getRoleBadgeColor(user.role)}`}>
            {getRoleDisplayName(user.role)}
          </div>
          {!isSuperManager && (
            <span className={`badge badge--status ${user.status}`}>
              {user.status === 'active' ? 'Active' : 
               user.status === 'invited' ? 'Invited' : 
               user.status === 'inactive' ? 'Inactive' : 'Unknown'}
            </span>
          )}
        </div>
      </div>
      {canManageUsers && !isCurrentUser && (
        <div className="user-actions">
          {!isSuperManager && user.status === 'invited' && (
            <button
              className="action-btn resend"
              onClick={() => onResendInvitation(user.email)}
              title="Resend invitation"
            >
              <FiMail />
            </button>
          )}
          {/* Hide edit/delete buttons for super managers when current user is manager */}
          {!(currentUserRole === 'manager' && isSuperManager) && (
            <>
              <button
                className="action-btn edit"
                onClick={() => onEdit(user)}
                title="Edit user"
              >
                <FiEdit3 />
              </button>
              <button
                className="action-btn delete"
                onClick={() => onDelete(user.id)}
                title="Delete user"
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser, canManageUsers } = useAuth();
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
  const [showEditUser, setShowEditUser] = useState(false); // New state for edit modal

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    const roles = [
      { value: 'designer', label: 'Designer', description: 'Can manage design tasks and assign to team' },
      { value: 'developer', label: 'Developer', description: 'Can manage development tasks and assign to team' },
      { value: 'bd', label: 'Business Developer', description: 'Can manage business tasks and assign to team' }
    ];

    // Only super manager can create managers
    if (currentUser.role === 'super_manager') {
      // Add manager role at the beginning
      roles.unshift(
        { value: 'manager', label: 'Manager', description: 'Can edit, delete, and manage all tasks' }
      );
    } else if (currentUser.role === 'manager') {
      // Managers can only create regular users
      return roles;
    }

    return roles;
  };

  // Add current user to the list if they're not already included
  const allUsersIncludingCurrent = [...users];
  const currentUserExists = users.some(user => 
    user.id === currentUser.uid || 
    user.email === currentUser.email ||
    (user.uid && user.uid === currentUser.uid)
  );
  
  if (!currentUserExists) {
    allUsersIncludingCurrent.push({
      id: currentUser.uid,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      avatar: currentUser.avatar,
      isActive: true,
      permissions: currentUser.permissions || []
    });
  }

  const groupedUsers = groupAndSortUsers(allUsersIncludingCurrent);
  const roleOrder = ['super_manager', 'manager', 'designer', 'developer', 'bd'];

  // Check if user has access to user management
  if (!canManageUsers()) {
    return (
      <div className="page-container">
        <div className="access-denied">
          <FiShield size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  // Load users on mount
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

    try {
      // Set user permissions based on role
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

      // Create user invitation instead of creating auth account
      await emailService.createUserInvitation({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: permissions
      });

      // Reset form
      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'designer',
        permissions: []
      });
      setShowAddUser(false);
      
      // Reload users
      await loadUsers();
    } catch (error) {
      console.error('Error creating user invitation:', error);
      setError(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if trying to change role to super manager and one already exists
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

      // Only super manager can edit roles to manager or super manager
      if (currentUser.role === 'manager') {
        const existingUser = users.find(user => user.id === editingUser.id);
        if (existingUser.role === 'super_manager' || existingUser.role === 'manager' ||
            editingUser.role === 'super_manager' || editingUser.role === 'manager') {
          setError('You do not have permission to modify manager or super manager roles.');
          setLoading(false);
          return;
        }
      }

      // Set user permissions based on role
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

      await userManagementService.updateUserProfile(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        permissions: permissions
      });
      setEditingUser(null);
      setShowEditUser(false);
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
        // Note: This would require additional Firebase Auth manager SDK for production
        // For now, we'll just mark the user as inactive
        await userManagementService.updateUserRole(userId, 'inactive', []);
        await loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleResendInvitation = async (email) => {
    try {
      setLoading(true);
      await emailService.resendInvitation(email);
    } catch (error) {
      console.error('Error resending invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setShowEditUser(true);
  };

  return (
    <div className="user-management">
      <PageTitle 
        title="User Management"
        subtitle="Manage your team members and their roles"
        icon={FiUsers}
        showBackButton={true}
        backTo="/dashboard"
        actions={
          canManageUsers && (
            <Button
              variant="primary"
            onClick={() => setShowAddUser(true)}
          >
            <FiUserPlus /> Add New User
            </Button>
          )
        }
      />

      <div className="users-container">
        {roleOrder.map(role => {
          const usersInRole = groupedUsers[role] || [];
          
          // Only show sections that have users
          if (usersInRole.length === 0) return null;

          return (
            <div key={role} className="role-section">
              <h2 className="role-title">{getRoleDisplayName(role)}</h2>
              <div className="users-list">
                {usersInRole.map(user => (
                                      <UserCard
                      key={user.id}
                      user={user}
                      onEdit={openEditUserModal}
                      onDelete={handleDeleteUser}
                      canManageUsers={canManageUsers}
                      isCurrentUser={user.id === currentUser.uid}
                      onResendInvitation={handleResendInvitation}
                      isSuperManager={user.role === 'super_manager'}
                      currentUserRole={currentUser.role}
                    />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        title="Add New User"
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
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              required
            >
              {getAvailableRoles().map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowAddUser(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              loading={loading}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditUser}
        onClose={() => setShowEditUser(false)}
        title="Edit User"
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
              {getAvailableRoles().map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <Button 
              variant="secondary"
              onClick={() => setShowEditUser(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              loading={loading}
            >
              Update User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;