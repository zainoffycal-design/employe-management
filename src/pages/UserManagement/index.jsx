import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrash2, 
  FiMail, 
  FiUser,
  FiUsers,
  FiShield,
  FiUserPlus,
  FiEdit3
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { userManagementService } from '../../services/firebaseService';
import { emailService } from '../../services/emailService';
import { getRoleDisplayName, permissionUtils, ROLES, PERMISSIONS } from '../../utils/permissionUtils';
import { getRoleBadgeColor } from '../../utils/uiUtils';
import Modal from '../../components/Modal';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import './UserManagement.scss';

const STATUS_DISPLAY = {
  active: 'Active',
  invited: 'Invited',
  inactive: 'Inactive'
};

const MANAGER_TYPE_OPTIONS = [
  { value: 'designer', label: 'Designer Manager' },
  { value: 'developer', label: 'Developer Manager' },
  { value: 'bd', label: 'Business Developer Manager' }
];

const ROLE_OPTIONS = [
  { value: 'designer', label: 'Designer', description: 'Can manage design tasks and assign to team' },
  { value: 'developer', label: 'Developer', description: 'Can manage development tasks and assign to team' },
  { value: 'bd', label: 'Business Developer', description: 'Can manage business tasks and assign to team' }
];

const getPermissionsForRole = (role) => {
  const permissionMap = {
    [ROLES.SUPER_MANAGER]: ['all'],
    [ROLES.MANAGER]: [
      PERMISSIONS.EDIT_TASKS,
      PERMISSIONS.DELETE_TASKS,
      PERMISSIONS.MOVE_TASKS,
      PERMISSIONS.MANAGE_TASKS,
      PERMISSIONS.ASSIGN_TASKS
    ],
    [ROLES.DESIGNER]: [
      PERMISSIONS.MOVE_TASKS,
      PERMISSIONS.VIEW_OWN_TASKS,
      PERMISSIONS.ASSIGN_TASKS
    ],
    [ROLES.DEVELOPER]: [
      PERMISSIONS.MOVE_TASKS,
      PERMISSIONS.VIEW_OWN_TASKS,
      PERMISSIONS.ASSIGN_TASKS
    ],
    [ROLES.BD]: [
      PERMISSIONS.MOVE_TASKS,
      PERMISSIONS.VIEW_OWN_TASKS,
      PERMISSIONS.ASSIGN_TASKS
    ]
  };
  return permissionMap[role] || permissionMap[ROLES.DESIGNER];
};

