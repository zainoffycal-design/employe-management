import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getRoleDisplayName } from '../../utils/permissionUtils';
import { getRoleBadgeColor, groupAndSortUsers } from '../../utils/uiUtils';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import './UserManagement.scss';



const UserCard = ({ user, onEdit, onDelete, canManageUsers, isCurrentUser = false, onResendInvitation, isSuperManager = false, currentUserRole = null, index = 0 }) => {
  return (
    <motion.div 
      className={`user-card ${isCurrentUser ? 'current-user' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
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
          <span className={`badge badge--status ${user.status}`}>
            {user.status === 'active' ? 'Active' : 
             user.status === 'invited' ? 'Invited' : 
             user.status === 'inactive' ? 'Inactive' : 'Unknown'}
          </span>
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
    </motion.div>
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
    permissions: [],
    managerType: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditUser, setShowEditUser] = useState(false);

  const getAvailableRoles = () => {
    const roles = [
      { value: 'designer', label: 'Designer', description: 'Can manage design tasks and assign to team' },
      { value: 'developer', label: 'Developer', description: 'Can manage development tasks and assign to team' },
      { value: 'bd', label: 'Business Developer', description: 'Can manage business tasks and assign to team' }
    ];

    if (currentUser.role === 'super_manager') {
      roles.unshift(
        { value: 'manager', label: 'Manager', description: 'Can edit, delete, and manage all tasks' }
      );
    } else if (currentUser.role === 'manager') {
      return roles;
    }

    return roles;
  };

  const activeUsers = users.filter(user => user.isActive !== false || user.status === 'invited');
  const allUsersIncludingCurrent = [...activeUsers];
  const currentUserExists = activeUsers.some(user => 
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

  const customGroupedUsers = allUsersIncludingCurrent.reduce((acc, user) => {
    if (user.role === 'manager' && user.managerType) {
      const teamRole = user.managerType;
      if (!acc[teamRole]) {
        acc[teamRole] = [];
      }
      acc[teamRole].push({ ...user, isManager: true });
    } else if (user.role === 'manager' && !user.managerType) {
      if (!acc['manager']) {
        acc['manager'] = [];
      }
      acc['manager'].push(user);
    } else {
      const role = user.role || 'user';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(user);
    }
    return acc;
  }, {});

  Object.keys(customGroupedUsers).forEach(role => {
    customGroupedUsers[role].sort((a, b) => {
      if (a.isManager && !b.isManager) return -1;
      if (!a.isManager && b.isManager) return 1;
      return a.name.localeCompare(b.name);
    });
  });

  const groupedUsers = customGroupedUsers;
  const roleOrder = ['super_manager', 'designer', 'developer', 'bd', 'manager'];

  if (!canManageUsers()) {
    return (
      <motion.div 
        className="page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="access-denied">
          <FiShield size={48} />
          <h3>Access Denied</h3>
          <p>You don't have permission to access user management.</p>
        </div>
      </motion.div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
      
      const managersWithoutType = allUsers.filter(user => 
        user.role === 'manager' && (!user.managerType || user.managerType === '')
      );
      
      if (managersWithoutType.length > 0) {
        console.log('⚠️ Managers without managerType assigned:', managersWithoutType.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          managerType: m.managerType || 'NOT ASSIGNED'
        })));
      } else {
        console.log('✅ All managers have managerType assigned');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (newUser.role === 'manager' && !newUser.managerType) {
        setError('Please select a manager type for the manager.');
        setLoading(false);
        return;
      }

      const emailExists = users.some(user => 
        user.email.toLowerCase() === newUser.email.toLowerCase() && user.isActive !== false
      );
      
      if (emailExists) {
        setError('A user with this email already exists. Please use a different email.');
        setLoading(false);
        return;
      }

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

      const invitationData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: permissions
      };

      if (newUser.role === 'manager' && newUser.managerType) {
        invitationData.managerType = newUser.managerType;
      }

      await emailService.createUserInvitation(invitationData);

      setNewUser({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'designer',
        permissions: [],
        managerType: ''
      });
      setShowAddUser(false);
      
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

      if (currentUser.role === 'manager') {
        const existingUser = users.find(user => user.id === editingUser.id);
        if (existingUser.role === 'super_manager' || existingUser.role === 'manager' ||
            editingUser.role === 'super_manager' || editingUser.role === 'manager') {
          setError('You do not have permission to modify manager or super manager roles.');
          setLoading(false);
          return;
        }
      }

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

      const updateData = {
        name: editingUser.name,
        role: editingUser.role,
        permissions: permissions
      };

      if (editingUser.role === 'manager' && editingUser.managerType) {
        updateData.managerType = editingUser.managerType;
      } else if (editingUser.role !== 'manager') {
        updateData.managerType = null;
      }

      await userManagementService.updateUserProfile(editingUser.id, updateData);
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
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await userManagementService.deleteUser(userId);
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
    setEditingUser({
      ...user,
      managerType: user.managerType || ''
    });
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
          
          if (usersInRole.length === 0) return null;

          const managersInRole = usersInRole.filter(user => {
            if (role === 'manager') {
              return user.role === 'manager' && (!user.managerType || user.managerType === '');
            }
            return user.isManager || (user.role === 'manager' && user.managerType === role);
          });
          const regularUsersInRole = usersInRole.filter(user => {
            if (role === 'manager') {
              return false;
            }
            return !user.isManager && user.role !== 'manager';
          });

          return (
            <motion.div 
              key={role} 
              className="role-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="role-title">{getRoleDisplayName(role)}</h2>
              
              {role === 'manager' ? (
                <div className="users-list">
                  {usersInRole.map((user, index) => (
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
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <>
                  {managersInRole.length > 0 && (
                    <div className="users-list users-list--managers">
                      {managersInRole.map((user, index) => (
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
                          index={index}
                        />
                      ))}
                    </div>
                  )}

                  {regularUsersInRole.length > 0 && (
                    <div className="users-list">
                      {regularUsersInRole.map((user, index) => (
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
                          index={managersInRole.length + index}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {}
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
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value, managerType: e.target.value !== 'manager' ? '' : newUser.managerType })}
              required
            >
              {getAvailableRoles().map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {currentUser.role === 'super_manager' && newUser.role === 'manager' && (
            <div className="form-group">
              <label htmlFor="managerType">Manager Type</label>
              <select
                id="managerType"
                name="managerType"
                value={newUser.managerType}
                onChange={(e) => setNewUser({ ...newUser, managerType: e.target.value })}
                required
              >
                <option value="">Select Manager Type</option>
                <option value="designer">Designer Manager</option>
                <option value="developer">Developer Manager</option>
                <option value="bd">Business Developer Manager</option>
              </select>
            </div>
          )}

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
              loadingText="Sending Invitation..."
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {}
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
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value, managerType: e.target.value !== 'manager' ? '' : editingUser.managerType })}
              required
            >
              {getAvailableRoles().map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {currentUser.role === 'super_manager' && editingUser?.role === 'manager' && (
            <div className="form-group">
              <label htmlFor="editManagerType">Manager Type</label>
              <select
                id="editManagerType"
                name="managerType"
                value={editingUser?.managerType || ''}
                onChange={(e) => setEditingUser({ ...editingUser, managerType: e.target.value })}
                required
              >
                <option value="">Select Manager Type</option>
                <option value="designer">Designer Manager</option>
                <option value="developer">Developer Manager</option>
                <option value="bd">Business Developer Manager</option>
              </select>
            </div>
          )}

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
              loadingText="Updating User..."
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