const normalizeManagerType = (managerType) => {
  return Array.isArray(managerType) ? managerType : (managerType ? [managerType] : []);
};



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
            {STATUS_DISPLAY[user.status] || 'Unknown'}
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
    managerType: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditUser, setShowEditUser] = useState(false);

  const availableRoles = useMemo(() => {
    const roles = [...ROLE_OPTIONS];
    if (permissionUtils.canCreateManager(currentUser)) {
      roles.unshift({ value: 'manager', label: 'Manager', description: 'Can edit, delete, and manage all tasks' });
    }
    return roles;
  }, [currentUser]);

  const activeUsers = useMemo(() => 
    users.filter(user => user.isActive !== false || user.status === 'invited'),
    [users]
  );

  const allUsersIncludingCurrent = useMemo(() => {
    const currentUserExists = activeUsers.some(user => 
      user.id === currentUser.uid || 
      user.email === currentUser.email ||
      (user.uid && user.uid === currentUser.uid)
    );
    
    if (currentUserExists) {
      return activeUsers;
    }
    
    return [
      ...activeUsers,
      {
        id: currentUser.uid,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
        isActive: true,
        permissions: currentUser.permissions || []
      }
    ];
  }, [activeUsers, currentUser]);

  const groupedUsers = useMemo(() => {
    const grouped = allUsersIncludingCurrent.reduce((acc, user) => {
      if (user.role === ROLES.MANAGER) {
        const managerTypes = normalizeManagerType(user.managerType);
        if (managerTypes.length > 0) {
          managerTypes.forEach(teamRole => {
            if (teamRole) {
              if (!acc[teamRole]) {
                acc[teamRole] = [];
              }
              acc[teamRole].push({ ...user, isManager: true });
            }
          });
        } else {
          if (!acc[ROLES.MANAGER]) {
            acc[ROLES.MANAGER] = [];
          }
          acc[ROLES.MANAGER].push(user);
        }
      } else {
        const role = user.role || 'user';
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push(user);
      }
      return acc;
    }, {});

    Object.keys(grouped).forEach(role => {
      grouped[role].sort((a, b) => {
        if (a.isManager && !b.isManager) return -1;
        if (!a.isManager && b.isManager) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [allUsersIncludingCurrent]);

  const roleOrder = useMemo(() => 
    permissionUtils.isSuperManager(currentUser) 
      ? ['super_manager', 'designer', 'developer', 'bd', 'manager']
      : ['designer', 'developer', 'bd', 'manager'],
    [currentUser]
  );

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

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (newUser.role === 'manager' && (!newUser.managerType || newUser.managerType.length === 0)) {
        setError('Please select at least one manager type for the manager.');
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

      const permissions = getPermissionsForRole(newUser.role);

      const invitationData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permissions: permissions
      };

      if (newUser.role === 'manager' && newUser.managerType && newUser.managerType.length > 0) {
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
        managerType: []
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
      if (editingUser.role === ROLES.SUPER_MANAGER) {
        const existingSuperManager = users.find(user =>
          user.role === ROLES.SUPER_MANAGER && user.id !== editingUser.id
        );
        if (existingSuperManager) {
          setError('A Super Manager already exists. Only one Super Manager is allowed.');
          setLoading(false);
          return;
        }
      }

      if (editingUser.role === ROLES.MANAGER && (!editingUser.managerType || editingUser.managerType.length === 0)) {
        setError('Please select at least one manager type for the manager.');
        setLoading(false);
        return;
      }

      if (permissionUtils.isManager(currentUser) && !permissionUtils.isSuperManager(currentUser)) {
        const existingUser = users.find(user => user.id === editingUser.id);
        if (existingUser.role === ROLES.SUPER_MANAGER || existingUser.role === ROLES.MANAGER ||
            editingUser.role === ROLES.SUPER_MANAGER || editingUser.role === ROLES.MANAGER) {
          setError('You do not have permission to modify manager or super manager roles.');
          setLoading(false);
          return;
        }
      }

      const permissions = getPermissionsForRole(editingUser.role);

      const updateData = {
        name: editingUser.name,
        role: editingUser.role,
        permissions: permissions
      };

      if (editingUser.role === 'manager' && editingUser.managerType && editingUser.managerType.length > 0) {
        updateData.managerType = editingUser.managerType;
      } else if (editingUser.role !== 'manager') {
        updateData.managerType = null;
      } else if (editingUser.role === 'manager') {
        updateData.managerType = [];
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


  const openEditUserModal = useCallback((user) => {
    setEditingUser({
      ...user,
      managerType: normalizeManagerType(user.managerType)
    });
    setShowEditUser(true);
  }, []);

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

          const managersInRole = role === 'manager' 
            ? usersInRole.filter(user => {
                const managerTypes = normalizeManagerType(user.managerType);
                return user.role === ROLES.MANAGER && managerTypes.length === 0;
              })
            : usersInRole.filter(user => {
                if (user.isManager) return true;
                if (user.role === ROLES.MANAGER) {
                  const managerTypes = normalizeManagerType(user.managerType);
                  return managerTypes.includes(role);
                }
                return false;
              });
          
          const regularUsersInRole = role === 'manager' 
            ? []
            : usersInRole.filter(user => !user.isManager && user.role !== ROLES.MANAGER);

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
                      isSuperManager={permissionUtils.isSuperManager(user)}
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
                          isSuperManager={permissionUtils.isSuperManager(user)}
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
                          isSuperManager={permissionUtils.isSuperManager(user)}
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
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value, managerType: e.target.value !== 'manager' ? [] : newUser.managerType })}
              required
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {permissionUtils.canAssignManagerType(currentUser) && newUser.role === ROLES.MANAGER && (
            <div className="form-group">
              <label htmlFor="managerType">Manager Type</label>
              <div className="checkbox-group">
                {MANAGER_TYPE_OPTIONS.map(option => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={newUser.managerType.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewUser({ ...newUser, managerType: [...newUser.managerType, option.value] });
                        } else {
                          setNewUser({ ...newUser, managerType: newUser.managerType.filter(type => type !== option.value) });
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
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
              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value, managerType: e.target.value !== 'manager' ? [] : editingUser.managerType })}
              required
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {permissionUtils.canAssignManagerType(currentUser) && editingUser?.role === ROLES.MANAGER && (
            <div className="form-group">
              <label htmlFor="editManagerType">Manager Type</label>
              <div className="checkbox-group">
                {MANAGER_TYPE_OPTIONS.map(option => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={option.value}
                      checked={(editingUser?.managerType || []).includes(option.value)}
                      onChange={(e) => {
                        const currentTypes = editingUser.managerType || [];
                        if (e.target.checked) {
                          setEditingUser({ ...editingUser, managerType: [...currentTypes, option.value] });
                        } else {
                          setEditingUser({ ...editingUser, managerType: currentTypes.filter(type => type !== option.value) });
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
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